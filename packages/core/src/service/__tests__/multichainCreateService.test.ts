/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// walletService + mnemonicService import `@ton-keychain/{core,trx}` at module
// load; those ship ESM that breaks under vitest's Node loader. The BIP39
// create path doesn't touch `@ton-keychain/core` (bip39 keypair derivation is
// pure), but `createPayloadOfStandardTonAccount` always computes the *legacy*
// TRON bolt-on via `TronAddressUtils.hexToBase58` — even though we pass
// `generateTronWallet: false` and discard it. Stub just that one fn.
vi.mock('@ton-keychain/core', () => ({}));
vi.mock('@ton-keychain/trx', () => ({
    TronAddressUtils: { hexToBase58: (hex: string) => `T${hex.replace(/^0x/, '')}` }
}));

import * as chains from '../../chains';
import { ChainAdapter } from '../../chains';
import { APIConfig } from '../../entries/apis';
import { WalletVersion } from '../../entries/wallet';
import {
    isBtcWallet,
    isEvmWallet,
    isSolWallet,
    isTronWallet,
    isStandardTonWallet
} from '../../entries/wallet';
import { IStorage } from '../../Storage';
import { createAccountMultichainByMnemonic, previewTonAddress } from '../multichainCreateService';

beforeAll(() => chains.ensureReady());
afterEach(() => vi.restoreAllMocks());

/** Round-trips values through JSON, mirroring the platform storages. The
 * create flow only reads it for `getNewAccountNameAndEmoji` (empty → default
 * name/emoji), so a fresh instance per test is enough. */
class JsonStorage implements IStorage {
    private store = new Map<string, string>();

    get = async <R>(key: string): Promise<R | null> => {
        const raw = this.store.get(key);
        return raw === undefined ? null : (JSON.parse(raw) as R);
    };

    set = async <R>(key: string, value: R): Promise<R | null> => {
        this.store.set(key, JSON.stringify(value));
        return value;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V): Promise<V> => {
        for (const [k, v] of Object.entries(values)) this.store.set(k, JSON.stringify(v));
        return values;
    };

    delete = async <R>(key: string): Promise<R | null> => {
        const current = await this.get<R>(key);
        this.store.delete(key);
        return current;
    };

    clear = async (): Promise<void> => this.store.clear();
}

const CANONICAL_BIP39 =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(
        ' '
    );

// `versions` is always passed in the create flow, so `findWalletAddress`
// (the only network-touching branch) is skipped — the API configs are never
// read. Empty stubs keep the test offline.
const context = {
    mainnetApi: {} as APIConfig,
    testnetApi: {} as APIConfig,
    defaultWalletVersion: WalletVersion.V5R1
};

const auth = { kind: 'password', encryptedSecret: 'test-encrypted' } as const;

describe('createAccountMultichainByMnemonic', () => {
    it('builds a multichain account with TON + EVM + BTC + TRON wallets', async () => {
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            {
                enabledChains: ['ton', 'evm', 'btc', 'tron'],
                auth,
                defaultTonVersion: WalletVersion.V5R1
            }
        );

        expect(account.type).toBe('multichain');
        expect(account.enabledChains).toEqual(['ton', 'evm', 'btc', 'tron']);

        // One wallet per enabled chain; TON is a TonWalletStandard, the rest
        // carry their chain discriminator.
        expect(account.wallets.filter(isStandardTonWallet)).toHaveLength(1);
        expect(account.wallets.filter(isEvmWallet)).toHaveLength(1);
        expect(account.wallets.filter(isBtcWallet)).toHaveLength(1);
        expect(account.wallets.filter(isTronWallet)).toHaveLength(1);

        // activeWalletByChain points at a real wallet for every enabled chain.
        for (const chain of account.enabledChains) {
            const id = account.activeWalletByChain[chain];
            expect(id).toBeDefined();
            expect(account.wallets.some(w => w.id === id)).toBe(true);
        }

        // EVM/BTC/TRON addresses match the pinned canonical-vector fixtures.
        expect(account.wallets.find(isEvmWallet)!.rawAddress).toBe(
            '0x9858EfFD232B4033E47d90003D41EC34EcaEda94'
        );
        expect(account.wallets.find(isBtcWallet)!.rawAddress).toBe(
            'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu'
        );
        expect(account.wallets.find(isTronWallet)!.rawAddress).toBe(
            'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH'
        );
    });

    it("forces 'ton' into enabledChains even if the caller omits it", async () => {
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            { enabledChains: ['evm'], auth, defaultTonVersion: WalletVersion.V5R1 }
        );
        expect(account.enabledChains[0]).toBe('ton');
        expect(account.enabledChains).toContain('evm');
        expect(account.activeWalletByChain.ton).toBeDefined();
    });

    it("drops 'sol' — chain-kit has no Solana module — without failing the flow", async () => {
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            { enabledChains: ['ton', 'sol'], auth, defaultTonVersion: WalletVersion.V5R1 }
        );
        expect(account.enabledChains).not.toContain('sol');
        expect(account.wallets.filter(isSolWallet)).toHaveLength(0);
        expect(account.activeWalletByChain.sol).toBeUndefined();
    });

    it('rethrows non-SOL chain-kit derivation failures instead of dropping the chain', async () => {
        const failure = new Error('chain-kit wasm failed');
        const adapter: ChainAdapter = {
            chain: 'evm',
            validateAddress: () => true,
            formatAmount: () => '0',
            parseAmount: () => 0n,
            deriveAddress: vi.fn().mockRejectedValue(failure),
            derivePublicKey: vi.fn().mockResolvedValue(''),
            estimateFee: vi.fn().mockResolvedValue({ amount: 0n }),
            buildTransaction: vi.fn().mockResolvedValue({}),
            signTransaction: vi.fn().mockResolvedValue({}),
            broadcast: vi.fn().mockResolvedValue({ hash: '0x0' })
        };
        vi.spyOn(chains, 'getAdapter').mockReturnValue(adapter);

        await expect(
            createAccountMultichainByMnemonic(context, new JsonStorage(), CANONICAL_BIP39, {
                enabledChains: ['ton', 'evm'],
                auth,
                defaultTonVersion: WalletVersion.V5R1
            })
        ).rejects.toThrow('chain-kit wasm failed');
    });

    it('passes the auth bundle through to the account untouched', async () => {
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            { enabledChains: ['ton'], auth, defaultTonVersion: WalletVersion.V5R1 }
        );
        expect(account.auth).toEqual(auth);
    });
});

describe('previewTonAddress', () => {
    it('derives a raw TON address and hex pubkey for the default version', async () => {
        const { rawAddress, publicKey } = await previewTonAddress(
            CANONICAL_BIP39,
            WalletVersion.V5R1
        );
        expect(rawAddress).toMatch(/^0:[0-9a-f]{64}$/);
        expect(publicKey).toMatch(/^[0-9a-f]+$/);
    });

    it('matches the TON wallet the create flow stores', async () => {
        const { rawAddress } = await previewTonAddress(CANONICAL_BIP39, WalletVersion.V5R1);
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            { enabledChains: ['ton'], auth, defaultTonVersion: WalletVersion.V5R1 }
        );
        expect(account.activeTonWallet.rawAddress).toBe(rawAddress);
    });
});
