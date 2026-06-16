import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
    AssetFilterChange,
    saveMultichainAssetsFilters
} from '@tonkeeper/core/dist/service/multichainWalletService';

import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';

export const useSaveMultichainAssetsFilters = () => {
    const account = useActiveAccount();
    const queryClient = useQueryClient();
    const walletId = account.type === 'multichain' ? account.multichainWalletId : undefined;

    return useMutation<void, Error, AssetFilterChange[]>(
        async (changes: AssetFilterChange[]) => {
            if (!walletId) throw new Error('Not a multichain account');
            await saveMultichainAssetsFilters({ walletId, changes });
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries([QueryKey.multichainWalletAssets]);
            }
        }
    );
};
