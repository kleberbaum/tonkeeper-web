import { IAppSdk } from '../../AppSdk';
import { AccountId } from '../../entries/account';
import { WalletId } from '../../entries/wallet';
import { accountsStorage } from '../accountsStorage';

import { resolve } from './registry';
import { registerTonStrategies } from './strategies/ton';
import { ChainSigner, Signer } from './types';

registerTonStrategies();

interface GetSignerOptions {
    walletId?: WalletId;
    shouldCreateMetaKeys?: boolean;
}

/**
 * Core-side entry point that replaces the inline switch previously
 * in `uikit/state/mnemonic.ts`. Dispatch is by `(account.type, chain)`
 * via the strategy registry — Phase 1 only populates chain `'ton'`.
 *
 * Signature mirrors the original `getSigner()` so the uikit wrapper
 * stays a one-line delegation.
 */
export const getSigner = async (
    sdk: IAppSdk,
    accountId: AccountId,
    { walletId, shouldCreateMetaKeys }: GetSignerOptions = {}
): Promise<Signer> => {
    try {
        const account = await accountsStorage(sdk.storage).getAccount(accountId);
        if (!account) {
            throw new Error('Wallet not found');
        }

        const signer: ChainSigner = await resolve({
            sdk,
            accountId,
            accountType: account.type,
            chain: 'ton',
            walletId,
            options: { shouldCreateMetaKeys }
        });

        return signer;
    } catch (e) {
        console.error(e);
        throw e;
    }
};
