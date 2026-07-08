import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';

import { isSpamNft } from '../../../../state/nft-classification';

export interface CollectiblesSettingsGroup {
    /** Collection address for grouped rows, the NFT's own address for singles. */
    address: string;
    name?: string;
    image?: string;
    /** NFTs represented by the row; 1 for a single item without a collection. */
    count: number;
    isSingle: boolean;
    isSpam: boolean;
    isHidden: boolean;
}

export interface CollectiblesSettingsSections {
    visible: CollectiblesSettingsGroup[];
    hidden: CollectiblesSettingsGroup[];
    spam: CollectiblesSettingsGroup[];
}

/**
 * Groups a wallet's NFTs into per-collection rows (singles stay their own
 * rows) and splits them into the Visible / Hidden / Spam settings sections.
 *
 * Spam classification uses `isSpamNft` for singles and collections alike —
 * everything the gallery filters out as spam is recoverable from the Spam
 * section, and nothing else.
 */
export const groupCollectiblesForSettings = (
    nfts: NFT[],
    config: TonWalletConfig
): CollectiblesSettingsSections => {
    const groups: CollectiblesSettingsGroup[] = [];
    const byCollection = new Map<string, CollectiblesSettingsGroup>();

    for (const nft of nfts) {
        const image = nft.previews?.find(p => p.resolution === '100x100')?.url;

        if (!nft.collection) {
            groups.push({
                address: nft.address,
                name: nft.metadata?.name,
                image,
                count: 1,
                isSingle: true,
                isSpam: isSpamNft(nft, config),
                isHidden: config.hiddenNfts.includes(nft.address)
            });
            continue;
        }

        let group = byCollection.get(nft.collection.address);
        if (!group) {
            group = {
                address: nft.collection.address,
                name: nft.collection.name,
                image,
                count: 0,
                isSingle: false,
                isSpam: false,
                isHidden: config.hiddenNfts.includes(nft.collection.address)
            };
            byCollection.set(nft.collection.address, group);
            groups.push(group);
        }

        group.count += 1;
        group.isSpam ||= isSpamNft(nft, config);
        if (!group.image && image) {
            group.image = image;
        }
    }

    return {
        visible: groups.filter(g => !g.isHidden && !g.isSpam),
        hidden: groups.filter(g => g.isHidden),
        spam: groups.filter(g => g.isSpam)
    };
};
