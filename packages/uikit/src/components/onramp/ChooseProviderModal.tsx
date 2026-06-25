import { FC } from 'react';
import type { ExchangeMerchantSlug, OnrampQuoteResult } from '@tonkeeper/core/dist/onrampApi';
import { Modal } from '../../primitives/Modal';
import IcDonemarkOutline28 from '../../icons/components/IcDonemarkOutline28';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';

export interface ChooseProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Quotes valid at the current amount. */
    items: OnrampQuoteResult[];
    /** Quotes whose merchant requires a different amount (carries min/max). */
    suggested: OnrampQuoteResult[];
    /** Currently selected merchant; checkmark is drawn on its row. */
    selectedMerchant?: ExchangeMerchantSlug;
    /** Merchant carrying the BEST badge — usually `items[0]?.merchant`. */
    bestMerchant?: ExchangeMerchantSlug;
    fiat: string;
    symbol: string;
    /** `merchantSlug → image URL`, sourced from `useExchangeMerchants()`. */
    merchantImageBySlug?: ReadonlyMap<string, string> | Readonly<Record<string, string>>;
    onSelect: (quote: OnrampQuoteResult) => void;
}

const formatRate = (rate: string, fiat: string, symbol: string): string => {
    const r = Number(rate);
    if (!Number.isFinite(r) || r <= 0) return '';
    return `1 ${fiat} ≈ ${r.toPrecision(4)} ${symbol}`;
};

const formatMin = (min: string): string => {
    const n = Number(min);
    if (!Number.isFinite(n) || n <= 0) return min;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

interface Row {
    quote: OnrampQuoteResult;
    showMin: boolean;
}

const buildRows = (items: OnrampQuoteResult[], suggested: OnrampQuoteResult[]): Row[] => {
    const itemMerchants = new Set(items.map(i => i.merchant));
    const rows: Row[] = items.map(quote => ({ quote, showMin: false }));
    for (const quote of suggested) {
        if (itemMerchants.has(quote.merchant)) continue;
        rows.push({ quote, showMin: !!quote.minAmount });
    }
    return rows;
};

const getMerchantImage = (
    merchantImageBySlug: ChooseProviderModalProps['merchantImageBySlug'],
    merchant: string
) => {
    if (!merchantImageBySlug) return undefined;

    if (typeof (merchantImageBySlug as ReadonlyMap<string, string>).get === 'function') {
        return (merchantImageBySlug as ReadonlyMap<string, string>).get(merchant);
    }

    return (merchantImageBySlug as Readonly<Record<string, string>>)[merchant];
};

const MerchantImage: FC<{ src?: string }> = ({ src }) => (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-small bg-backgroundContentTint">
        {src && <img src={src} alt="" className="block h-full w-full object-cover" />}
    </div>
);

const BestBadge: FC = () => {
    const { t } = useTranslation();
    return (
        <span className="inline-flex h-4 select-none items-center rounded-full bg-accentBlue/16 px-1.5 text-[10px] font-medium uppercase leading-none tracking-wider text-accentBlue">
            {t('enter_amount_best_badge')}
        </span>
    );
};

const ProviderRow: FC<{
    row: Row;
    isSelected: boolean;
    isBest: boolean;
    fiat: string;
    symbol: string;
    image?: string;
    onClick: () => void;
}> = ({ row, isSelected, isBest, fiat, symbol, image, onClick }) => {
    const { t } = useTranslation();
    const { quote } = row;
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 bg-backgroundContent px-4 py-3 text-left transition-colors hover:bg-backgroundContentTint focus:outline-none focus-visible:bg-backgroundContentTint"
        >
            <MerchantImage src={image} />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                    <span className="truncate text-label1 text-textPrimary capitalize">
                        {quote.merchant}
                    </span>
                    {isBest && <BestBadge />}
                </div>
                <span className="truncate text-body2 text-textSecondary">
                    {formatRate(quote.rate, fiat, symbol)}
                </span>
                {row.showMin && quote.minAmount && (
                    <span className="text-body2 text-accentOrange">
                        {t('choose_provider_min_amount', {
                            amount: formatMin(quote.minAmount),
                            fiat
                        })}
                    </span>
                )}
            </div>
            {isSelected && <IcDonemarkOutline28 className="h-7 w-7 shrink-0 text-accentBlue" />}
        </button>
    );
};

export const ChooseProviderModal: FC<ChooseProviderModalProps> = ({
    isOpen,
    onClose,
    items,
    suggested,
    selectedMerchant,
    bestMerchant,
    fiat,
    symbol,
    merchantImageBySlug,
    onSelect
}) => {
    const { t } = useTranslation();
    const rows = buildRows(items, suggested);

    return (
        <Modal isOpen={isOpen} onClose={onClose} topBarTitle={t('choose_provider_title')}>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col overflow-hidden rounded-medium divide-y divide-separatorCommon">
                    {rows.map(row => (
                        <ProviderRow
                            key={row.quote.merchant}
                            row={row}
                            isSelected={row.quote.merchant === selectedMerchant}
                            isBest={row.quote.merchant === bestMerchant}
                            fiat={fiat}
                            symbol={symbol}
                            image={getMerchantImage(merchantImageBySlug, row.quote.merchant)}
                            onClick={() => onSelect(row.quote)}
                        />
                    ))}
                </div>
                <p className={cn('text-body2 text-textSecondary')}>{t('choose_provider_footer')}</p>
            </div>
        </Modal>
    );
};
