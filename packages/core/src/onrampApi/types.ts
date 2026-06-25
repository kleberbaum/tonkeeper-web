import type {
    ExchangeMerchantSlug,
    ExchangePaymentMethodType,
    OnrampOrderStatus,
    RampFees,
    RampUnavailableReason
} from '../swapsApiGenerated';

/**
 * Deployed `/v2/onramp/configuration` returns per-asset rows with
 * `available_methods` / `available_fiats` arrays, not the per-tuple
 * (asset × fiat × method × country × merchant) cross-join that the
 * generated `OnrampConfiguration` model assumes. These types describe the
 * real wire shape; `fetchOnrampConfiguration` normalizes snake_case →
 * camelCase before returning.
 */
export interface OnrampAsset {
    assetId: string;
    symbol: string;
    networkName?: string;
    networkImage?: string;
    image?: string;
    decimals: number;
    stablecoin: boolean;
    extraIdRequired: boolean;
    extraIdName?: string;
    availableMethods: ExchangePaymentMethodType[];
    availableFiats: string[];
}

export interface OnrampConfiguration {
    assets: OnrampAsset[];
    nextCursor?: string;
}

export interface OnrampLimits {
    min?: number;
    max?: number;
}

export interface OnrampProvider {
    merchant: string;
    fiat: string;
    limits?: OnrampLimits;
}

export interface OnrampPaymentMethod {
    type: ExchangePaymentMethodType;
    name: string;
    image: string;
    providers: OnrampProvider[];
}

/**
 * Response of `GET /v2/onramp/asset?asset_id=...`. The list endpoint
 * (`/v2/onramp/configuration`) only carries the symbol-level summary;
 * methods × providers come from this detail call.
 */
export interface OnrampAssetDetail {
    assetId: string;
    symbol: string;
    networkName?: string;
    networkImage?: string;
    image?: string;
    decimals: number;
    stablecoin: boolean;
    extraIdRequired: boolean;
    extraIdName?: string;
    paymentMethods: OnrampPaymentMethod[];
}

/**
 * Response of `GET /v2/exchange/layout?flow=deposit&currency=…`. Each card
 * represents a region-specific entry-point row on the Add funds screen
 * (e.g. "Buy with Apple Pay" for international, "Купить через P2P" for RU).
 * `preferredCurrency` is the fiat the backend recommends for the flow that
 * card kicks off — pass it down to ChooseAsset / PaymentMethod so the
 * locked fiat reflects the user's region, not the app-wide default.
 */
export interface OnrampLayoutCard {
    title: string;
    description: string;
    image: string;
    preferredCurrency?: string;
}

export interface OnrampLayoutCards {
    items: OnrampLayoutCard[];
}

export interface OnrampQuoteRequestBody {
    targetAssetId: string;
    fiat: string;
    amount: string;
    reverse?: boolean;
    paymentMethod?: ExchangePaymentMethodType;
    merchant?: ExchangeMerchantSlug;
}

export interface OnrampQuoteResult {
    merchant: ExchangeMerchantSlug;
    paymentMethod: ExchangePaymentMethodType;
    amountIn: string;
    amountOut: string;
    rate: string;
    fees: RampFees;
    minAmount?: string;
    maxAmount?: string;
    dateExpire: string;
    merchantTransactionId: string;
}

export interface OnrampQuotes {
    items: OnrampQuoteResult[];
    suggested: OnrampQuoteResult[];
    unavailableReason?: RampUnavailableReason;
}

export interface CreateOnrampOrderBody {
    targetAssetId: string;
    fiat: string;
    amount: string;
    reverse?: boolean;
    destinationAddress: string;
    extraId?: string;
    paymentMethod: ExchangePaymentMethodType;
    merchant: ExchangeMerchantSlug;
    merchantTransactionId?: string;
    redirectUrl?: string;
    language?: string;
}

/**
 * Snake-cased on the wire; the generated camelCase `OnrampOrder` describes
 * the same shape. Re-declared here so `fetchCreateOnrampOrder` can return
 * camelCase without going through the (broken) generated parser that
 * doesn't translate keys.
 */
export interface OnrampOrderResult {
    id: string;
    merchant: ExchangeMerchantSlug;
    merchantTransactionId?: string;
    status: OnrampOrderStatus;
    statusReason?: string;
    widgetUrl: string;
    destinationAddress: string;
    destinationExtraId?: string;
    extraIdName?: string;
    amountIn: string;
    amountOut: string;
    rate: string;
    fees: RampFees;
    destinationTxHash?: string;
    providerOrderId?: string;
    estimatedDuration?: number;
    dateCreate: string;
    dateUpdate?: string;
}
