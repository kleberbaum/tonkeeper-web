/* eslint-disable @typescript-eslint/no-explicit-any */
import BigNumber from 'bignumber.js';
import { Address as ChainkitAddress, Chain as ChainkitChain } from 'chainkit';

import { BuildTxArgs, ChainAdapter, ChainId, ChainSigner, NotImplementedError } from './types';

/**
 * Chain-kit-backed `ChainAdapter`. The `chain` instance field selects
 * the chain-kit constant at call time, so `validateAddress` delegates
 * to `ChainkitAddress.Companion.from(addr, chainOf(this.chain))`.
 *
 * Phase 1 wires the read-side (`validateAddress`, `formatAmount`,
 * `parseAmount`). Write-side operations throw `NotImplementedError`:
 *
 * - TON's version-aware pubkey → address derivation goes through
 *   `walletContract()` in `service/wallet/contractService.ts` (Track C).
 *   The chain-agnostic shape here is too narrow for that path.
 * - Sign / build / broadcast paths live in their existing service
 *   modules; Phase 2/3 wires them through the adapter once the per-chain
 *   tx ergonomics are clear.
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
                'Phase ? (chain-kit has no Solana module)'
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

    async deriveAddress(): Promise<string> {
        throw new NotImplementedError(
            this.chain,
            'deriveAddress',
            this.chain === 'ton'
                ? 'Phase 1 — TON uses walletContract() in service/wallet/contractService.ts'
                : 'Phase 2+'
        );
    }

    async estimateFee(): Promise<never> {
        throw new NotImplementedError(this.chain, 'estimateFee', 'Phase 2+');
    }

    async buildTransaction(_args: BuildTxArgs): Promise<unknown> {
        throw new NotImplementedError(this.chain, 'buildTransaction', 'Phase 2+');
    }

    async signTransaction(_args: { message: unknown; signer: ChainSigner }): Promise<unknown> {
        throw new NotImplementedError(
            this.chain,
            'signTransaction',
            this.chain === 'ton' ? 'Phase 1 / Track B' : 'Phase 2+'
        );
    }

    async broadcast(): Promise<{ hash: string }> {
        throw new NotImplementedError(this.chain, 'broadcast', 'Phase 2+');
    }
}

export const buildAdapter = (chain: ChainId): ChainAdapter => new ChainkitAdapter(chain);
