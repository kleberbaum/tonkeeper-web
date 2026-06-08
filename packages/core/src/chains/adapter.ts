/* eslint-disable @typescript-eslint/no-explicit-any */
import BigNumber from 'bignumber.js';
import {
    Address as ChainkitAddress,
    Chain as ChainkitChain,
    CryptoWallet as ChainkitCryptoWallet
} from '@tonkeeper/chainkit';

import { BuildTxArgs, ChainAdapter, ChainId, ChainSigner, NotImplementedError } from './types';

/**
 * Chain-kit-backed `ChainAdapter`. The `chain` instance field selects
 * the chain-kit constant at call time, so `validateAddress` delegates
 * to `ChainkitAddress.Companion.from(addr, chainOf(this.chain))`.
 *
 * Read-side operations (`validateAddress`, `formatAmount`, `parseAmount`,
 * `deriveAddress`, `derivePublicKey`) are wired. Write-side operations
 * (`estimateFee`, `buildTransaction`, `signTransaction`, `broadcast`)
 * throw `NotImplementedError`:
 *
 * - TON's version-aware pubkey → address derivation goes through
 *   `walletContract()` in `service/wallet/contractService.ts`. The
 *   chain-agnostic shape here is too narrow for that path.
 * - Sign / build / broadcast paths live in their existing service
 *   modules.
 *
 * `ensureReady()` must be awaited at app startup (and in tests'
 * `beforeAll`) before any sync method is called. `validateAddress` is
 * sync, so chain-kit's lifecycle can't be awaited inline.
 */

const chainOf = (id: ChainId): unknown => {
    switch (id) {
        case 'ton':
            return ChainkitChain.Ton.Mainnet;
        case 'evm':
            return ChainkitChain.Ethereum.Mainnet;
        case 'btc':
            return ChainkitChain.Bitcoin.Mainnet;
        case 'tron':
            return ChainkitChain.Tron.Mainnet;
        case 'sol':
            throw new NotImplementedError(
                'sol',
                'validateAddress',
                'chain-kit has no Solana module'
            );
    }
};

/** Default smallest-unit decimals for the chain's native coin. */
const DEFAULT_DECIMALS: Record<ChainId, number> = {
    ton: 9,
    evm: 18,
    btc: 8,
    tron: 6,
    sol: 9
};

class ChainkitAdapter implements ChainAdapter {
    constructor(public readonly chain: ChainId) {}

    validateAddress(addr: string): boolean {
        try {
            const result = (ChainkitAddress as any).Companion.from(addr, chainOf(this.chain));
            return result !== null && result !== undefined;
        } catch {
            // sol throws from chainOf(); malformed input that confuses chain-kit
            // (rather than just returning null) also lands here.
            return false;
        }
    }

    formatAmount(amount: bigint, opts?: { decimals?: number }): string {
        const decimals = opts?.decimals ?? DEFAULT_DECIMALS[this.chain];
        return new BigNumber(amount.toString()).shiftedBy(-decimals).toFixed();
    }

    parseAmount(human: string, opts?: { decimals?: number }): bigint {
        const decimals = opts?.decimals ?? DEFAULT_DECIMALS[this.chain];
        const bn = new BigNumber(human);
        if (bn.isNaN()) {
            throw new Error(`parseAmount: invalid numeric string "${human}"`);
        }
        if ((bn.decimalPlaces() ?? 0) > decimals) {
            throw new Error(`parseAmount: "${human}" exceeds ${decimals} decimals`);
        }
        return BigInt(bn.shiftedBy(decimals).toFixed(0));
    }

    async deriveAddress(args: { mnemonic: string }): Promise<string> {
        if (this.chain === 'sol') {
            throw new NotImplementedError('sol', 'deriveAddress', 'chain-kit has no Solana module');
        }
        if (this.chain === 'ton') {
            // TON addresses are wallet-version-aware (V4R2 vs V5R1 vs …) — the
            // address-from-mnemonic shape on this adapter can't pick a version.
            // Multichain account creation derives the TON pubkey via
            // `bip39MnemonicToEd25519Seed` and resolves the address through
            // `walletContract(pubkey, version)` directly.
            throw new NotImplementedError(
                'ton',
                'deriveAddress',
                'TON addresses are version-aware — use walletContract() in service/wallet/contractService.ts'
            );
        }
        const wallet = (ChainkitCryptoWallet as any).Companion.fromMnemonic(args.mnemonic);
        const address = wallet.getAddress(chainOf(this.chain));
        return address.display;
    }

    async derivePublicKey(args: { mnemonic: string }): Promise<string> {
        if (this.chain === 'sol') {
            throw new NotImplementedError(
                'sol',
                'derivePublicKey',
                'chain-kit has no Solana module'
            );
        }
        if (this.chain === 'ton') {
            throw new NotImplementedError(
                'ton',
                'derivePublicKey',
                'TON pubkey comes from bip39MnemonicToEd25519Seed in service/mnemonicService.ts'
            );
        }
        const wallet = (ChainkitCryptoWallet as any).Companion.fromMnemonic(args.mnemonic);
        const hex: string = wallet.getPublicKeyHex(chainOf(this.chain));
        // chain-kit prefixes the pubkey with `0x`; the per-chain wallet types
        // (`EvmWallet`/`BtcWallet`/…) document plain hex. Strip it so the
        // stored value matches the documented shape and is uniform per chain.
        return hex.startsWith('0x') ? hex.slice(2) : hex;
    }

    async estimateFee(): Promise<never> {
        throw new NotImplementedError(this.chain, 'estimateFee', 'not wired yet');
    }

    async buildTransaction(_args: BuildTxArgs): Promise<unknown> {
        throw new NotImplementedError(this.chain, 'buildTransaction', 'not wired yet');
    }

    async signTransaction(_args: { message: unknown; signer: ChainSigner }): Promise<unknown> {
        throw new NotImplementedError(
            this.chain,
            'signTransaction',
            this.chain === 'ton'
                ? 'TON signing lives in the signer factory, not on the adapter'
                : 'not wired yet'
        );
    }

    async broadcast(): Promise<{ hash: string }> {
        throw new NotImplementedError(this.chain, 'broadcast', 'not wired yet');
    }
}

export const buildAdapter = (chain: ChainId): ChainAdapter => new ChainkitAdapter(chain);
