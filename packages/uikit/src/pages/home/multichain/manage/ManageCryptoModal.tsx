import { FC, useEffect, useMemo, useState } from 'react';

import { AssetFilterChange } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useTranslation } from '../../../../hooks/translation';
import { useAllMultichainWalletAssets } from '../../../../state/multichain/useAllMultichainWalletAssets';
import {
    useMultichainHiddenAssets,
    useMutateMultichainHiddenAssets
} from '../../../../state/multichain/useMultichainHiddenAssets';
import { useSaveMultichainAssetsFilters } from '../../../../state/multichain/useSaveMultichainAssetsFilters';
import { CryptoCatalogChainChips } from '../catalog/CryptoCatalogChainChips';
import { CryptoCatalogSearch } from '../catalog/CryptoCatalogSearch';
import { ModalShell } from '../ModalShell';
import { parseAssetIdHead } from '../multichain-utils';
import { ManageCryptoHeader } from './ManageCryptoHeader';
import { ManageCryptoRow } from './ManageCryptoRow';
import { ManageCryptoSaveBar } from './ManageCryptoSaveBar';

export const ManageCryptoModal: FC<{ onClose: () => void; compact?: boolean }> = ({
    onClose,
    compact = false
}) => {
    const { t } = useTranslation();
    const { data, isFetching } = useAllMultichainWalletAssets();
    const persistedHidden = useMultichainHiddenAssets();
    const { mutateAsync: persistHiddenLocally } = useMutateMultichainHiddenAssets();
    const { mutateAsync: saveBackend, isLoading: isSaving } = useSaveMultichainAssetsFilters();

    const [chain, setChain] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState('');
    /** Per-session pending visibility overrides — assetId → desired visibility. */
    const [pendingVisibility, setPendingVisibility] = useState<Map<string, boolean>>(new Map());

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const filtered = useMemo(() => {
        const assets = data?.assets ?? [];
        const q = search.trim().toLowerCase();
        return assets.filter(a => {
            if (chain && parseAssetIdHead(a.assetId).network !== chain) return false;
            if (q) {
                const hay = `${a.symbol} ${a.name}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [data?.assets, chain, search]);

    const dirty = pendingVisibility.size > 0;

    const handleToggle = (assetId: string, currentVisible: boolean, onDiskVisible: boolean) => {
        const newVisible = !currentVisible;
        setPendingVisibility(prev => {
            const next = new Map(prev);
            if (newVisible === onDiskVisible) {
                next.delete(assetId);
            } else {
                next.set(assetId, newVisible);
            }
            return next;
        });
    };

    const handleSave = async () => {
        if (!dirty) return;
        // Compute the new local hidden set by applying pending toggles
        // on top of the persisted set.
        const nextHidden = new Set(persistedHidden);
        const changes: AssetFilterChange[] = [];
        for (const [assetId, visible] of pendingVisibility) {
            if (visible) nextHidden.delete(assetId);
            else nextHidden.add(assetId);
            changes.push({ assetId, action: visible ? 'show' : 'hide' });
        }

        // Local storage is the source of truth — write first so the home
        // portfolio updates immediately. The backend POST is best-effort
        // sync that won't roll back local state on failure.
        await persistHiddenLocally(nextHidden);
        try {
            await saveBackend(changes);
        } catch {
            // Swallow — local changes still apply. Cross-device sync
            // will reconcile on the next successful save.
        }
        setPendingVisibility(new Map());
        onClose();
    };

    return (
        <ModalShell compact={compact}>
            <ManageCryptoHeader onClose={onClose} />
            <div className="px-4 pb-3">
                <CryptoCatalogSearch value={search} onChange={setSearch} />
            </div>
            <div className="px-4 pb-3">
                <CryptoCatalogChainChips value={chain} onChange={setChain} />
            </div>
            <div
                className={`flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                    dirty ? 'pb-28' : 'pb-6'
                }`}
            >
                <div className="mx-4 overflow-hidden rounded-medium bg-backgroundContent">
                    {filtered.length > 0 ? (
                        filtered.map((asset, idx) => {
                            // Local hidden set is the source of truth.
                            // Backend `is_hidden` participates only via the
                            // sync that happens at save time.
                            const onDiskVisible = !persistedHidden.has(asset.assetId);
                            const visible = pendingVisibility.has(asset.assetId)
                                ? (pendingVisibility.get(asset.assetId) as boolean)
                                : onDiskVisible;
                            return (
                                <div
                                    key={asset.assetId}
                                    className={idx === 0 ? '' : 'border-t border-separatorCommon'}
                                >
                                    <ManageCryptoRow
                                        asset={asset}
                                        visible={visible}
                                        onToggle={() =>
                                            handleToggle(asset.assetId, visible, onDiskVisible)
                                        }
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-4 py-6 text-center text-body2 text-textSecondary">
                            {isFetching ? t('loading') : t('add_funds_no_assets_found')}
                        </div>
                    )}
                </div>
            </div>
            {dirty && <ManageCryptoSaveBar onSave={handleSave} isSaving={isSaving} />}
        </ModalShell>
    );
};
