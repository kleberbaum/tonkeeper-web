import { Network } from '../entries/network';
import { AccountId, AccountMultichain } from '../entries/account';
import { AuthKeychain, AuthPassword, MnemonicType } from '../entries/password';
import { MultichainWallet, WalletId, WalletVersion } from '../entries/wallet';
import { EvmWallet } from '../entries/evm/evm-wallet';
import { BtcWallet } from '../entries/btc/btc-wallet';
import { MultichainTronWallet } from '../entries/tron/multichain-tron-wallet';
import { SolWallet } from '../entries/sol/sol-wallet';
import { ChainId, ensureReady, getAdapter, NotImplementedError } from '../chains';
import { DEFAULT_BIP44_PATH } from '../chains/derivation';
import { APIConfig } from '../entries/apis';
import { IStorage } from '../Storage';
import { createStandardTonAccountByMnemonic, getWalletAddress } from './walletService';
import { computeMultichainWalletId } from './multichainWalletService';

/**
 * Multichain account creation. Bridges the BIP39 mnemonic that lands in
 * the create UI into:
 *
 * 1. A list of per-chain `MultichainWallet` entries with addresses and
 *    pubkeys ready to render and persist.
 * 2. An `AccountMultichain` constructed from those entries plus a
 *    name/emoji/auth bundle that mirrors the legacy
 *    `AccountTonMnemonic` shape.
 *
 * TON is special-cased: addresses are wallet-version-aware, so this
 * service routes TON through the existing
 * `createStandardTonAccountByMnemonic` to reuse `walletContract()` rather
 * than re-implementing the version-aware path. Every other chain goes
 * through the chain-kit adapter (`getAdapter(chain).deriveAddress` +
 * `.derivePublicKey`).
 *
 * `'sol'` is opportunistically skipped only while chain-kit has no
 * Solana module. Other chain-kit errors must fail account creation so a
 * selected chain is never silently dropped.
 */

interface MultichainCreateContext {
    mainnetApi: APIConfig;
    testnetApi: APIConfig;
    defaultWalletVersion: WalletVersion;
}

const walletIdForChain = (chain: ChainId, rawAddress: string): WalletId => `${chain}:${rawAddress}`;

/**
 * Resolve the TON address + pubkey for the default wallet version. The
 * preview step calls this so the TON entry renders alongside chain-kit
 * derivations. The implementation re-uses `getWalletAddress` to avoid
 * forking the version-aware path that the legacy flow has battle-tested.
 */
export const previewTonAddress = async (
    mnemonic: string[],
    defaultWalletVersion: WalletVersion
): Promise<{ rawAddress: string; publicKey: string }> => {
    const { mnemonicToKeypair } = await import('./mnemonicService');
    const keyPair = await mnemonicToKeypair(mnemonic, 'bip39');
    const publicKey = keyPair.publicKey.toString('hex');
    const { address } = getWalletAddress(publicKey, defaultWalletVersion, Network.MAINNET);
    return { rawAddress: address.toRawString(), publicKey };
};

type NonTonMultichainWallet = EvmWallet | BtcWallet | MultichainTronWallet | SolWallet;

/**
 * Build the per-chain wallet objects (with `rawAddress` / `publicKey` /
 * `derivationPath`) for `chains`, *excluding* TON. TON is handled by the
 * caller because its shape is `TonWalletStandard` and its derivation is
 * version-aware. SOL is temporarily skipped when chain-kit reports that
 * the module is not implemented; all other derivation failures propagate.
 */
const deriveNonTonMultichainWallets = async (
    chains: ChainId[],
    mnemonic: string[]
): Promise<NonTonMultichainWallet[]> => {
    // chain-kit's Kotlin/JS runtime must finish booting before any
    // CryptoWallet/Address call. Without this await the `catch` below
    // would silently swallow the first-call lifecycle error and the
    // multichain account would end up with `ton` as its only chain.
    await ensureReady();

    const phrase = mnemonic.join(' ');
    const wallets: NonTonMultichainWallet[] = [];
    for (const chain of chains) {
        if (chain === 'ton') continue;
        try {
            const adapter = getAdapter(chain);
            const rawAddress = await adapter.deriveAddress({ mnemonic: phrase });
            const publicKey = await adapter.derivePublicKey({ mnemonic: phrase });
            const id = walletIdForChain(chain, rawAddress);
            const derivationPath = DEFAULT_BIP44_PATH[chain];
            switch (chain) {
                case 'evm': {
                    const w: EvmWallet = { id, chain, rawAddress, publicKey, derivationPath };
                    wallets.push(w);
                    break;
                }
                case 'btc': {
                    const w: BtcWallet = { id, chain, rawAddress, publicKey, derivationPath };
                    wallets.push(w);
                    break;
                }
                case 'tron': {
                    const w: MultichainTronWallet = {
                        id,
                        chain,
                        rawAddress,
                        publicKey,
                        derivationPath
                    };
                    wallets.push(w);
                    break;
                }
                case 'sol': {
                    const w: SolWallet = { id, chain, rawAddress, publicKey, derivationPath };
                    wallets.push(w);
                    break;
                }
            }
        } catch (e) {
            if (chain === 'sol' && e instanceof NotImplementedError) {
                // Chain-kit gap: leave SOL out of the result until the module lands.
                continue;
            }
            throw e;
        }
    }
    return wallets;
};

/**
 * Build the multichain account end-to-end. Constructs the TON wallet via
 * the legacy `createStandardTonAccountByMnemonic` (mnemonic type
 * `'bip39'` — the seed is a BIP39 phrase) so we inherit the same
 * `id`/`auth`/`name`/`emoji`/`networks` derivation. Then strips the
 * resulting `AccountTonMnemonic` down to its TON wallet and rebuilds an
 * `AccountMultichain` whose `wallets` list includes the per-chain
 * entries derived via chain-kit.
 *
 * `enabledChains` always carries `'ton'` (constructor invariant). The
 * caller's selection is intersected with the chains the adapter could
 * actually derive — a chain the user selected but that chain-kit can't
 * handle (SOL today) is silently dropped from `enabledChains` and
 * `activeWalletByChain`, but the account still creates so the flow
 * doesn't dead-end.
 */
export const createAccountMultichainByMnemonic = async (
    context: MultichainCreateContext,
    storage: IStorage,
    mnemonic: string[],
    options: {
        enabledChains: ChainId[];
        auth: AuthPassword | Omit<AuthKeychain, 'keychainStoreKey'>;
        defaultTonVersion: WalletVersion;
    }
): Promise<AccountMultichain> => {
    const tonAccount = await createStandardTonAccountByMnemonic(
        context,
        storage,
        mnemonic,
        'bip39' as MnemonicType,
        {
            auth: options.auth,
            versions: [options.defaultTonVersion],
            generateTronWallet: false
        }
    );

    const tonWallet = tonAccount.activeTonWallet;
    const nonTonWallets = await deriveNonTonMultichainWallets(options.enabledChains, mnemonic);

    const wallets: MultichainWallet[] = [tonWallet, ...nonTonWallets];

    const activeWalletByChain: Partial<Record<ChainId, WalletId>> = {
        ton: tonWallet.id
    };
    for (const w of nonTonWallets) {
        activeWalletByChain[w.chain] = w.id;
    }

    const enabledChains: ChainId[] = ['ton'];
    for (const chain of options.enabledChains) {
        if (chain === 'ton') continue;
        if (activeWalletByChain[chain]) {
            enabledChains.push(chain);
        }
    }

    return AccountMultichain.create({
        id: tonAccount.id satisfies AccountId,
        name: tonAccount.name,
        emoji: tonAccount.emoji,
        auth: tonAccount.auth,
        enabledChains,
        activeWalletByChain,
        wallets,
        multichainWalletId: computeMultichainWalletId(mnemonic)
    });
};
