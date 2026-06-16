import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
    CatalogAsset,
    CatalogSort,
    searchMultichainCatalog
} from '@tonkeeper/core/dist/service/multichainWalletService';

import { QueryKey } from '../../libs/queryKey';
import { useUserFiat } from '../fiat';

export type { CatalogAsset, CatalogSort };

export interface UseAssetsCatalogArgs {
    chain?: string;
    search: string;
    sort: CatalogSort;
}

export const useAssetsCatalog = ({ chain, search, sort }: UseAssetsCatalogArgs) => {
    const fiat = useUserFiat();
    const debouncedSearch = useDebouncedValue(search, 250);

    return useQuery<CatalogAsset[], Error>(
        [QueryKey.tradingAssetsCatalog, fiat, chain, debouncedSearch, sort],
        async () => {
            const response = await searchMultichainCatalog({
                currency: fiat,
                sort,
                chain,
                search: debouncedSearch || undefined,
                limit: 50
            });
            return response.items;
        },
        {
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false
        }
    );
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}
