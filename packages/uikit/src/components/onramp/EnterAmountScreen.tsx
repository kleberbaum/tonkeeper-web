import { ChangeEvent, FC, useEffect, useMemo, useRef, useState } from 'react';
import type {
    ExchangeMerchantSlug,
    ExchangePaymentMethodType,
    OnrampQuoteResult
} from '@tonkeeper/core/dist/onrampApi';
import { Button } from '../../primitives/Button';
import { Modal, ModalFooter, ModalFooterPortal, useSetModalOnBack } from '../../primitives/Modal';
import { useExchangeMerchants, useOnrampQuote } from '../../state/onramp';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';
import { ChooseProviderModal } from './ChooseProviderModal';
import { ProviderCard } from './ProviderCard';

const DEBOUNCE_MS = 350;

export interface EnterAmountScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    /** Asset chosen earlier in the flow. */
    asset: { assetId: string; symbol: string };
    /** Fiat currency for this purchase (e.g. "USD"). */
    fiat: string;
    /** Payment method chosen on the previous screen. */
    paymentMethod: ExchangePaymentMethodType;
    /** Tap the fiat suffix to open the currency picker. */
    onChangeFiat?: () => void;
    /**
     * Called with the selected quote when the user taps Continue. Parent
     * handles the disclaimer modal + `createOnrampOrder` mutation.
     */
    onContinue: (quote: OnrampQuoteResult) => void;
}

const isValidAmount = (s: string) => /^\d{0,12}(\.\d{0,8})?$/.test(s) && s !== '' && s !== '.';

// Backend mins can carry 10+ decimal places (e.g. `52412.93274092335` RSD).
// Round up to the nearest whole unit so the prefill (a) stays above the
// merchant's min, (b) reads as a clean fiat amount, and (c) passes the
// input's own decimal-count validation.
const cleanFiatAmount = (raw: string): string | undefined => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return String(Math.ceil(n));
};

const formatCryptoOut = (amount: string, symbol: string): string => {
    const a = Number(amount);
    if (!Number.isFinite(a)) return amount;
    return `${a.toPrecision(6)} ${symbol}`;
};

export const EnterAmountScreen: FC<EnterAmountScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    asset,
    fiat,
    paymentMethod,
    onChangeFiat,
    onContinue
}) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<string>('');
    const [debouncedAmount, setDebouncedAmount] = useState<string>('');
    const [selectedMerchant, setSelectedMerchant] = useState<ExchangeMerchantSlug | undefined>();
    const [providerModalOpen, setProviderModalOpen] = useState(false);

    useSetModalOnBack(onBack);

    const quote = useOnrampQuote();
    const merchants = useExchangeMerchants();

    const merchantImageBySlug = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of merchants.data ?? []) {
            if (m.image) map.set(m.id, m.image);
        }
        return map;
    }, [merchants.data]);

    const initialProbeRef = useRef(false);
    const hasPrefilledRef = useRef(false);
    const lastSentRef = useRef<string>('');

    // Probe with a tiny amount on mount to learn the merchant's min so we
    // can prefill it as the default value (matches iOS — the user shouldn't
    // have to guess what the minimum is).
    useEffect(() => {
        if (initialProbeRef.current) return;
        initialProbeRef.current = true;
        lastSentRef.current = '1';
        quote.mutate({
            targetAssetId: asset.assetId,
            fiat,
            amount: '1',
            paymentMethod
        });
    }, [asset.assetId, fiat, paymentMethod, quote]);

    // When the probe response lands, prefill the input with the discovered
    // min and re-fire at that value. Gated by `hasPrefilledRef` so the user
    // clearing the field later doesn't snap them back to the min.
    useEffect(() => {
        if (hasPrefilledRef.current) return;
        if (amount !== '') return;
        const raw = quote.data?.suggested[0]?.minAmount;
        const min = raw ? cleanFiatAmount(raw) : undefined;
        if (!min) return;
        hasPrefilledRef.current = true;
        setAmount(min);
        setDebouncedAmount(min);
        lastSentRef.current = min;
        quote.mutate({
            targetAssetId: asset.assetId,
            fiat,
            amount: min,
            paymentMethod
        });
    }, [amount, quote.data, asset.assetId, fiat, paymentMethod, quote]);

    // Debounce amount input → fire quote
    useEffect(() => {
        const handle = window.setTimeout(() => setDebouncedAmount(amount), DEBOUNCE_MS);
        return () => window.clearTimeout(handle);
    }, [amount]);

    useEffect(() => {
        if (!debouncedAmount || !isValidAmount(debouncedAmount)) return;
        if (lastSentRef.current === debouncedAmount) return;
        lastSentRef.current = debouncedAmount;
        quote.mutate({
            targetAssetId: asset.assetId,
            fiat,
            amount: debouncedAmount,
            paymentMethod
        });
    }, [debouncedAmount, asset.assetId, fiat, paymentMethod, quote]);

    const items = useMemo(() => quote.data?.items ?? [], [quote.data?.items]);
    const suggested = useMemo(() => quote.data?.suggested ?? [], [quote.data?.suggested]);
    const best = items[0];

    // Stick to the user's chosen merchant if it still has a valid quote;
    // otherwise fall through to the best one. When the typed amount is
    // below every merchant's minimum, `items` is empty and we fall back to
    // `suggested[0]` so the provider card keeps rendering — the card then
    // surfaces the merchant's minimum in accentOrange instead of a rate.
    const selected = useMemo<OnrampQuoteResult | undefined>(() => {
        if (selectedMerchant) {
            const fromItems = items.find(i => i.merchant === selectedMerchant);
            if (fromItems) return fromItems;
            const fromSuggested = suggested.find(s => s.merchant === selectedMerchant);
            if (fromSuggested) return fromSuggested;
        }
        return best ?? suggested[0];
    }, [items, suggested, selectedMerchant, best]);

    // True when the typed amount is below the selected merchant's minimum.
    // Drives the yellow "Min. amount" line that replaces the rate row.
    const selectedNeedsMin = !!selected && !items.some(i => i.merchant === selected.merchant);

    // Switch chevron only earns its place when the user has a real choice —
    // either multiple valid quotes, or at least one alternative whose
    // minimum is above the typed amount.
    const otherSuggested = suggested.filter(s => !items.some(i => i.merchant === s.merchant));
    const totalProviders = items.length + otherSuggested.length;
    const hasMultipleProviders = totalProviders > 1;

    // Hard errors that should hide the card entirely: country blocked,
    // pair unsupported, or amount above max. Amount-below-min is handled
    // inside the card (yellow min hint) so the user still sees the
    // provider and how far off they are.
    const limitError = useMemo<string | undefined>(() => {
        if (!isValidAmount(amount)) return undefined;
        if (best) return undefined;
        if (quote.isLoading) return undefined;

        const fallback = quote.data?.suggested[0];
        if (fallback) {
            const typed = Number(amount);
            const max = fallback.maxAmount ? Number(fallback.maxAmount) : undefined;
            const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
            if (max != null && Number.isFinite(max) && typed > max) {
                return t('enter_amount_max_error', { amount: fmt(max), fiat });
            }
        }

        switch (quote.data?.unavailableReason) {
            case 'country_blocked':
                return t('enter_amount_unavailable_country');
            case 'no_merchant_supports_pair':
                return t('enter_amount_unavailable_pair');
            case 'amount_above_max':
                return t('enter_amount_unavailable_above_max');
            default:
                return undefined;
        }
    }, [amount, best, quote.data, quote.isLoading, fiat, t]);

    const canContinue =
        !!selected && !selectedNeedsMin && !quote.isLoading && isValidAmount(amount);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(',', '.');
        // Allow empty + partial decimals while typing (e.g. "0.")
        if (value === '' || /^\d{0,12}(\.\d{0,8})?$/.test(value)) {
            setAmount(value);
        }
    };

    const onPressContinue = () => {
        if (!selected) return;
        onContinue(selected);
    };

    const onPickProvider = (pickedQuote: OnrampQuoteResult) => {
        setSelectedMerchant(pickedQuote.merchant);
        // Picking a merchant whose min sits above the typed amount: nudge
        // the field up to that min so the next quote refresh produces a
        // valid `items` entry for them.
        const isInItems = items.some(i => i.merchant === pickedQuote.merchant);
        if (!isInItems && pickedQuote.minAmount) {
            const min = cleanFiatAmount(pickedQuote.minAmount);
            if (min) {
                setAmount(min);
                setDebouncedAmount(min);
            }
        }
        setProviderModalOpen(false);
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                topBarTitle={t('enter_amount_title')}
                mobileHeight="half"
            >
                <div className="flex flex-col gap-2">
                    <AmountCard
                        amount={amount}
                        fiat={fiat}
                        symbol={asset.symbol}
                        onChange={onChange}
                        onChangeFiat={onChangeFiat}
                        cryptoOut={
                            selected && !selectedNeedsMin
                                ? formatCryptoOut(selected.amountOut, asset.symbol)
                                : undefined
                        }
                        isLoading={quote.isLoading}
                    />
                    {/* Reserve the height ProviderCard would take so the input
                        above doesn't jump when an error/loader/quote swaps in. */}
                    <div className="min-h-[76px]">
                        {limitError ? (
                            <div className="flex h-[76px] items-center justify-center px-4">
                                <p className="text-center text-body2 text-accentRed">
                                    {limitError}
                                </p>
                            </div>
                        ) : (
                            <ProviderCard
                                quote={selected}
                                fiat={fiat}
                                symbol={asset.symbol}
                                isLoading={quote.isLoading && !selected}
                                image={
                                    selected
                                        ? merchantImageBySlug.get(selected.merchant)
                                        : undefined
                                }
                                isBest={!!selected && selected.merchant === best?.merchant}
                                belowMin={selectedNeedsMin}
                                showSwitch={hasMultipleProviders}
                                onClick={
                                    hasMultipleProviders
                                        ? () => setProviderModalOpen(true)
                                        : undefined
                                }
                            />
                        )}
                    </div>
                </div>
                <ModalFooterPortal>
                    <ModalFooter>
                        <Button
                            variant="primaryBlue"
                            onClick={onPressContinue}
                            disabled={!canContinue}
                        >
                            {t('continue')}
                        </Button>
                    </ModalFooter>
                </ModalFooterPortal>
            </Modal>
            <ChooseProviderModal
                isOpen={providerModalOpen}
                onClose={() => setProviderModalOpen(false)}
                items={items}
                suggested={suggested}
                selectedMerchant={selected?.merchant}
                bestMerchant={best?.merchant}
                fiat={fiat}
                symbol={asset.symbol}
                merchantImageBySlug={merchantImageBySlug}
                onSelect={onPickProvider}
            />
        </>
    );
};

interface AmountCardProps {
    amount: string;
    fiat: string;
    symbol: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onChangeFiat?: () => void;
    cryptoOut: string | undefined;
    isLoading: boolean;
}

const AmountCard: FC<AmountCardProps> = ({
    amount,
    fiat,
    symbol,
    onChange,
    onChangeFiat,
    cryptoOut,
    isLoading
}) => (
    <div className="flex flex-col items-center gap-3 rounded-medium bg-backgroundContent px-4 py-6">
        <div className="flex w-full max-w-full items-baseline justify-center gap-2 overflow-hidden">
            {/* `field-sizing: content` lets the input auto-grow with its
                value, so long amounts don't clip while the [amount, fiat]
                pair stays visually centered. min-width keeps the caret
                visible when the field is empty. */}
            <input
                value={amount}
                onChange={onChange}
                inputMode="decimal"
                placeholder="0"
                aria-label="amount"
                size={1}
                className="[field-sizing:content] min-w-[1ch] max-w-full bg-transparent text-4xl font-bold text-textPrimary outline-none placeholder:text-textTertiary"
            />
            <button
                type="button"
                onClick={onChangeFiat}
                disabled={!onChangeFiat}
                aria-label={onChangeFiat ? `Change currency from ${fiat}` : undefined}
                className={cn(
                    '-mx-1 -my-1 shrink-0 rounded-medium px-1 py-1 text-3xl font-bold transition-colors',
                    'focus:outline-none focus-visible:bg-backgroundContentTint',
                    onChangeFiat
                        ? 'cursor-pointer text-accentBlue hover:bg-backgroundContentTint'
                        : 'cursor-default text-textTertiary'
                )}
            >
                {fiat}
            </button>
        </div>
        <div
            className={cn(
                'rounded-full bg-backgroundContentTint px-3 py-1 text-body3 text-textSecondary',
                isLoading && 'opacity-60'
            )}
        >
            {cryptoOut ? `${cryptoOut} ${symbol === '' ? '' : ''}` : `0 ${symbol}`}
        </div>
    </div>
);
