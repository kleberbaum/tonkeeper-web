import { FC, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { isSupportedChainKitNetwork } from '@tonkeeper/core/dist/service/chainkit/chainKitClient';

import { Button, ChainChip } from '../../../primitives';
import { Modal } from '../../../primitives/Modal';
import { SearchField } from '../../../primitives/SearchField';
import { cn } from '../../../libs/css';
import { useTranslation } from '../../../hooks/translation';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency, formatter } from '../../../hooks/balance';
import { useMultichainWalletAssets } from '../../../state/multichain/useMultichainWalletAssets';
import {
    isNativeRow,
    networkIcon,
    networkLabel,
    parseAssetIdHead
} from '../../../pages/home/multichain/multichain-utils';
import IcDonemarkOutline28 from '../../../icons/components/IcDonemarkOutline28';
import IcFolder84 from '../../../icons/components/IcFolder84';
import { AssetIcon } from './multichainSendShared';

export interface SendChooseAssetScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    onSelect: (asset: MultichainWalletAsset) => void;
    /** Currently-picked asset — shows a check when re-opened from the form's token pill. */
    selectedAssetId?: string;
    /** Opens the add-funds flow from the empty state. */
    onAddFunds?: () => void;
}

interface ChainFilter {
    network: string;
    label: string;
}

const buildChainFilters = (assets: MultichainWalletAsset[]): ChainFilter[] => {
    const seen = new Map<string, ChainFilter>();
    for (const asset of assets) {
        const { network } = parseAssetIdHead(asset.assetId);
        if (!network || seen.has(network)) continue;
        seen.set(network, { network, label: networkLabel(network) });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
};

const FilterChip: FC<{
    label: string;
    icon?: React.ReactNode;
    selected: boolean;
    onClick: () => void;
}> = ({ label, icon, selected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex h-8 shrink-0 items-center gap-1.5 rounded-2xl px-3 text-label2 transition-colors',
            selected
                ? 'bg-backgroundContentAttention text-textPrimary'
                : 'bg-buttonSecondaryBackground text-textPrimary hover:bg-buttonSecondaryBackgroundHighlighted'
        )}
    >
        {icon && (
            <span className="h-5 w-5 overflow-hidden rounded-full [&>svg]:h-5 [&>svg]:w-5">
                {icon}
            </span>
        )}
        <span>{label}</span>
    </button>
);

const AssetRow: FC<{
    asset: MultichainWalletAsset;
    fiat: FiatCurrencies;
    selected: boolean;
    onClick: () => void;
}> = ({ asset, fiat, selected, onClick }) => {
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);
    const human = new BigNumber(asset.balance).shiftedBy(-asset.decimals);
    const fiatBalance = asset.price ? human.multipliedBy(asset.price) : undefined;

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-backgroundContentTint"
        >
            <AssetIcon asset={asset} size={44} />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-label1 text-textPrimary">{asset.symbol}</span>
                    {!native && <ChainChip label={networkLabel(network)} />}
                </div>
                <span className="truncate text-body2 text-textSecondary">
                    {formatter.formatDisplay(human)} {asset.symbol}
                    {fiatBalance ? ` · ${formatFiatCurrency(fiat, fiatBalance)}` : ''}
                </span>
            </div>
            {selected && (
                <span className="shrink-0 text-textAccent">
                    <IcDonemarkOutline28 className="h-6 w-6" />
                </span>
            )}
        </button>
    );
};

export const SendChooseAssetScreen: FC<SendChooseAssetScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    onSelect,
    selectedAssetId,
    onAddFunds
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data } = useMultichainWalletAssets();
    const [search, setSearch] = useState('');
    const [network, setNetwork] = useState<string>('all');

    // Only show assets this chain-kit build can actually transact on — the
    // backend lists holdings on networks (polygon/avalanche/sol) that have no
    // send path yet, and a tappable row there dead-ends on a disabled confirm.
    const assets = useMemo(
        () =>
            (data?.assets ?? []).filter(asset =>
                isSupportedChainKitNetwork(parseAssetIdHead(asset.assetId).network)
            ),
        [data]
    );
    const chainFilters = useMemo(() => buildChainFilters(assets), [assets]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return assets.filter(asset => {
            const head = parseAssetIdHead(asset.assetId).network;
            if (network !== 'all' && head !== network) return false;
            if (!q) return true;
            return asset.symbol.toLowerCase().includes(q) || asset.name.toLowerCase().includes(q);
        });
    }, [assets, search, network]);

    // Empty wallet (nothing sendable at all) gets the onboarding empty state;
    // an empty *filter result* on a non-empty wallet keeps the search + chips
    // and just says "no results".
    const walletEmpty = assets.length === 0;

    return (
        // `tall` + `mobileHeight="full"` keep the sheet a constant size while the
        // user filters — otherwise the modal grows/shrinks with the result count,
        // which is jarring (the search field jumps under the cursor). The search +
        // chips stick to the top; only the result list scrolls.
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={t('send_choose_asset_title')}
            tall
            mobileHeight="full"
        >
            <div className="flex h-full flex-col">
                <div className="flex shrink-0 flex-col gap-3 pb-3">
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder={t('send_choose_asset_search')}
                        className="!p-0"
                    />

                    <div className="-mx-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="inline-flex w-max gap-1.5 px-4">
                            <FilterChip
                                label={t('add_funds_chain_filter_all')}
                                selected={network === 'all'}
                                onClick={() => setNetwork('all')}
                            />
                            {chainFilters.map(f => (
                                <FilterChip
                                    key={f.network}
                                    label={f.label}
                                    icon={networkIcon(f.network)}
                                    selected={network === f.network}
                                    onClick={() => setNetwork(f.network)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {walletEmpty ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 pb-8 text-center">
                        <span className="text-textAccent">
                            <IcFolder84 className="h-14 w-14" />
                        </span>
                        <p className="text-label1 text-textPrimary">{t('send_empty_title')}</p>
                        <p className="text-body2 text-textSecondary">{t('send_empty_subtitle')}</p>
                        {onAddFunds && (
                            <Button variant="secondary" className="mt-4" onClick={onAddFunds}>
                                {t('wallet_add_funds')}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="overflow-hidden rounded-medium bg-backgroundContent">
                            {filtered.length === 0 ? (
                                <p className="py-8 text-center text-body2 text-textSecondary">
                                    {t('send_choose_asset_empty')}
                                </p>
                            ) : (
                                filtered.map((asset, idx) => (
                                    <div
                                        key={asset.assetId}
                                        className={
                                            idx === 0 ? '' : 'border-t border-separatorCommon'
                                        }
                                    >
                                        <AssetRow
                                            asset={asset}
                                            fiat={fiat}
                                            selected={asset.assetId === selectedAssetId}
                                            onClick={() => onSelect(asset)}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
