import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';

const Ellipsis28 = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
        <circle cx="5" cy="14" r="2" />
        <circle cx="14" cy="14" r="2" />
        <circle cx="23" cy="14" r="2" />
    </svg>
);

export const MultichainAssetActionBar: FC<{ hasBalance: boolean; compact?: boolean }> = ({
    hasBalance,
    compact = false
}) => {
    const { t } = useTranslation();
    // Mobile: fixed to the viewport bottom (full-width bar across the screen).
    // Desktop: sticky to the bottom of the 520px content column — the page
    // is the direct scroll child of MultichainDesktopShell's column, so
    // `sticky bottom-0` pins it to the bottom of the column's scroll
    // viewport without leaking under the sidebar. `mt-auto` keeps it at
    // the column's bottom when the page content is shorter than the column.
    const position = compact ? 'sticky bottom-0 mt-auto' : 'fixed inset-x-0 bottom-0';
    return (
        <div className={`${position} z-10 bg-backgroundTransparent backdrop-blur`}>
            <div className="flex w-full items-center gap-3 px-6 py-4">
                <button
                    type="button"
                    className="flex h-14 flex-1 items-center justify-center rounded-medium bg-buttonPrimaryBackground px-6 text-label1 text-buttonPrimaryForeground"
                >
                    {t('wallet_buy')}
                </button>
                {hasBalance && (
                    <button
                        type="button"
                        className="flex h-14 flex-1 items-center justify-center rounded-medium bg-buttonPrimaryBackground px-6 text-label1 text-buttonPrimaryForeground"
                    >
                        {t('wallet_sell')}
                    </button>
                )}
                <button
                    type="button"
                    aria-label={t('wallet_asset_more_actions')}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-buttonTertiaryBackground text-buttonTertiaryForeground"
                >
                    <Ellipsis28 />
                </button>
            </div>
            <div className="h-[21px]" />
        </div>
    );
};
