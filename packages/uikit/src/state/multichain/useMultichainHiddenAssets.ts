import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppKey } from '@tonkeeper/core/dist/Keys';

import { useAppSdk } from '../../hooks/appSdk';
import { useActiveAccount } from '../wallet';

type HiddenMap = Record<string, string[]>;

function asMap(raw: HiddenMap | null | undefined): HiddenMap {
    return raw ?? {};
}

/**
 * Local-storage source of truth for which assets the user has chosen
 * to hide on the home portfolio. Keyed per-wallet so multiple
 * multichain wallets on the same device don't trample each other.
 *
 * The backend `POST /wallets/{id}/assets` is still called on save —
 * but the home portfolio reads this local set rather than the server's
 * `is_hidden`, so toggles take effect immediately and survive offline
 * scenarios.
 */
export const useMultichainHiddenAssets = (): Set<string> => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const walletId = account.type === 'multichain' ? account.multichainWalletId : undefined;

    const { data } = useQuery<Set<string>>(
        [AppKey.MULTICHAIN_HIDDEN_ASSETS, walletId],
        async () => {
            if (!walletId) return new Set<string>();
            const raw = await sdk.storage.get<HiddenMap>(AppKey.MULTICHAIN_HIDDEN_ASSETS);
            return new Set(asMap(raw)[walletId] ?? []);
        },
        { enabled: walletId !== undefined, keepPreviousData: true }
    );

    return data ?? new Set<string>();
};

export const useMutateMultichainHiddenAssets = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const account = useActiveAccount();
    const walletId = account.type === 'multichain' ? account.multichainWalletId : undefined;

    return useMutation<void, Error, Set<string>>(async hidden => {
        if (!walletId) throw new Error('Not a multichain account');
        const raw = (await sdk.storage.get<HiddenMap>(AppKey.MULTICHAIN_HIDDEN_ASSETS)) ?? {};
        raw[walletId] = Array.from(hidden);
        await sdk.storage.set(AppKey.MULTICHAIN_HIDDEN_ASSETS, raw);
        await client.invalidateQueries([AppKey.MULTICHAIN_HIDDEN_ASSETS, walletId]);
    });
};
