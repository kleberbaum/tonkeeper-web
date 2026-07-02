import { FC } from 'react';

import { useTranslation } from '../../../hooks/translation';
import IcRefresh16 from '../../../icons/components/IcRefresh16';

export interface NetworkFeeValueProps {
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
    /** Pre-formatted fiat estimate (e.g. "$0.000262"); when set the fee shows "≈ fiat · symbol". */
    fiatText?: string;
    /** Pre-formatted crypto amount + symbol (e.g. "0.005 TON"); the fallback when no fiat rate. */
    cryptoText?: string;
    /** Fee currency symbol shown after the fiat estimate. */
    symbol?: string;
}

/**
 * Network-fee value for the confirm row. The currency renders plain — the blue
 * accent + switch chevron is a "choose payment method" affordance reserved for
 * when more than one fee method is available (Figma 478:34717 / 478:34764), and
 * a multichain account currently has a single method per chain.
 */
export const NetworkFeeValue: FC<NetworkFeeValueProps> = ({
    loading,
    error,
    onRetry,
    fiatText,
    cryptoText,
    symbol
}) => {
    const { t } = useTranslation();

    if (error) {
        return (
            <span className="inline-flex items-center gap-1">
                {t('send_fee_unavailable')} <span className="text-textSecondary">·</span>
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1 text-textAccent"
                >
                    {t('send_fee_retry')} <IcRefresh16 className="inline-block h-4 w-4" />
                </button>
            </span>
        );
    }
    if (loading) return <>…</>;
    if (fiatText) {
        return (
            <>
                ≈ {fiatText} <span className="text-textSecondary">·</span> {symbol}
            </>
        );
    }
    if (cryptoText) return <>{cryptoText}</>;
    return <>—</>;
};
