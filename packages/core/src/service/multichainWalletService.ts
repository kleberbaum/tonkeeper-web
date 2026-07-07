import BigNumber from 'bignumber.js';
import { sha256_sync } from '@ton/crypto';

import { ChainId } from '../chains/types';

export const MULTICHAIN_API_BASE_URL = 'https://multi.tonkeeper.com/api/v1';

/**
 * Compute the canonical wallet identifier the multichain backend keys
 * on. Matches the iOS and Android derivation: hex-encoded SHA-256 of the
 * BIP39 mnemonic words joined by single spaces. The result is a
 * lowercase 64-character hex string.
 *
 * Stored on `AccountMultichain.multichainWalletId` at creation so the
 * runtime never needs the cleartext mnemonic to call the API.
 */
export function computeMultichainWalletId(mnemonic: string[]): string {
    return sha256_sync(mnemonic.join(' ')).toString('hex');
}

/**
 * Backend asset row. Mirrors the OpenAPI shape both native apps consume
 * (see `MultichainAPI.Types.AssetInfo` in iOS, `Asset` model in Android).
 *
 * `balance` is a string in the chain's smallest unit (wei / satoshi /
 * nanoton / sun / etc.); the UI converts via `decimals`.
 */
export interface MultichainWalletAsset {
    assetId: string;
    chain: ChainId;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    balance: string;
    isHidden: boolean;
    price?: BigNumber;
    diff24h?: string;
}

export interface MultichainWalletAssetsResponse {
    assets: MultichainWalletAsset[];
    /**
     * Backend-provided fiat rate of one currency in user's display
     * currency (echoed back, useful when the response stitches multiple
     * currency answers together). Keyed by uppercase currency code.
     */
    fiatPrice: Record<string, string>;
    /** Empty string means "no more pages". */
    nextCursor: string;
}

interface RawAsset {
    asset_id: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
}

interface RawPrice {
    prices?: Record<string, number>;
    diff_24h?: Record<string, string>;
    diff_7d?: Record<string, string>;
    diff_30d?: Record<string, string>;
}

interface RawAssetEntry {
    asset: RawAsset;
    price?: RawPrice;
    is_hidden: boolean;
    balance: string;
}

interface RawResponse {
    assets: RawAssetEntry[];
    fiat_price: Record<string, string>;
    next_cursor: string;
}

/**
 * `eth/mainnet/coin` → `'evm'`; `tron/mainnet/trc20/<addr>` → `'tron'`.
 * Returns `undefined` for chain segments the web side doesn't recognise
 * yet (e.g. arbitrary L2s the backend lists). Callers should drop those
 * rows rather than render them with no chain context.
 */
function chainIdFromAssetId(assetId: string): ChainId | undefined {
    const head = assetId.split('/')[0];
    switch (head) {
        case 'ton':
            return 'ton';
        case 'tron':
            return 'tron';
        case 'eth':
        case 'evm':
        case 'arb':
        case 'base':
        case 'bsc':
        case 'polygon':
        case 'avalanche':
            return 'evm';
        case 'btc':
            return 'btc';
        case 'sol':
            return 'sol';
        default:
            return undefined;
    }
}

function normalizeAsset(entry: RawAssetEntry, currency: string): MultichainWalletAsset | undefined {
    const chain = chainIdFromAssetId(entry.asset.asset_id);
    if (!chain) return undefined;
    const upper = currency.toUpperCase();
    const priceNum = entry.price?.prices?.[upper];
    const price = typeof priceNum === 'number' ? new BigNumber(priceNum) : undefined;
    return {
        assetId: entry.asset.asset_id,
        chain,
        name: entry.asset.name,
        symbol: entry.asset.symbol,
        decimals: entry.asset.decimals,
        image: entry.asset.image,
        balance: entry.balance,
        isHidden: entry.is_hidden,
        price,
        diff24h: entry.price?.diff_24h?.[upper]
    };
}

export interface GetMultichainWalletAssetsArgs {
    walletId: string;
    currency: string;
    chain?: string;
    search?: string;
    availableOnly?: boolean;
    showHidden?: boolean;
    limit?: number;
    cursor?: string;
    fetchImpl?: typeof fetch;
}

/**
 * Fetch the asset list for a multichain wallet. Wraps a single
 * unauthenticated GET against `multi.tonkeeper.com`. The endpoint is
 * public — no bearer token or signed header. iOS calls the same shape
 * via the OpenAPI-generated `MultichainClientAPI`; Android via the
 * `WalletsApi.getWalletAssets` generated client.
 */
export type AssetFilterAction = 'show' | 'hide';

export interface AssetFilterChange {
    assetId: string;
    action: AssetFilterAction;
}

export interface SaveMultichainAssetsFiltersArgs {
    walletId: string;
    changes: AssetFilterChange[];
    fetchImpl?: typeof fetch;
}

/**
 * Persist user's per-asset visibility choices. Mirrors iOS
 * (`saveWalletAssetsFilters`) and Android (`saveWalletAssetsFilters`)
 * — POST body `{changes: [{asset_id, action}]}` where action is
 * `show | hide`. The backend stores the filter set per wallet and
 * returns it on subsequent `GET /assets` calls via `is_hidden`.
 */
export async function saveMultichainAssetsFilters(
    args: SaveMultichainAssetsFiltersArgs
): Promise<void> {
    if (args.changes.length === 0) return;
    const fetchImpl = args.fetchImpl ?? fetch;
    const url = `${MULTICHAIN_API_BASE_URL}/wallets/${encodeURIComponent(args.walletId)}/assets`;
    const body = {
        changes: args.changes.map(c => ({ asset_id: c.assetId, action: c.action }))
    };
    const response = await fetchImpl(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`saveMultichainAssetsFilters: ${response.status} ${response.statusText}`);
    }
}

export type CatalogSort = 'market_cap' | 'volume';

export interface CatalogAsset {
    assetId: string;
    symbol: string;
    name: string;
    decimals: number;
    image: string;
    price?: BigNumber;
    /** Raw string from the backend, e.g. "+0.06%" / "-0.06%" / "0.00%". */
    diff24h?: string;
    /** Raw market-cap amount in the requested currency (decimal string). */
    marketCap?: string;
}

export interface CatalogResponse {
    items: CatalogAsset[];
    nextCursor: string;
}

interface RawCatalogAssetEntry {
    asset: RawAsset;
    price?: RawPrice;
    market_cap?: Record<string, string>;
}

interface RawCatalogResponse {
    assets: RawCatalogAssetEntry[];
    next_cursor?: string;
}

export interface SearchCatalogArgs {
    currency: string;
    sort: CatalogSort;
    /** `ton` | `eth` | `btc` | `tron` | `bsc` | `base` | `arb` | `sol` | … */
    chain?: string;
    search?: string;
    limit?: number;
    cursor?: string;
    fetchImpl?: typeof fetch;
}

/**
 * Search the multichain asset catalog. Wraps the same endpoint iOS
 * (MultichainAPI `searchAssets`) and Android (`apis.assets.searchAssets`)
 * consume. Chain filter is server-enforced.
 *
 * Required params per the OpenAPI spec: `currencies`, `sort`.
 * `sort` accepts `market_cap` or `volume` (not `volume_24h`).
 */
export async function searchMultichainCatalog(args: SearchCatalogArgs): Promise<CatalogResponse> {
    const fetchImpl = args.fetchImpl ?? fetch;
    const params = new URLSearchParams();
    params.append('currencies', args.currency.toLowerCase());
    params.append('sort', args.sort);
    if (args.chain) params.append('chain', args.chain);
    if (args.search) params.append('search', args.search);
    if (args.limit !== undefined) params.append('limit', String(args.limit));
    if (args.cursor) params.append('cursor', args.cursor);

    const url = `${MULTICHAIN_API_BASE_URL}/assets/search?${params.toString()}`;
    const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`searchMultichainCatalog: ${response.status} ${response.statusText}`);
    }

    const raw = (await response.json()) as RawCatalogResponse;
    const upper = args.currency.toUpperCase();
    const items: CatalogAsset[] = (raw.assets ?? []).map(entry => {
        const priceNum = entry.price?.prices?.[upper];
        return {
            assetId: entry.asset.asset_id,
            symbol: entry.asset.symbol,
            name: entry.asset.name,
            decimals: entry.asset.decimals,
            image: entry.asset.image,
            price: typeof priceNum === 'number' ? new BigNumber(priceNum) : undefined,
            diff24h: entry.price?.diff_24h?.[upper],
            marketCap: entry.market_cap?.[upper]
        };
    });

    return { items, nextCursor: raw.next_cursor ?? '' };
}

export async function getMultichainWalletAssets(
    args: GetMultichainWalletAssetsArgs
): Promise<MultichainWalletAssetsResponse> {
    const fetchImpl = args.fetchImpl ?? fetch;
    const params = new URLSearchParams();
    params.append('currencies', args.currency.toLowerCase());
    if (args.chain) params.append('chain', args.chain);
    if (args.search) params.append('search', args.search);
    if (args.availableOnly) params.append('available_only', 'true');
    if (args.showHidden) params.append('show_hidden', 'true');
    if (args.limit !== undefined) params.append('limit', String(args.limit));
    if (args.cursor) params.append('cursor', args.cursor);

    const url = `${MULTICHAIN_API_BASE_URL}/wallets/${encodeURIComponent(
        args.walletId
    )}/assets?${params.toString()}`;

    const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(
            `getMultichainWalletAssets: ${response.status} ${response.statusText} for wallet ${args.walletId}`
        );
    }

    const raw = (await response.json()) as RawResponse;
    const assets = (raw.assets ?? [])
        .map(entry => normalizeAsset(entry, args.currency))
        .filter((a): a is MultichainWalletAsset => a !== undefined);

    return {
        assets,
        fiatPrice: raw.fiat_price ?? {},
        nextCursor: raw.next_cursor ?? ''
    };
}
