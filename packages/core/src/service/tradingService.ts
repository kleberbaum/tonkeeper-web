/**
 * Client for the TradingAPI proxy at trading.tonkeeper.com. Mirrors the
 * shape iOS (TKTradingAPI / generated OpenAPI client) and Android
 * (tonapi/trading / generated TradingApi) consume. The proxy fronts
 * dyor.io plus internal data sources — clients never call dyor
 * directly.
 *
 * No auth. Returns are normalised to the union of fields iOS and
 * Android render; section `enabled` flags decide whether the UI shows
 * the corresponding card or skips it.
 */

const TRADING_API_BASE_URL = 'https://trading.tonkeeper.com/api/v1/trading';

export interface AssetDetailsAbout {
    enabled: boolean;
    text?: string;
    /** Source attribution (`local`, `dyor`, …). */
    source?: string;
    /** Reason the section is disabled (e.g. for stocks / RWA). */
    note?: string;
}

export interface AssetDetailsOverview {
    enabled: boolean;
    marketCap?: string;
    totalSupply?: string;
    circulatingSupply?: string;
    note?: string;
}

export interface AssetDetailsTradingActivity {
    enabled: boolean;
    volumeChange24h?: string;
    volume24h?: string;
    buy24h?: string;
    sell24h?: string;
    note?: string;
}

export type AssetLinkType =
    | 'unspecified'
    | 'website'
    | 'telegram'
    | 'twitter'
    | 'facebook'
    | string;

export interface AssetLink {
    name: string;
    url: string;
    type: AssetLinkType;
}

export interface AssetDetailsLinks {
    enabled: boolean;
    items: AssetLink[];
    note?: string;
}

export interface AssetDetails {
    about: AssetDetailsAbout;
    overview: AssetDetailsOverview;
    tradingActivity: AssetDetailsTradingActivity;
    links: AssetDetailsLinks;
    /** How fresh the data is, in seconds. */
    dataFreshnessSec: number;
}

interface RawAssetDetailsResponse {
    asset?: unknown;
    sections: {
        about: { enabled: boolean; text?: string; source?: string; note?: string };
        overview: {
            enabled: boolean;
            market_cap?: string;
            total_supply?: string;
            circulating_supply?: string;
            note?: string;
        };
        trading_activity: {
            enabled: boolean;
            volume_change_24h?: string;
            volume_24h?: string;
            buy_24h?: string;
            sell_24h?: string;
            note?: string;
        };
        links: {
            enabled: boolean;
            items?: { name: string; url: string; type: string }[];
            note?: string;
        };
    };
    data_freshness_sec: number;
}

export interface GetAssetDetailsArgs {
    assetId: string;
    currency: string;
    fetchImpl?: typeof fetch;
}

export async function getAssetDetails(args: GetAssetDetailsArgs): Promise<AssetDetails> {
    const fetchImpl = args.fetchImpl ?? fetch;
    const params = new URLSearchParams();
    params.append('currency', args.currency.toLowerCase());

    const url = `${TRADING_API_BASE_URL}/assets/${encodeURIComponent(
        args.assetId
    )}/details?${params.toString()}`;

    const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(
            `getAssetDetails: ${response.status} ${response.statusText} for ${args.assetId}`
        );
    }

    const raw = (await response.json()) as RawAssetDetailsResponse;
    return {
        about: {
            enabled: raw.sections.about.enabled,
            text: raw.sections.about.text,
            source: raw.sections.about.source,
            note: raw.sections.about.note
        },
        overview: {
            enabled: raw.sections.overview.enabled,
            marketCap: raw.sections.overview.market_cap,
            totalSupply: raw.sections.overview.total_supply,
            circulatingSupply: raw.sections.overview.circulating_supply,
            note: raw.sections.overview.note
        },
        tradingActivity: {
            enabled: raw.sections.trading_activity.enabled,
            volumeChange24h: raw.sections.trading_activity.volume_change_24h,
            volume24h: raw.sections.trading_activity.volume_24h,
            buy24h: raw.sections.trading_activity.buy_24h,
            sell24h: raw.sections.trading_activity.sell_24h,
            note: raw.sections.trading_activity.note
        },
        links: {
            enabled: raw.sections.links.enabled,
            items: (raw.sections.links.items ?? []).map(i => ({
                name: i.name,
                url: i.url,
                type: i.type
            })),
            note: raw.sections.links.note
        },
        dataFreshnessSec: raw.data_freshness_sec
    };
}

export type CatalogSort = 'volume_24h' | 'market_cap' | 'price_24h';
export type CatalogOrder = 'desc' | 'asc';

export interface CatalogAsset {
    assetId: string;
    symbol: string;
    name: string;
    decimals: number;
    image: string;
    isScam: boolean;
    /** `whitelist` | `blacklist` | `none` | other server-defined values. */
    verification: string;
    price?: string;
    change24hPercent?: string;
    marketCap?: string;
    volume24h?: string;
}

export interface CatalogResponse {
    items: CatalogAsset[];
    /** Empty string means "no more pages". */
    nextCursor: string;
}

interface RawCatalogItem {
    asset: {
        id: string;
        symbol: string;
        name: string;
        decimals: number;
        image_url?: string;
        is_scam?: boolean;
        verification?: string;
    };
    metrics?: {
        price?: string;
        change_24h_percent?: string;
        market_cap?: string;
        volume_24h?: string;
    };
}

interface RawCatalogResponse {
    items: RawCatalogItem[];
    next_cursor?: string;
}

export interface GetAssetsCatalogArgs {
    currency: string;
    /** Search query — server decides prefix vs contains matching. */
    query?: string;
    /** Restrict to one chain segment (`ton`, `eth`, `btc`, `tron`, …). */
    chain?: string;
    sort?: CatalogSort;
    order?: CatalogOrder;
    /** Server clamps to its own bounds; min is 10. */
    pageSize?: number;
    cursor?: string;
    fetchImpl?: typeof fetch;
}

export async function getAssetsCatalog(args: GetAssetsCatalogArgs): Promise<CatalogResponse> {
    const fetchImpl = args.fetchImpl ?? fetch;
    const params = new URLSearchParams();
    params.append('currency', args.currency.toLowerCase());
    if (args.query) params.append('q', args.query);
    if (args.chain) params.append('chain', args.chain);
    if (args.sort) params.append('sort', args.sort);
    if (args.order) params.append('order', args.order);
    if (args.pageSize !== undefined) params.append('page_size', String(args.pageSize));
    if (args.cursor) params.append('cursor', args.cursor);

    const url = `${TRADING_API_BASE_URL}/assets?${params.toString()}`;
    const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`getAssetsCatalog: ${response.status} ${response.statusText}`);
    }

    const raw = (await response.json()) as RawCatalogResponse;
    const items: CatalogAsset[] = (raw.items ?? []).map(item => ({
        assetId: item.asset.id,
        symbol: item.asset.symbol,
        name: item.asset.name,
        decimals: item.asset.decimals,
        image: item.asset.image_url ?? '',
        isScam: !!item.asset.is_scam,
        verification: item.asset.verification ?? 'none',
        price: item.metrics?.price,
        change24hPercent: item.metrics?.change_24h_percent,
        marketCap: item.metrics?.market_cap,
        volume24h: item.metrics?.volume_24h
    }));

    return { items, nextCursor: raw.next_cursor ?? '' };
}

export interface ChartPoint {
    timestamp: number;
    price: number;
}

export interface GetAssetChartsArgs {
    assetId: string;
    currency: string;
    /** Unix seconds. */
    startDate?: number;
    /** Unix seconds. */
    endDate?: number;
    /** Total number of points to return across the [startDate, endDate] window. */
    pointsCount?: number;
    fetchImpl?: typeof fetch;
}

/**
 * Fetch chart points for an asset. Response shape is a tuple-array
 * `[[timestamp_seconds, price], …]`; we normalise to objects so the UI
 * doesn't depend on tuple indices.
 */
export async function getAssetCharts(args: GetAssetChartsArgs): Promise<ChartPoint[]> {
    const fetchImpl = args.fetchImpl ?? fetch;
    const params = new URLSearchParams();
    params.append('currency', args.currency.toLowerCase());
    if (args.startDate !== undefined) params.append('start_date', String(args.startDate));
    if (args.endDate !== undefined) params.append('end_date', String(args.endDate));
    if (args.pointsCount !== undefined) params.append('points_count', String(args.pointsCount));

    const url = `${TRADING_API_BASE_URL}/assets/${encodeURIComponent(
        args.assetId
    )}/charts?${params.toString()}`;

    const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(
            `getAssetCharts: ${response.status} ${response.statusText} for ${args.assetId}`
        );
    }

    const raw = (await response.json()) as [number, number][];
    return raw.map(([timestamp, price]) => ({ timestamp, price }));
}
