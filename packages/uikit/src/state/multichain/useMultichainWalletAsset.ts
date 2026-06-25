import { ChainId } from '@tonkeeper/core/dist/chains/types';
import { AssetDetailsAsset } from '@tonkeeper/core/dist/service/tradingService';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useAssetDetails } from '../trading/useAssetDetails';
import { useMultichainWalletAssets } from './useMultichainWalletAssets';

export interface MultichainWalletAssetData {
    asset: MultichainWalletAsset | undefined;
    isFetching: boolean;
}

function chainIdFromAssetId(assetId: string): ChainId | undefined {
    const head = assetId.split('/')[0];
    switch (head) {
        case 'ton':
            return 'ton';
        case 'tron':
            return 'tron';
        case 'eth':
        case 'evm':
        case 'arb':
        case 'base':
        case 'bsc':
        case 'polygon':
        case 'avalanche':
            return 'evm';
        case 'btc':
            return 'btc';
        case 'sol':
            return 'sol';
        default:
            return undefined;
    }
}

function fallbackAssetFromDetails(
    assetId: string,
    detailsAsset: AssetDetailsAsset | undefined
): MultichainWalletAsset | undefined {
    if (!detailsAsset) return undefined;
    const chain = chainIdFromAssetId(detailsAsset.assetId);
    if (!chain) return undefined;

    return {
        assetId,
        chain,
        name: detailsAsset.name,
        symbol: detailsAsset.symbol,
        decimals: detailsAsset.decimals,
        image: detailsAsset.image,
        balance: '0',
        isHidden: false
    };
}

export const useMultichainWalletAsset = (assetId: string): MultichainWalletAssetData => {
    const { data, isFetching } = useMultichainWalletAssets();
    const { data: details, isFetching: isDetailsFetching } = useAssetDetails(assetId);

    const asset =
        data?.assets.find(a => a.assetId === assetId) ??
        fallbackAssetFromDetails(assetId, details?.asset);

    return { asset, isFetching: isFetching || (!asset && isDetailsFetching) };
};
