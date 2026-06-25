import { useQuery } from '@tanstack/react-query';

import { AssetDetails, getAssetDetails } from '@tonkeeper/core/dist/service/tradingService';

import { QueryKey } from '../../libs/queryKey';
import { useUserFiat } from '../fiat';

export const useAssetDetails = (assetId: string) => {
    const fiat = useUserFiat();

    return useQuery<AssetDetails | null, Error>(
        [QueryKey.tradingAssetDetails, assetId, fiat],
        async (): Promise<AssetDetails | null> => {
            try {
                return await getAssetDetails({ assetId, currency: fiat });
            } catch (e) {
                return null;
            }
        },
        {
            enabled: !!assetId,
            refetchOnWindowFocus: false,
            keepPreviousData: true,
            retry: false
        }
    );
};
