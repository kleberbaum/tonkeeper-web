import { Address } from '@ton/core';

import { toShortValue } from '../utils/common';
import { MULTICHAIN_API_BASE_URL } from './multichainWalletService';
import { Configuration, WalletsApi } from '../multichainApiGenerated';
import type {
    Activity,
    ActivityDirection,
    ActivityStatus,
    ActivityType,
    AssetInfo,
    Chain
} from '../multichainApiGenerated';

/**
 * Domain aliases for the generated multichain client's enums. The OpenAPI spec
 * (see `generate:multichainApi`) is the single source of truth for these closed
 * sets — 7 chains, send/receive/swap, pending/confirmed/failed/dropped,
 * in/out/self. Re-exported under `Multichain*` names so callers don't reach
 * into the generated package.
 */
export type MultichainChain = Chain;
export type MultichainActivityType = ActivityType;
export type MultichainActivityStatus = ActivityStatus;
export type MultichainActivityDirection = ActivityDirection;

/**
 * Token/coin descriptor carried by an activity. `assetId` is the
 * universal id (`<chain>/<network>/<type>/<address>`, e.g.
 * `eth/mainnet/coin`, `ton/mainnet/jetton/EQC…`); amounts elsewhere are
 * raw strings in this asset's smallest unit — divide by 10^`decimals`.
 */
export interface MultichainActivityAsset {
    assetId: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
}

/**
 * A single cross-chain activity, normalized from the backend's
 * snake_case wire shape. Mirrors the model both native apps consume.
 *
 * `blockTimeMs` is Unix epoch **milliseconds** (the wire `block_time` is
 * an ISO-8601 timestamp). Amount fields (`outAmount` / `inAmount` /
 * `feeAmount`) are raw smallest-unit strings paired with their token's
 * `decimals`. `*Usd` are already-converted fiat numbers.
 */
export interface MultichainActivity {
    activityType: MultichainActivityType;
    status: MultichainActivityStatus;
    blockTimeMs: number;
    fromChain: MultichainChain;
    toChain: MultichainChain;
    direction: MultichainActivityDirection;
    /** On-chain identifiers, each formatted `chain:txhash`. */
    txIds: string[];
    blockNumber?: number;
    walletAddress?: string;
    fromAddress?: string;
    toAddress?: string;
    outToken?: MultichainActivityAsset;
    outAmount?: string;
    outAmountUsd?: number;
    inToken?: MultichainActivityAsset;
    inAmount?: string;
    inAmountUsd?: number;
    feeToken?: MultichainActivityAsset;
    feeAmount?: string;
    feeAmountUsd?: number;
    /** DEX/bridge protocol for swaps (e.g. `uniswap_v3`, `stargate`). */
    protocol?: string;
    isRead?: boolean;
    /** Chain-specific extras (TON memo, EVM input data, …). */
    meta?: Record<string, unknown>;
}

export interface MultichainActivitiesResponse {
    activities: MultichainActivity[];
    /** Empty string means "no more pages". */
    nextCursor: string;
}

/** Origin without the `/api/v1` suffix — the generated client's operation
 *  paths already carry the version prefix, so its base path stops at the host. */
const MULTICHAIN_API_ORIGIN = MULTICHAIN_API_BASE_URL.replace(/\/api\/v\d+$/, '');

const defaultWalletsApi = new WalletsApi(new Configuration({ basePath: MULTICHAIN_API_ORIGIN }));

/** One shared client in production; tests inject their own `fetch` per call. */
function walletsApi(fetchImpl?: typeof fetch): WalletsApi {
    if (!fetchImpl) return defaultWalletsApi;
    return new WalletsApi(
        new Configuration({ basePath: MULTICHAIN_API_ORIGIN, fetchApi: fetchImpl })
    );
}

function toAsset(api: AssetInfo | undefined): MultichainActivityAsset | undefined {
    if (!api) return undefined;
    return {
        assetId: api.assetId,
        name: api.name,
        symbol: api.symbol,
        decimals: api.decimals,
        image: api.image
    };
}

/**
 * Adapt the generated `Activity` (already decoded from the snake_case wire by
 * the client's `FromJSON`) to the app domain — chiefly folding the `blockTime`
 * `Date` down to epoch ms; every other field passes straight through.
 */
function toActivity(api: Activity): MultichainActivity {
    const ms = api.blockTime.getTime();
    return {
        activityType: api.activityType,
        status: api.status,
        blockTimeMs: Number.isNaN(ms) ? 0 : ms,
        fromChain: api.fromChain,
        toChain: api.toChain,
        direction: api.direction,
        txIds: api.txIds ?? [],
        blockNumber: api.blockNumber,
        walletAddress: api.walletAddress,
        fromAddress: api.fromAddress,
        toAddress: api.toAddress,
        outToken: toAsset(api.outToken),
        outAmount: api.outAmount,
        outAmountUsd: api.outAmountUsd,
        inToken: toAsset(api.inToken),
        inAmount: api.inAmount,
        inAmountUsd: api.inAmountUsd,
        feeToken: toAsset(api.feeToken),
        feeAmount: api.feeAmount,
        feeAmountUsd: api.feeAmountUsd,
        protocol: api.protocol,
        isRead: api.isRead,
        meta: api.meta
    };
}

export interface GetMultichainWalletActivitiesArgs {
    walletId: string;
    chain?: MultichainChain;
    activityType?: MultichainActivityType;
    limit?: number;
    cursor?: string;
    fetchImpl?: typeof fetch;
}

/**
 * Fetch one page of cross-chain activity for a multichain wallet.
 * Wraps the same public, unauthenticated endpoint iOS
 * (`MultichainClientAPI.getWalletActivities`) and Android
 * (`WalletsApi.getWalletActivities`) consume:
 * `GET /wallets/{walletId}/activities`. Chain and type filters are
 * server-enforced; paging is cursor-based (`next_cursor`, empty ⇒ end).
 */
export async function getMultichainWalletActivities(
    args: GetMultichainWalletActivitiesArgs
): Promise<MultichainActivitiesResponse> {
    const response = await walletsApi(args.fetchImpl).getWalletActivities({
        walletId: args.walletId,
        chain: args.chain,
        activityType: args.activityType,
        limit: args.limit,
        cursor: args.cursor
    });
    return {
        activities: (response.activities ?? []).map(toActivity),
        nextCursor: response.nextCursor ?? ''
    };
}

const EXPLORER_TX_URL: Record<MultichainChain, (hash: string) => string> = {
    ton: hash => `https://tonviewer.com/transaction/${hash}`,
    eth: hash => `https://etherscan.io/tx/${hash}`,
    base: hash => `https://basescan.org/tx/${hash}`,
    btc: hash => `https://mempool.space/tx/${hash}`,
    tron: hash => `https://tronscan.org/#/transaction/${hash}`,
    arb: hash => `https://arbiscan.io/tx/${hash}`,
    bsc: hash => `https://bscscan.com/tx/${hash}`
};

/**
 * Per-chain block-explorer transaction URL, hardcoded to match iOS and
 * Android (both map these exact hosts). Returns `undefined` for a chain
 * outside the known set so callers hide the explorer link rather than
 * linking somewhere wrong.
 */
export function multichainExplorerUrl(chain: string, txHash: string): string | undefined {
    const build = EXPLORER_TX_URL[chain as MultichainChain];
    return build ? build(txHash) : undefined;
}

/**
 * Split a `chain:txhash` id into its parts. The hash itself never
 * contains a colon, so we split on the first one only.
 */
export function parseTxId(txId: string): { chain: string; hash: string } {
    const idx = txId.indexOf(':');
    if (idx === -1) return { chain: '', hash: txId };
    return { chain: txId.slice(0, idx), hash: txId.slice(idx + 1) };
}

export interface MultichainExplorerLink {
    url: string;
    hash: string;
    shortHash: string;
}

/**
 * The explorer link to show on a transaction detail. Only same-chain
 * activities get one (cross-chain swaps span two explorers, so — like
 * iOS — we surface none). Picks the `txId` whose chain matches the
 * activity's chain.
 */
export function explorerLinkForActivity(
    activity: MultichainActivity
): MultichainExplorerLink | undefined {
    if (activity.fromChain !== activity.toChain) return undefined;
    const chain = activity.fromChain;
    const match = activity.txIds.map(parseTxId).find(t => t.chain === chain) ?? {
        chain,
        hash: activity.txIds[0] ? parseTxId(activity.txIds[0]).hash : ''
    };
    if (!match.hash) return undefined;
    const url = multichainExplorerUrl(chain, match.hash);
    if (!url) return undefined;
    return { url, hash: match.hash, shortHash: toShortValue(match.hash) };
}

/**
 * Full display address for a counterparty. TON addresses are rendered in
 * the user-facing non-bounceable friendly form (matching iOS
 * `MultichainAddressFormatter`); every other chain uses the address
 * as-is. Unparseable TON input falls back to the raw string.
 */
export function formatMultichainAddress(address: string, chain: string): string {
    if (chain === 'ton') {
        try {
            return Address.parse(address).toString({ bounceable: false, testOnly: false });
        } catch {
            return address;
        }
    }
    return address;
}

/**
 * Short `1234…5678` form for list rows, applied on top of the
 * chain-aware full format.
 */
export function shortenMultichainAddress(address: string, chain: string): string {
    return toShortValue(formatMultichainAddress(address, chain));
}
