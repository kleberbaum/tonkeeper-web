import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useMultichainWalletAssets } from './useMultichainWalletAssets';

export interface MultichainWalletAssetData {
    asset: MultichainWalletAsset | undefined;
    isFetching: boolean;
}

export const useMultichainWalletAsset = (assetId: string): MultichainWalletAssetData => {
    const { data, isFetching } = useMultichainWalletAssets();
    const asset = data?.assets.find(a => a.assetId === assetId);
    return { asset, isFetching };
};
