import { FC, ReactNode } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ChainBadgeOverlay } from '../../../primitives';
import {
    isNativeRow,
    networkIcon,
    networkLabel,
    parseAssetIdHead
} from '../../../pages/home/multichain/multichain-utils';

/** State carried across the multichain send flow steps. */
export interface MultichainSendState {
    asset: MultichainWalletAsset;
    toAddress: string;
    /** Amount in the asset's smallest unit. */
    amount: bigint;
    /** Human-readable amount the user entered, for display on confirm. */
    amountDisplay: string;
    isMax: boolean;
    comment?: string;
}

/**
 * Human network standard shown under "Network" on the confirm screen
 * (the asset-id type segment): ERC20 / TRC20 / Jetton / BEP20.
 */
export const networkStandardLabel = (assetId: string): string | undefined => {
    const { type } = parseAssetIdHead(assetId);
    switch (type) {
        case 'erc20':
            return 'ERC20';
        case 'bep20':
            return 'BEP20';
        case 'trc20':
            return 'TRC20';
        case 'trc10':
            return 'TRC10';
        case 'jetton':
            return 'Jetton';
        default:
            return undefined;
    }
};

/** Rough settlement time per network, shown as "Speed: …" on confirm. Mirrors the reference apps' constants. */
export const networkSpeedMinutesLabel = (network: string): string => {
    switch (network) {
        case 'btc':
            return 'about 10 min';
        case 'ton':
        case 'tron':
            return 'about 1 min';
        default:
            return 'about 2 min';
    }
};

export const truncateAddress = (address: string, head = 6, tail = 4): string =>
    address.length <= head + tail + 1
        ? address
        : `${address.slice(0, head)}…${address.slice(-tail)}`;

/**
 * Token icon for an asset row, mirroring `HomeMultichainAssetRow`: the
 * tonapi `image` URL when present, else the local chain icon. `size` is
 * the icon edge in px.
 */
export const AssetIcon: FC<{
    asset: MultichainWalletAsset;
    size?: number;
    withChainBadge?: boolean;
}> = ({ asset, size = 44, withChainBadge = true }) => {
    const native = isNativeRow(asset.assetId);
    const { network } = parseAssetIdHead(asset.assetId);
    const dim = { height: size, width: size };

    const base =
        asset.image && asset.image.length > 0 ? (
            <img
                src={asset.image}
                alt=""
                style={dim}
                className="rounded-full bg-backgroundContent object-cover"
            />
        ) : (
            <div
                style={dim}
                className="flex items-center justify-center overflow-hidden rounded-full bg-backgroundContent [&>svg]:h-full [&>svg]:w-full"
            >
                {networkIcon(network) ?? null}
            </div>
        );

    if (native || !withChainBadge) return base;
    return <ChainBadgeOverlay icon={networkIcon(network)}>{base}</ChainBadgeOverlay>;
};

/** Small token + chain-badge pair for the form's `TokenSwitch` pill. */
export const tokenSwitchIcons = (
    asset: MultichainWalletAsset
): { icon: ReactNode; chainBadge?: ReactNode } => {
    const native = isNativeRow(asset.assetId);
    const { network } = parseAssetIdHead(asset.assetId);
    const icon =
        asset.image && asset.image.length > 0 ? (
            <img src={asset.image} alt="" />
        ) : (
            networkIcon(network)
        );
    return { icon, chainBadge: native ? undefined : networkIcon(network) };
};

export { networkLabel };
