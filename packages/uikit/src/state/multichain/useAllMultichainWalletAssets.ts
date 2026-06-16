import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import {
    getMultichainWalletAssets,
    MultichainWalletAsset
} from '@tonkeeper/core/dist/service/multichainWalletService';

import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';
import { useUserFiat } from '../fiat';

export interface AllMultichainWalletAssetsData {
    assets: MultichainWalletAsset[];
}

function fiatValue(asset: MultichainWalletAsset): BigNumber {
    if (!asset.price) return new BigNumber(0);
    return new BigNumber(asset.balance).shiftedBy(-asset.decimals).multipliedBy(asset.price);
}

/**
 * Fetches every asset the backend tracks for this multichain wallet —
 * including hidden ones and zero-balance ones — for the Manage Crypto
 * screen. The home portfolio uses `useMultichainWalletAssets` instead,
 * which filters to `availableOnly: true`.
 *
 * Sort matches iOS' `TokenManagementBalanceService`: fiat balance
 * descending, then name ascending as the tiebreaker for zero-balance
 * rows. The user explicitly requested this ordering.
 */
export const useAllMultichainWalletAssets = () => {
    const account = useActiveAccount();
    const fiat = useUserFiat();

    const walletId = account.type === 'multichain' ? account.multichainWalletId : undefined;

    return useQuery<AllMultichainWalletAssetsData, Error>(
        [QueryKey.multichainWalletAssets, 'all', walletId, fiat],
        async () => {
            if (!walletId) return { assets: [] };
            const collected: MultichainWalletAsset[] = [];
            let cursor: string | undefined;
            // Multi-page until exhausted. Matches iOS' loadAssets loop.
            do {
                const response = await getMultichainWalletAssets({
                    walletId,
                    currency: fiat,
                    limit: 50,
                    cursor,
                    showHidden: true
                });
                collected.push(...response.assets);
                cursor = response.nextCursor || undefined;
            } while (cursor);

            const sorted = collected
                .map(asset => ({ asset, fiat: fiatValue(asset) }))
                .sort((a, b) => {
                    const cmp = b.fiat.comparedTo(a.fiat);
                    if (cmp !== 0) return cmp;
                    return a.asset.name.localeCompare(b.asset.name);
                })
                .map(x => x.asset);

            return { assets: sorted };
        },
        {
            enabled: walletId !== undefined,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false
        }
    );
};
