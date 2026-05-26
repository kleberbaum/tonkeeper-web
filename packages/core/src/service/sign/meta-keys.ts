import { keyPairFromSeed } from '@ton/crypto';

import { IAppSdk } from '../../AppSdk';
import { AppKey } from '../../Keys';
import { MnemonicType } from '../../entries/password';
import { MetaEncryptionSerializedMap } from '../../entries/wallet';
import { createEncryptionCertificate } from '../meta';
import { mnemonicToEd25519Seed } from '../mnemonicService';
import { serializeMetaKey } from '../../utils/metadata';

interface CreateMetaKeysData {
    seedPrase: string[];
    rawAddress: string;
    mnemonicType?: MnemonicType;
}

/**
 * Side effect of the `mam` and `mnemonic` signing strategies: derive a
 * per-wallet encryption certificate and persist it under
 * `META_ENCRYPTION_MAP`. The flag is plumbed through
 * `SignerFactoryArgs.options.shouldCreateMetaKeys` — silent regression
 * risk if removed, so the strategies that need it call this directly.
 */
export const createAndStoreMetaEncryptionKeys = async (sdk: IAppSdk, data: CreateMetaKeysData) => {
    const { seedPrase, rawAddress, mnemonicType } = data;

    const walletMainEd22519Seed = await mnemonicToEd25519Seed(seedPrase, mnemonicType);

    const keyPair = keyPairFromSeed(walletMainEd22519Seed);

    const walletMainPrivateKey = keyPairFromSeed(walletMainEd22519Seed);

    const certificate = createEncryptionCertificate(keyPair, walletMainPrivateKey);

    const metaEncryptionMap =
        (await sdk.storage.get<MetaEncryptionSerializedMap>(AppKey.META_ENCRYPTION_MAP)) ?? {};

    metaEncryptionMap[rawAddress] = serializeMetaKey({
        keyPair,
        certificate
    });

    await sdk.storage.set(AppKey.META_ENCRYPTION_MAP, metaEncryptionMap);
};
