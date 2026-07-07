import { useInfiniteQuery } from '@tanstack/react-query';

import {
    getMultichainWalletActivities,
    MultichainActivity,
    MultichainActivityType,
    MultichainChain
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';

const PAGE_SIZE = 30;

export interface MultichainActivityFilters {
    chain?: MultichainChain;
    activityType?: MultichainActivityType;
}

/**
 * Cross-chain activity feed for a multichain wallet, paged with the
 * backend's cursor. Chain and type filters are server-enforced (passed
 * straight through as query params), so changing either produces a fresh
 * query key and a clean first page.
 *
 * Gated on `account.type === 'multichain'` and a present
 * `multichainWalletId` — non-multichain accounts never fire, keeping the
 * `MULTICHAIN_ENABLED = false` build network-quiet.
 */
export const useMultichainActivity = (filters: MultichainActivityFilters = {}) => {
    const account = useActiveAccount();
    const walletId = account.type === 'multichain' ? account.multichainWalletId : undefined;

    return useInfiniteQuery<{ activities: MultichainActivity[]; nextCursor: string }, Error>({
        queryKey: [
            QueryKey.multichainActivity,
            walletId,
            filters.chain ?? 'all',
            filters.activityType ?? 'all'
        ],
        queryFn: async ({ pageParam }) => {
            if (!walletId) return { activities: [], nextCursor: '' };
            return getMultichainWalletActivities({
                walletId,
                chain: filters.chain,
                activityType: filters.activityType,
                cursor: pageParam as string | undefined,
                limit: PAGE_SIZE
            });
        },
        getNextPageParam: lastPage => (lastPage.nextCursor ? lastPage.nextCursor : undefined),
        enabled: walletId !== undefined,
        keepPreviousData: true,
        retry: false
    });
};
