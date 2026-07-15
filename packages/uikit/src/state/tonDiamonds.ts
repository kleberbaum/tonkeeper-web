import { useQuery } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { useCallback, useEffect, useMemo } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import {
    TonDiamondsAccentKey,
    TonDiamondsCollectionAddress,
    isTonDiamondsAccentKey,
    isTonDiamondsNft,
    tonDiamondsAccentKeyByNft,
    tonDiamondsNftImage
} from '../styles/tonDiamonds';
import { UIPreferences, useMutateUserUIPreferences, useUserUIPreferences } from './theme';
import { useActiveApi, useActiveWallet } from './wallet';

export const useTonDiamondsAccentValue = (): TonDiamondsAccentKey | undefined => {
    const { data: uiPreferences } = useUserUIPreferences();
    const accent = uiPreferences?.accent;
    return isTonDiamondsAccentKey(accent) ? accent : undefined;
};

/**
 * TON Diamonds NFTs of the active wallet, fetched with a collection filter so the
 * result is complete even for wallets holding more than one page of NFTs.
 */
export const useTonDiamondsNfts = (options?: { enabled?: boolean }) => {
    const wallet = useActiveWallet();
    const api = useActiveApi();

    return useQuery<NFT[], Error>(
        [wallet.rawAddress, QueryKey.nft, TonDiamondsCollectionAddress],
        async () => {
            const { nftItems } = await new AccountsApi(api.tonApiV2).getAccountNftItems({
                accountId: wallet.rawAddress,
                collection: TonDiamondsCollectionAddress,
                offset: 0,
                limit: 1000,
                indirectOwnership: true
            });
            return nftItems.filter(isTonDiamondsNft);
        },
        { enabled: options?.enabled ?? true }
    );
};

export const useOwnedTonDiamondsAccents = (): Map<TonDiamondsAccentKey, NFT> => {
    const { data: diamonds } = useTonDiamondsNfts();
    return useMemo(() => {
        const owned = new Map<TonDiamondsAccentKey, NFT>();
        for (const nft of diamonds ?? []) {
            const key = tonDiamondsAccentKeyByNft(nft);
            if (key && !owned.has(key)) {
                owned.set(key, nft);
            }
        }
        return owned;
    }, [diamonds]);
};

/**
 * The accent is stored together with the wallet that granted it: ownership is a
 * per-wallet fact while UIPreferences are global, and the revert logic must not
 * clear the accent just because another wallet is currently active.
 */
export const useMutateTonDiamondsAccent = () => {
    const { mutateAsync, ...rest } = useMutateUserUIPreferences();
    const wallet = useActiveWallet();
    const mutateAccent = useCallback(
        (accent: TonDiamondsAccentKey | undefined, nft?: NFT) =>
            mutateAsync({
                accent,
                accentWallet: accent === undefined ? undefined : wallet.rawAddress,
                accentNftImage: accent === undefined ? undefined : tonDiamondsNftImage(nft) ?? ''
            }),
        [mutateAsync, wallet.rawAddress]
    );
    return {
        ...rest,
        mutateAsync: mutateAccent
    };
};

/**
 * The diamond render of the NFT (metadata.image_diamond) that replaces the native
 * coin icon while its accent is applied, mirroring the RN app's tonCustomIcon.
 * For accents applied before the image was persisted alongside the accent, the
 * image is backfilled once from the granting wallet's NFTs; an empty string marks
 * "checked, no image available" so the lookup does not stay enabled forever.
 */
export const useTonDiamondsCoinImage = (): string | undefined => {
    const accent = useTonDiamondsAccentValue();
    const { data: uiPreferences } = useUserUIPreferences();
    const { mutateAsync } = useMutateUserUIPreferences();
    const sdk = useAppSdk();
    const wallet = useActiveWallet();

    const storedImage = uiPreferences?.accentNftImage;
    const needsBackfill =
        accent !== undefined &&
        storedImage === undefined &&
        uiPreferences?.accentWallet === wallet.rawAddress;

    const { data: diamonds } = useTonDiamondsNfts({ enabled: needsBackfill });

    useEffect(() => {
        if (!needsBackfill || !diamonds) {
            return;
        }
        const nft = diamonds.find(item => tonDiamondsAccentKeyByNft(item) === accent);
        const image = tonDiamondsNftImage(nft) ?? '';
        (async () => {
            // The preferences write is read-merge-write; re-check the stored accent
            // right before writing so a concurrent accent change is not resurrected.
            const current = await sdk.storage.get<Partial<UIPreferences>>(AppKey.UI_PREFERENCES);
            if (current?.accent !== accent) {
                return;
            }
            await mutateAsync({ accentNftImage: image });
        })();
    }, [needsBackfill, diamonds, accent, mutateAsync, sdk]);

    if (accent === undefined || !storedImage) {
        return undefined;
    }
    return storedImage;
};

/**
 * Reverts a persisted accent to the default theme when the wallet that granted it
 * no longer holds a matching TON Diamonds NFT. Only acts while that same wallet is
 * active; other wallets keep the accent untouched. Must be mounted where an active
 * wallet exists. The NFT query only runs while a revert decision is pending.
 */
export const useTonDiamondsAccentAutoRevert = () => {
    const accent = useTonDiamondsAccentValue();
    const { data: uiPreferences } = useUserUIPreferences();
    const { mutateAsync } = useMutateTonDiamondsAccent();
    const wallet = useActiveWallet();

    const grantedByActiveWallet =
        accent !== undefined && uiPreferences?.accentWallet === wallet.rawAddress;

    const { data: diamonds } = useTonDiamondsNfts({ enabled: grantedByActiveWallet });

    useEffect(() => {
        if (!accent || !grantedByActiveWallet || !diamonds) {
            return;
        }
        const stillOwned = diamonds.some(nft => tonDiamondsAccentKeyByNft(nft) === accent);
        if (!stillOwned) {
            mutateAsync(undefined);
        }
    }, [accent, grantedByActiveWallet, diamonds, mutateAsync]);
};
