import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import {
    getMultichainWalletAssets,
    MultichainWalletAsset
} from '@tonkeeper/core/dist/service/multichainWalletService';

import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';
import { useUserFiat } from '../fiat';
import { DefaultRefetchInterval } from '../tonendpoint';
import { useMultichainHiddenAssets } from './useMultichainHiddenAssets';

export interface MultichainWalletAssetsData {
    assets: MultichainWalletAsset[];
    totalFiat: BigNumber;
}

function computeTotalFiat(assets: MultichainWalletAsset[]): BigNumber {
    return assets.reduce((sum, a) => {
        if (!a.price) return sum;
        const human = new BigNumber(a.balance).shiftedBy(-a.decimals);
        return sum.plus(human.multipliedBy(a.price));
    }, new BigNumber(0));
}

async function fetchAvailableMultichainWalletAssets(
    walletId: string,
    fiat: string
): Promise<MultichainWalletAsset[]> {
    const assets: MultichainWalletAsset[] = [];
    let cursor: string | undefined;

    do {
        const response = await getMultichainWalletAssets({
            walletId,
            currency: fiat,
            limit: 50,
            cursor,
            availableOnly: true
        });
        assets.push(...response.assets);
        cursor = response.nextCursor || undefined;
    } while (cursor);

    return assets;
}

/**
 * Multichain wallet-assets query. Fetches the flat list of assets the
 * backend has indexed for this multichain wallet — TON + EVM + BTC +
 * TRON across cursor pages, mirroring iOS / Android.
 *
 * Gated on `account.type === 'multichain'` and the account carrying a
 * `multichainWalletId`. Non-multichain accounts never fire — keeps the
 * `MULTICHAIN_ENABLED = false` build network-quiet.
 */
export const useMultichainWalletAssets = () => {
    const account = useActiveAccount();
    const fiat = useUserFiat();
    const hidden = useMultichainHiddenAssets();

    const walletId = account.type === 'multichain' ? account.multichainWalletId : undefined;

    const query = useQuery<MultichainWalletAssetsData, Error>(
        [QueryKey.multichainWalletAssets, walletId, fiat],
        async () => {
            if (!walletId) {
                return { assets: [], totalFiat: new BigNumber(0) };
            }
            const assets = await fetchAvailableMultichainWalletAssets(walletId, fiat);
            return {
                assets,
                totalFiat: computeTotalFiat(assets)
            };
        },
        {
            enabled: walletId !== undefined,
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true,
            retry: false
        }
    );

    // Overlay the local hidden-assets cache. Done in a memo (not inside
    // the query function) so toggling visibility in the Manage screen
    // updates the home portfolio instantly — no waiting for the next
    // network refetch.
    const filtered = useMemo<MultichainWalletAssetsData | undefined>(() => {
        if (!query.data) return undefined;
        if (hidden.size === 0) return query.data;
        const assets = query.data.assets.filter(a => !hidden.has(a.assetId));
        return { assets, totalFiat: computeTotalFiat(assets) };
    }, [query.data, hidden]);

    return { ...query, data: filtered };
};
