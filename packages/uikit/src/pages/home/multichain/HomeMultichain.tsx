import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';

import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useMultichainWalletAssets } from '../../../state/multichain/useMultichainWalletAssets';
import { CryptoCatalogModal } from './catalog/CryptoCatalogModal';
import { HomeMultichainAssetRow } from './HomeMultichainAssetRow';
import { ManageCryptoModal } from './manage/ManageCryptoModal';
import { MoreAssetsButton } from './MoreAssetsButton';

const Chevron16 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-40">
        <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const Sliders16 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
            d="M2 4H10M2 12H6M14 4H13M14 12H10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <circle cx="11.5" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

/**
 * Asset-list expansion thresholds. Same algorithm as iOS
 * `WalletBalanceMultichainAssetsListViewModel`:
 *   - ≤ threshold assets → render the whole list.
 *   - > threshold assets → render the first `collapsedVisibleCount`
 *     plus a "More assets" row that, on tap, expands to show every
 *     asset. Expansion state stays local and resets when the component
 *     remounts — per the spec, the list re-collapses on a new session.
 *
 * Mobile uses iOS' numbers (6 visible, threshold 7). Desktop shrinks
 * to 4/5 because the column also has to fit the Collectibles section
 * below it without forcing a long scroll — see the desktop mockup
 * showing exactly 4 crypto rows above the NFT carousel.
 */
const COLLAPSED_VISIBLE_COUNT = { full: 6, compact: 4 } as const;
const MORE_ASSETS_THRESHOLD = {
    full: COLLAPSED_VISIBLE_COUNT.full + 1,
    compact: COLLAPSED_VISIBLE_COUNT.compact + 1
} as const;

export const HomeMultichain: FC<{ account: AccountMultichain; compact?: boolean }> = ({
    account,
    compact = false
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data, isFetching } = useMultichainWalletAssets();
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [moreExpanded, setMoreExpanded] = useState(false);

    const total = data?.totalFiat;
    const allAssets = data?.assets ?? [];
    const collapsedCount = compact ? COLLAPSED_VISIBLE_COUNT.compact : COLLAPSED_VISIBLE_COUNT.full;
    const threshold = compact ? MORE_ASSETS_THRESHOLD.compact : MORE_ASSETS_THRESHOLD.full;
    const showMoreButton = !moreExpanded && allAssets.length > threshold;
    const visibleAssets = showMoreButton ? allAssets.slice(0, collapsedCount) : allAssets;
    const previewAssets = showMoreButton ? allAssets.slice(collapsedCount, collapsedCount + 2) : [];

    return (
        <div className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-4 py-8 text-textPrimary">
            {!compact && (
                <header className="flex flex-col items-center gap-2 pt-4">
                    <div className="text-3xl">{account.emoji}</div>
                    <div className="text-label1 text-textSecondary">{account.name}</div>
                    <div className="text-h1">{total ? formatFiatCurrency(fiat, total) : '—'}</div>
                </header>
            )}

            <section className="flex flex-col">
                <div className="flex items-center justify-between py-3">
                    <button
                        type="button"
                        onClick={() => setCatalogOpen(true)}
                        className="flex items-center gap-1 text-left text-label1 text-textPrimary"
                    >
                        <span>{t('wallet_crypto_section')}</span>
                        <Chevron16 />
                    </button>
                    <button
                        type="button"
                        onClick={() => setManageOpen(true)}
                        className="flex items-center gap-1.5 text-label2 text-textSecondary"
                    >
                        <span>{t('wallet_manage_assets')}</span>
                        <Sliders16 />
                    </button>
                </div>
                {allAssets.length === 0 ? (
                    <div className="rounded-2xl bg-backgroundContent px-4 py-6 text-center text-body2 text-textSecondary">
                        {isFetching ? 'Loading assets…' : 'No assets yet'}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl bg-backgroundContent">
                        {visibleAssets.map((asset, idx) => (
                            <div
                                key={asset.assetId}
                                className={idx === 0 ? '' : 'border-t border-separatorCommon'}
                            >
                                <HomeMultichainAssetRow asset={asset} />
                            </div>
                        ))}
                        {showMoreButton && (
                            <div className="border-t border-separatorCommon">
                                <MoreAssetsButton
                                    previewAssets={previewAssets}
                                    onClick={() => setMoreExpanded(true)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </section>

            {catalogOpen && (
                <CryptoCatalogModal compact={compact} onClose={() => setCatalogOpen(false)} />
            )}
            {manageOpen && (
                <ManageCryptoModal compact={compact} onClose={() => setManageOpen(false)} />
            )}
        </div>
    );
};
