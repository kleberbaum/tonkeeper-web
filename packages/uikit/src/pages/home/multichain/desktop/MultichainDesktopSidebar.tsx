import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';

import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useMultichainWalletAssets } from '../../../../state/multichain/useMultichainWalletAssets';

const BatteryIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
            x="2.5"
            y="6"
            width="13"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        <path d="M16 9V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="4.5" y="8" width="6" height="4" rx="0.5" fill="currentColor" />
    </svg>
);

/**
 * Minimal sidebar — balance card on top + active wallet card. Folders
 * (Personal/Work/DeFi tabs) and Dashboard/Manage Wallets settings are
 * deferred to follow-up work; this iteration is portfolio-only.
 */
export const MultichainDesktopSidebar: FC<{ account: AccountMultichain }> = ({ account }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data } = useMultichainWalletAssets();
    const total = data?.totalFiat;
    const totalLabel = total ? formatFiatCurrency(fiat, total) : '—';

    return (
        <aside className="flex h-full w-[280px] shrink-0 flex-col gap-2">
            <div className="rounded-medium bg-backgroundContent p-4">
                <div className="flex items-start justify-between">
                    <div className="text-h2 text-textPrimary">{totalLabel}</div>
                    <div className="text-textAccent">
                        <BatteryIcon />
                    </div>
                </div>
            </div>

            <div className="rounded-medium bg-backgroundContent p-2">
                <div className="relative flex items-center gap-3 rounded-small bg-backgroundContentTint px-3 py-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-backgroundPage text-xl">
                        {account.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-label2 text-textPrimary">
                                {account.name}
                            </span>
                            <span className="rounded-md bg-backgroundPage px-1.5 py-0.5 text-body4Caps uppercase text-textAccent">
                                {t('multichain')}
                            </span>
                        </div>
                        <div className="text-body3 text-textSecondary">{totalLabel}</div>
                    </div>
                    <span className="absolute right-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-buttonPrimaryBackground" />
                </div>
            </div>
        </aside>
    );
};
