import { FC, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';

import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useMultichainWalletAssets } from '../../../state/multichain/useMultichainWalletAssets';
import { useEnsureChainKitReady } from '../../../state/multichain/transfer/useMultichainTransfer';
import { CryptoCatalogModal } from './catalog/CryptoCatalogModal';
import { HomeMultichainActions } from './HomeMultichainActions';
import { HomeMultichainCollectibles } from './collectibles/HomeMultichainCollectibles';
import { HomeMultichainHeaderBar } from './HomeMultichainHeaderBar';
import { HomeMultichainAssetRow } from './HomeMultichainAssetRow';
import { ManageCryptoModal } from './manage/ManageCryptoModal';
import { MoreAssetsButton } from './MoreAssetsButton';
import IcChevronRight16 from '../../../icons/components/IcChevronRight16';
import IcSliders16 from '../../../icons/components/IcSliders16';

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

    // chain-kit's WASM core takes ~2s to initialise; warm it as soon as the
    // wallet home mounts so address validation and fee estimation are ready
    // by the time the user opens the send flow, not blocked behind a cold start.
    useEnsureChainKitReady();

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
        <>
            {!compact && <HomeMultichainHeaderBar />}
            <div className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-4 pb-8 text-textPrimary">
                {!compact && (
                    <header className="flex flex-col items-center gap-2 pt-4">
                        <div className="text-3xl">{account.emoji}</div>
                        <div className="text-label1 text-textSecondary">{account.name}</div>
                        <div className="text-h1">
                            {total ? formatFiatCurrency(fiat, total) : '—'}
                        </div>
                    </header>
                )}

                <HomeMultichainActions />

                <section className="flex flex-col">
                    <div className="flex items-center justify-between py-3">
                        <button
                            type="button"
                            onClick={() => setCatalogOpen(true)}
                            className="flex items-center text-left text-label1 text-textPrimary"
                        >
                            <span>{t('wallet_crypto_section')}</span>
                            {/* Chevron offsets from the List Title spec: 2px side
                                padding, nudged 1px below center. */}
                            <span className="px-0.5 pb-[3px] pt-[5px]">
                                <IcChevronRight16 className="size-4 opacity-40" />
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setManageOpen(true)}
                            className="flex items-center gap-1.5 text-label2 text-textSecondary"
                        >
                            <span>{t('wallet_manage_assets')}</span>
                            <IcSliders16 className="size-4" />
                        </button>
                    </div>
                    {allAssets.length === 0 ? (
                        <div className="rounded-medium bg-backgroundContent px-4 py-6 text-center text-body2 text-textSecondary">
                            {isFetching ? 'Loading assets…' : 'No assets yet'}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-medium bg-backgroundContent">
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

                <HomeMultichainCollectibles compact={compact} />

                {catalogOpen && (
                    <CryptoCatalogModal compact={compact} onClose={() => setCatalogOpen(false)} />
                )}
                {manageOpen && (
                    <ManageCryptoModal compact={compact} onClose={() => setManageOpen(false)} />
                )}
            </div>
        </>
    );
};
