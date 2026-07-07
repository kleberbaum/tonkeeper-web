import { FC, useEffect, useState } from 'react';

import { CatalogSort } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useTranslation } from '../../../../hooks/translation';
import { useAssetsCatalog } from '../../../../state/trading/useAssetsCatalog';
import { ModalShell } from '../ModalShell';
import { MultichainChainChips } from '../MultichainChainChips';
import { CryptoCatalogHeader } from './CryptoCatalogHeader';
import { CryptoCatalogRow } from './CryptoCatalogRow';
import { CryptoCatalogSearch } from './CryptoCatalogSearch';
import { CryptoCatalogSortButton } from './CryptoCatalogSortButton';

export const CryptoCatalogModal: FC<{ onClose: () => void; compact?: boolean }> = ({
    onClose,
    compact = false
}) => {
    const { t } = useTranslation();
    const [chain, setChain] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<CatalogSort>('market_cap');

    const { data: items, isFetching } = useAssetsCatalog({ chain, search, sort });

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <ModalShell compact={compact}>
            <CryptoCatalogHeader onClose={onClose} />
            <div className="px-4 pb-3">
                <CryptoCatalogSearch value={search} onChange={setSearch} />
            </div>
            <div className="px-4 pb-3">
                <MultichainChainChips value={chain} onChange={setChain} />
            </div>
            <div className="flex-1 overflow-y-auto pb-24 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="mx-4 overflow-hidden rounded-medium bg-backgroundContent">
                    {items && items.length > 0 ? (
                        items.map((asset, idx) => (
                            <div
                                key={asset.assetId}
                                className={idx === 0 ? '' : 'border-t border-separatorCommon'}
                            >
                                <CryptoCatalogRow asset={asset} onSelect={onClose} />
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-6 text-center text-body2 text-textSecondary">
                            {isFetching ? t('loading') : t('add_funds_no_assets_found')}
                        </div>
                    )}
                </div>
            </div>
            <CryptoCatalogSortButton value={sort} onChange={setSort} />
        </ModalShell>
    );
};
