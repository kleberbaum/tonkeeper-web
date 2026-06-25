import { FC, useMemo, useState } from 'react';
import type { OnrampAsset, OnrampConfiguration } from '@tonkeeper/core/dist/onrampApi';
import { cn } from '../../libs/css';
import { ChainBadgeOverlay } from '../../primitives/ChainBadgeOverlay';
import { ChainChip } from '../../primitives/ChainChip';
import { Modal, useSetModalOnBack } from '../../primitives/Modal';
import { SearchField } from '../../primitives/SearchField';
import { useTranslation } from '../../hooks/translation';

/**
 * Display row derived from an `OnrampAsset`. `isMultiChain` is computed
 * across the configuration's full asset set so the picker can show a
 * chain badge / chain chip only when a symbol exists on more than one
 * network.
 */
export interface OnrampAssetRow {
    /** First-segment chain identifier (e.g. `ton`, `eth`, `btc`). */
    chain: string;
    /** Human network label (e.g. "Ethereum"). Empty for native coins. */
    networkName?: string;
    networkImage?: string;
    assetId: string;
    symbol: string;
    image?: string;
    /**
     * True when the same `symbol` appears on more than one chain across
     * the configuration. Drives the chain pill + chain badge overlay in
     * the UI.
     */
    isMultiChain: boolean;
}

export interface ChooseAssetScreenProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when the user taps an asset row. */
    onSelect: (asset: OnrampAssetRow) => void;
    /**
     * Called when the user taps the back arrow. When omitted, no back
     * arrow is shown.
     */
    onBack?: () => void;
    /** Configuration returned by `useOnrampConfiguration()`. */
    configuration?: OnrampConfiguration;
    isLoading?: boolean;
}

const chainFromAssetId = (assetId: string): string => assetId.split('/')[0] || '';

const buildRows = (assets: OnrampAsset[]): OnrampAssetRow[] => {
    const rows: OnrampAssetRow[] = assets.map(a => ({
        chain: chainFromAssetId(a.assetId),
        networkName: a.networkName,
        networkImage: a.networkImage,
        assetId: a.assetId,
        symbol: a.symbol,
        image: a.image,
        isMultiChain: false
    }));
    const symbolCounts = new Map<string, number>();
    for (const row of rows) {
        symbolCounts.set(row.symbol, (symbolCounts.get(row.symbol) ?? 0) + 1);
    }
    for (const row of rows) {
        row.isMultiChain = (symbolCounts.get(row.symbol) ?? 0) > 1;
    }
    return rows;
};

interface ChainFilter {
    chain: string;
    label: string;
    image?: string;
}

const buildChainFilters = (rows: OnrampAssetRow[]): ChainFilter[] => {
    const seen = new Map<string, ChainFilter>();
    for (const row of rows) {
        if (seen.has(row.chain)) continue;
        seen.set(row.chain, {
            chain: row.chain,
            label: row.networkName || row.chain.toUpperCase(),
            image: row.networkImage
        });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
};

const AssetIcon: FC<{ row: OnrampAssetRow }> = ({ row }) => {
    const base = (
        <div className="h-11 w-11 overflow-hidden rounded-full bg-backgroundContentTint">
            {row.image && (
                <img src={row.image} alt="" className="block h-full w-full object-cover" />
            )}
        </div>
    );
    if (!row.isMultiChain || !row.networkImage) {
        return base;
    }
    return (
        <ChainBadgeOverlay
            icon={<img src={row.networkImage} alt="" className="h-5 w-5 object-cover" />}
        >
            {base}
        </ChainBadgeOverlay>
    );
};

const AssetRow: FC<{ row: OnrampAssetRow; onClick: () => void }> = ({ row, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-medium px-2 py-2 text-left transition-colors hover:bg-backgroundContentTint focus:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue"
    >
        <AssetIcon row={row} />
        <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2">
                <span className="truncate text-label1 text-textPrimary">{row.symbol}</span>
                {row.isMultiChain && row.networkName && <ChainChip label={row.networkName} />}
            </div>
            {/* TODO: backend's per-asset row doesn't expose a long display
                name (e.g. "Tether USD"); falling back to symbol until the
                spec gains a `name` field. */}
            <span className="truncate text-body2 text-textSecondary">{row.symbol}</span>
        </div>
    </button>
);

const FilterChip: FC<{
    filter: { label: string; image?: string };
    selected: boolean;
    onClick: () => void;
}> = ({ filter, selected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-label2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue',
            selected
                ? 'bg-backgroundContent text-textPrimary'
                : 'bg-backgroundContentTint text-textSecondary hover:text-textPrimary'
        )}
    >
        {filter.image && <img src={filter.image} alt="" className="h-4 w-4 rounded-full" />}
        <span>{filter.label}</span>
    </button>
);

export const ChooseAssetScreen: FC<ChooseAssetScreenProps> = ({
    isOpen,
    onClose,
    onSelect,
    onBack,
    configuration,
    isLoading
}) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [chainFilter, setChainFilter] = useState<string>('all');

    useSetModalOnBack(onBack);

    const rows = useMemo(() => buildRows(configuration?.assets ?? []), [configuration]);
    const chainFilters = useMemo(() => buildChainFilters(rows), [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(row => {
            if (chainFilter !== 'all' && row.chain !== chainFilter) return false;
            if (!q) return true;
            return row.symbol.toLowerCase().includes(q);
        });
    }, [rows, search, chainFilter]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} topBarTitle={t('add_funds_choose_asset_title')}>
            <div className="flex flex-col gap-3 pb-4">
                <SearchField value={search} onChange={setSearch} />

                {/* Edge-to-edge scroll: the viewport bleeds outside the
                    modal's px-4 padding (`-mx-4`) so the scroll track has
                    no horizontal padding of its own. The first/last chip
                    insets come from the inner row's own `px-4`. The inner
                    uses `inline-flex w-max` so its box grows with content
                    (a plain block `flex` would stay viewport-width and the
                    right padding wouldn't be part of the scrollable area). */}
                <div className="-mx-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="inline-flex w-max gap-2 px-4">
                        <FilterChip
                            filter={{ label: t('add_funds_chain_filter_all') }}
                            selected={chainFilter === 'all'}
                            onClick={() => setChainFilter('all')}
                        />
                        {chainFilters.map(f => (
                            <FilterChip
                                key={f.chain}
                                filter={f}
                                selected={chainFilter === f.chain}
                                onClick={() => setChainFilter(f.chain)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    {isLoading && filtered.length === 0 && (
                        <p className="py-8 text-center text-body2 text-textSecondary">
                            {t('loading')}
                        </p>
                    )}
                    {!isLoading && filtered.length === 0 && (
                        <p className="py-8 text-center text-body2 text-textSecondary">
                            {t('add_funds_no_assets_found')}
                        </p>
                    )}
                    {filtered.map(row => (
                        <AssetRow key={row.assetId} row={row} onClick={() => onSelect(row)} />
                    ))}
                </div>
            </div>
        </Modal>
    );
};
