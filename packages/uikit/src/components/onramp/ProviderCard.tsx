import { FC } from 'react';
import type { OnrampQuoteResult } from '@tonkeeper/core/dist/onrampApi';
import IcSwitch16 from '../../icons/components/IcSwitch16';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';

export interface ProviderCardProps {
    /**
     * The merchant whose rate the card surfaces. When `belowMin` is true
     * this is the suggested fallback (since the typed amount can't produce
     * a valid `items` entry) and `quote.minAmount` carries the merchant's
     * minimum.
     */
    quote: OnrampQuoteResult | undefined;
    fiat: string;
    symbol: string;
    isLoading: boolean;
    image?: string;
    isBest: boolean;
    /** True when the typed amount sits below `quote.minAmount`. */
    belowMin: boolean;
    /** Show the vertical-switch chevron — only when >1 provider exists. */
    showSwitch: boolean;
    onClick?: () => void;
}

const formatRate = (rate: string, fiat: string, symbol: string): string => {
    const r = Number(rate);
    if (!Number.isFinite(r) || r <= 0) return '';
    return `1 ${fiat} ≈ ${r.toPrecision(4)} ${symbol}`;
};

const formatMinForDisplay = (min: string): string => {
    const n = Number(min);
    if (!Number.isFinite(n) || n <= 0) return min;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/**
 * Provider snippet on the EnterAmountScreen — single row that shows the
 * picked merchant plus either the rate (`amount >= min`) or the merchant's
 * minimum in accentOrange (`amount < min`). The whole row is the affordance
 * for opening the provider picker.
 */
export const ProviderCard: FC<ProviderCardProps> = ({
    quote,
    fiat,
    symbol,
    isLoading,
    image,
    isBest,
    belowMin,
    showSwitch,
    onClick
}) => {
    const { t } = useTranslation();
    const interactive = !!onClick;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!interactive}
            className={cn(
                'flex w-full items-center gap-3 rounded-medium bg-backgroundContent px-4 py-4 text-left transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue',
                interactive ? 'cursor-pointer hover:bg-backgroundContentTint' : 'cursor-default'
            )}
        >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-small bg-backgroundContentTint">
                {image && <img src={image} alt="" className="block h-full w-full object-cover" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                {quote ? (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="truncate text-label1 text-textPrimary capitalize">
                                {quote.merchant}
                            </span>
                            {isBest && !belowMin && (
                                <span className="inline-flex h-4 select-none items-center rounded-full bg-accentBlue/16 px-1.5 text-[10px] font-medium uppercase leading-none tracking-wider text-accentBlue">
                                    {t('enter_amount_best_badge')}
                                </span>
                            )}
                        </div>
                        {belowMin && quote.minAmount ? (
                            <span className="truncate text-body3 text-accentOrange">
                                {t('choose_provider_min_amount', {
                                    amount: formatMinForDisplay(quote.minAmount),
                                    fiat
                                })}
                            </span>
                        ) : (
                            <span className="truncate text-body3 text-textSecondary">
                                {formatRate(quote.rate, fiat, symbol)}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-body2 text-textSecondary">
                        {isLoading ? t('loading') : t('enter_amount_quote_hint')}
                    </span>
                )}
            </div>
            {showSwitch && <IcSwitch16 className="h-4 w-4 shrink-0 text-iconSecondary" />}
        </button>
    );
};
