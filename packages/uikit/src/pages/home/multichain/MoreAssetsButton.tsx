import { FC } from 'react';
import { useTranslation } from '../../../hooks/translation';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { isNativeRow, networkIcon, parseAssetIdHead } from './multichain-utils';

const ChevronDown16 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-textSecondary">
        <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/**
 * 7th-row "More assets" button shown when the wallet holds more than 7
 * assets. Mirrors iOS `WalletBalanceMultichainAssetsListView.moreAssets`:
 * left avatar stack previews the next assets, right side has the label
 * + chevron. Tap expands the list to show every asset; expansion state
 * is owned by the parent and resets on remount per spec.
 */
export const MoreAssetsButton: FC<{
    /** Hidden assets — up to the first 2 are previewed as small avatars. */
    previewAssets: MultichainWalletAsset[];
    onClick: () => void;
}> = ({ previewAssets, onClick }) => {
    const { t } = useTranslation();
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
            <div className="flex h-11 items-center">
                <AvatarStack assets={previewAssets.slice(0, 2)} />
            </div>
            <div className="flex-1 text-label1 text-textPrimary">{t('wallet_more_assets')}</div>
            <ChevronDown16 />
        </button>
    );
};

const AvatarStack: FC<{ assets: MultichainWalletAsset[] }> = ({ assets }) => {
    if (assets.length === 0) return null;
    return (
        <div className="flex">
            {assets.map((asset, idx) => (
                <div
                    key={asset.assetId}
                    className="-ml-3 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-backgroundContent ring-2 ring-backgroundContent first:ml-0 [&>svg]:h-7 [&>svg]:w-7"
                    style={{ zIndex: assets.length - idx }}
                >
                    <AssetAvatar asset={asset} />
                </div>
            ))}
        </div>
    );
};

const AssetAvatar: FC<{ asset: MultichainWalletAsset }> = ({ asset }) => {
    const { network } = parseAssetIdHead(asset.assetId);
    if (asset.image && asset.image.length > 0) {
        return <img src={asset.image} alt="" className="h-7 w-7 rounded-full object-cover" />;
    }
    const native = isNativeRow(asset.assetId);
    return <>{native ? networkIcon(network) ?? null : networkIcon(network) ?? null}</>;
};
