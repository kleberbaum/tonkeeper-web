import { Configuration, ExchangeApi, OnrampApi, P2pApi } from '../swapsApiGenerated';
import type {
    CreateP2PSessionOperationRequest,
    ExchangeMerchantInfo,
    ExchangeMerchantSlug,
    ExchangePaymentMethodType,
    GetExchangeMerchantsRequest,
    GetOnrampConfigurationRequest,
    GetOnrampOrderRequest,
    OnrampOrder,
    OnrampOrderStatus,
    P2PSessionResult,
    Platform,
    RampFees,
    RampUnavailableReason
} from '../swapsApiGenerated';
import { removeLastSlash } from '../utils/url';
import type {
    CreateOnrampOrderBody,
    OnrampAsset,
    OnrampAssetDetail,
    OnrampConfiguration,
    OnrampLayoutCard,
    OnrampLayoutCards,
    OnrampLimits,
    OnrampOrderResult,
    OnrampPaymentMethod,
    OnrampProvider,
    OnrampQuoteRequestBody,
    OnrampQuoteResult,
    OnrampQuotes
} from './types';

const config = (baseUrl: string) => new Configuration({ basePath: removeLastSlash(baseUrl) });

interface RawOnrampAsset {
    asset_id: string;
    symbol: string;
    network_name?: string;
    network_image?: string;
    image?: string;
    decimals: number;
    stablecoin: boolean;
    extra_id_required: boolean;
    extra_id_name?: string;
    available_methods?: ExchangePaymentMethodType[];
    available_fiats?: string[];
}

interface RawOnrampConfiguration {
    assets?: RawOnrampAsset[];
    next_cursor?: string;
}

const toAsset = (raw: RawOnrampAsset): OnrampAsset => ({
    assetId: raw.asset_id,
    symbol: raw.symbol,
    networkName: raw.network_name,
    networkImage: raw.network_image,
    image: raw.image,
    decimals: raw.decimals,
    stablecoin: raw.stablecoin,
    extraIdRequired: raw.extra_id_required,
    extraIdName: raw.extra_id_name,
    availableMethods: raw.available_methods ?? [],
    availableFiats: raw.available_fiats ?? []
});

// Bypass the generated `OnrampApi.getOnrampConfiguration` model parsing: the
// deployed response is shaped per-asset (`{ assets, next_cursor }`) and uses
// snake_case keys, while the generated model expects a per-tuple
// (asset × fiat × method × country × merchant) cross-join named `entries`.
// Until the swagger catches up, parse the wire shape directly.
export const fetchOnrampConfiguration = async (
    baseUrl: string,
    params: GetOnrampConfigurationRequest
): Promise<OnrampConfiguration> => {
    const query = new URLSearchParams();
    if (params.destinationChain) query.set('destination_chain', params.destinationChain);
    if (params.fiat) query.set('fiat', params.fiat);
    if (params.paymentMethod) query.set('payment_method', params.paymentMethod);
    if (params.deviceCountryCode) query.set('device_country_code', params.deviceCountryCode);
    if (params.timezone) query.set('timezone', params.timezone);
    if (params.platform) query.set('platform', params.platform);
    if (params.build) query.set('build', params.build);
    if (params.lang) query.set('lang', params.lang);
    const qs = query.toString();
    const url = `${removeLastSlash(baseUrl)}/v2/onramp/configuration${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`onramp configuration: HTTP ${response.status}`);
    }
    const raw = (await response.json()) as RawOnrampConfiguration;
    return {
        assets: (raw.assets ?? []).map(toAsset),
        nextCursor: raw.next_cursor
    };
};

interface RawOnrampLimits {
    min?: number;
    max?: number;
}

interface RawOnrampProvider {
    merchant: string;
    fiat: string;
    limits?: RawOnrampLimits;
}

interface RawOnrampPaymentMethod {
    type: ExchangePaymentMethodType;
    name: string;
    image: string;
    providers: RawOnrampProvider[];
}

interface RawOnrampAssetDetail {
    asset_id: string;
    symbol: string;
    network_name?: string;
    network_image?: string;
    image?: string;
    decimals: number;
    stablecoin: boolean;
    extra_id_required: boolean;
    extra_id_name?: string;
    payment_methods?: RawOnrampPaymentMethod[];
}

const toLimits = (raw?: RawOnrampLimits): OnrampLimits | undefined =>
    raw ? { min: raw.min, max: raw.max } : undefined;

const toProvider = (raw: RawOnrampProvider): OnrampProvider => ({
    merchant: raw.merchant,
    fiat: raw.fiat,
    limits: toLimits(raw.limits)
});

const toPaymentMethod = (raw: RawOnrampPaymentMethod): OnrampPaymentMethod => ({
    type: raw.type,
    name: raw.name,
    image: raw.image,
    providers: (raw.providers ?? []).map(toProvider)
});

export interface FetchOnrampAssetParams {
    assetId: string;
    deviceCountryCode?: string;
    timezone?: string;
    platform?: Platform;
    build?: string;
    lang?: string;
}

export const fetchOnrampAsset = async (
    baseUrl: string,
    params: FetchOnrampAssetParams
): Promise<OnrampAssetDetail> => {
    const query = new URLSearchParams();
    query.set('asset_id', params.assetId);
    if (params.deviceCountryCode) query.set('device_country_code', params.deviceCountryCode);
    if (params.timezone) query.set('timezone', params.timezone);
    if (params.platform) query.set('platform', params.platform);
    if (params.build) query.set('build', params.build);
    if (params.lang) query.set('lang', params.lang);
    const url = `${removeLastSlash(baseUrl)}/v2/onramp/asset?${query.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`onramp asset: HTTP ${response.status}`);
    }
    const raw = (await response.json()) as RawOnrampAssetDetail;
    return {
        assetId: raw.asset_id,
        symbol: raw.symbol,
        networkName: raw.network_name,
        networkImage: raw.network_image,
        image: raw.image,
        decimals: raw.decimals,
        stablecoin: raw.stablecoin,
        extraIdRequired: raw.extra_id_required,
        extraIdName: raw.extra_id_name,
        paymentMethods: (raw.payment_methods ?? []).map(toPaymentMethod)
    };
};

interface RawOnrampLayoutCard {
    title: string;
    description: string;
    image: string;
    preferred_currency?: string;
}

interface RawOnrampLayoutCards {
    items?: RawOnrampLayoutCard[];
}

const toLayoutCard = (raw: RawOnrampLayoutCard): OnrampLayoutCard => ({
    title: raw.title,
    description: raw.description,
    image: raw.image,
    preferredCurrency: raw.preferred_currency
});

export interface FetchExchangeLayoutParams {
    /** `deposit` for on-ramp Add funds, `withdraw` for off-ramp. */
    flow: 'deposit' | 'withdraw';
    /** App-wide fiat. Backend echoes it back as `preferred_currency`; if
     *  omitted, the backend falls back to a region-based default. */
    currency?: string;
    deviceCountryCode?: string;
    timezone?: string;
    platform?: Platform;
    build?: string;
    lang?: string;
}

export const fetchExchangeLayout = async (
    baseUrl: string,
    params: FetchExchangeLayoutParams
): Promise<OnrampLayoutCards> => {
    const query = new URLSearchParams();
    query.set('flow', params.flow);
    if (params.currency) query.set('currency', params.currency);
    if (params.deviceCountryCode) query.set('device_country_code', params.deviceCountryCode);
    if (params.timezone) query.set('timezone', params.timezone);
    if (params.platform) query.set('platform', params.platform);
    if (params.build) query.set('build', params.build);
    if (params.lang) query.set('lang', params.lang);
    const url = `${removeLastSlash(baseUrl)}/v2/exchange/layout?${query.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`exchange layout: HTTP ${response.status}`);
    }
    const raw = (await response.json()) as RawOnrampLayoutCards;
    return { items: (raw.items ?? []).map(toLayoutCard) };
};

interface RawOnrampQuoteResult {
    merchant: ExchangeMerchantSlug;
    payment_method: ExchangePaymentMethodType;
    amount_in: string;
    amount_out: string;
    rate: string;
    fees: RampFees;
    min_amount?: string;
    max_amount?: string;
    date_expire: string;
    merchant_transaction_id: string;
}

interface RawOnrampQuotes {
    items?: RawOnrampQuoteResult[];
    suggested?: RawOnrampQuoteResult[];
    unavailable_reason?: RampUnavailableReason;
}

const toQuoteResult = (raw: RawOnrampQuoteResult): OnrampQuoteResult => ({
    merchant: raw.merchant,
    paymentMethod: raw.payment_method,
    amountIn: raw.amount_in,
    amountOut: raw.amount_out,
    rate: raw.rate,
    fees: raw.fees,
    minAmount: raw.min_amount,
    maxAmount: raw.max_amount,
    dateExpire: raw.date_expire,
    merchantTransactionId: raw.merchant_transaction_id
});

export interface FetchOnrampQuoteParams {
    body: OnrampQuoteRequestBody;
    deviceCountryCode?: string;
    timezone?: string;
    platform?: Platform;
    build?: string;
}

// The generated `OnrampApi.onrampQuote` ships the body verbatim — it does
// not transform camelCase TS keys into the snake_case the backend requires
// (`target_asset_id`, `payment_method`). Same story for the response. Until
// the generator grows that hop, do the wire mapping manually.
export const fetchOnrampQuote = async (
    baseUrl: string,
    params: FetchOnrampQuoteParams
): Promise<OnrampQuotes> => {
    const query = new URLSearchParams();
    if (params.deviceCountryCode) query.set('device_country_code', params.deviceCountryCode);
    if (params.timezone) query.set('timezone', params.timezone);
    if (params.platform) query.set('platform', params.platform);
    if (params.build) query.set('build', params.build);
    const qs = query.toString();
    const url = `${removeLastSlash(baseUrl)}/v2/onramp/quote${qs ? `?${qs}` : ''}`;

    const body = params.body;
    const wireBody: Record<string, unknown> = {
        target_asset_id: body.targetAssetId,
        fiat: body.fiat,
        amount: body.amount
    };
    if (body.reverse !== undefined) wireBody.reverse = body.reverse;
    if (body.paymentMethod) wireBody.payment_method = body.paymentMethod;
    if (body.merchant) wireBody.merchant = body.merchant;

    const response = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(wireBody)
    });
    if (!response.ok) {
        throw new Error(`onramp quote: HTTP ${response.status}`);
    }
    const raw = (await response.json()) as RawOnrampQuotes;
    return {
        items: (raw.items ?? []).map(toQuoteResult),
        suggested: (raw.suggested ?? []).map(toQuoteResult),
        unavailableReason: raw.unavailable_reason
    };
};

interface RawOnrampOrder {
    id: string;
    merchant: ExchangeMerchantSlug;
    merchant_transaction_id?: string;
    status: OnrampOrderStatus;
    status_reason?: string;
    widget_url: string;
    destination_address: string;
    destination_extra_id?: string;
    extra_id_name?: string;
    amount_in: string;
    amount_out: string;
    rate: string;
    fees: RampFees;
    destination_tx_hash?: string;
    provider_order_id?: string;
    estimated_duration?: number;
    date_create: string;
    date_update?: string;
}

export interface FetchCreateOnrampOrderParams {
    body: CreateOnrampOrderBody;
    deviceCountryCode?: string;
    timezone?: string;
    platform?: Platform;
    build?: string;
}

// Same generated-client snake_case mismatch as `fetchOnrampQuote`: the
// generated POST sends camelCase keys and never translates the response,
// which both fails validation server-side and returns `widgetUrl=undefined`
// to the consumer (so `sdk.openPage` gets nothing). Hand-roll the wire.
export const createOnrampOrder = async (
    baseUrl: string,
    params: FetchCreateOnrampOrderParams
): Promise<OnrampOrderResult> => {
    const query = new URLSearchParams();
    if (params.deviceCountryCode) query.set('device_country_code', params.deviceCountryCode);
    if (params.timezone) query.set('timezone', params.timezone);
    if (params.platform) query.set('platform', params.platform);
    if (params.build) query.set('build', params.build);
    const qs = query.toString();
    const url = `${removeLastSlash(baseUrl)}/v2/onramp/orders${qs ? `?${qs}` : ''}`;

    const body = params.body;
    const wireBody: Record<string, unknown> = {
        target_asset_id: body.targetAssetId,
        fiat: body.fiat,
        amount: body.amount,
        destination_address: body.destinationAddress,
        payment_method: body.paymentMethod,
        merchant: body.merchant
    };
    if (body.reverse !== undefined) wireBody.reverse = body.reverse;
    if (body.extraId) wireBody.extra_id = body.extraId;
    if (body.merchantTransactionId) {
        wireBody.merchant_transaction_id = body.merchantTransactionId;
    }
    if (body.redirectUrl) wireBody.redirect_url = body.redirectUrl;
    if (body.language) wireBody.language = body.language;

    // NOTE: backend CORS for /v2/onramp/orders doesn't include
    // `Idempotency-Key` in `Access-Control-Allow-Headers` (only `content-type`),
    // so adding it triggers a preflight rejection in browsers. The header is
    // optional server-side — without it, double-submits could create duplicate
    // orders, but the React Query mutation's isLoading gate and the button's
    // disabled state already prevent that client-side. Re-add the header once
    // the backend allows it.
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(wireBody)
    });
    if (!response.ok) {
        throw new Error(`onramp create order: HTTP ${response.status}`);
    }
    const raw = (await response.json()) as RawOnrampOrder;
    return {
        id: raw.id,
        merchant: raw.merchant,
        merchantTransactionId: raw.merchant_transaction_id,
        status: raw.status,
        statusReason: raw.status_reason,
        widgetUrl: raw.widget_url,
        destinationAddress: raw.destination_address,
        destinationExtraId: raw.destination_extra_id,
        extraIdName: raw.extra_id_name,
        amountIn: raw.amount_in,
        amountOut: raw.amount_out,
        rate: raw.rate,
        fees: raw.fees,
        destinationTxHash: raw.destination_tx_hash,
        providerOrderId: raw.provider_order_id,
        estimatedDuration: raw.estimated_duration,
        dateCreate: raw.date_create,
        dateUpdate: raw.date_update
    };
};

export const fetchOnrampOrder = (
    baseUrl: string,
    params: GetOnrampOrderRequest
): Promise<OnrampOrder> => new OnrampApi(config(baseUrl)).getOnrampOrder(params);

export const fetchExchangeMerchants = (
    baseUrl: string,
    params: GetExchangeMerchantsRequest
): Promise<ExchangeMerchantInfo[]> => new ExchangeApi(config(baseUrl)).getExchangeMerchants(params);

export const createP2PSession = (
    baseUrl: string,
    params: CreateP2PSessionOperationRequest
): Promise<P2PSessionResult> => new P2pApi(config(baseUrl)).createP2PSession(params);
