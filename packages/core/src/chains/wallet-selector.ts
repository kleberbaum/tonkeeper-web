import { TonContract } from '../entries/wallet';
import { ChainId } from './types';

/**
 * Phase 1 mapping from chain id to the wallet shape returned for legacy
 * (TON-only) accounts. Only `'ton'` resolves to a real value; every other
 * chain is `never` until Phase 2 adds `AccountMultichain` and the
 * per-chain wallet entries land.
 *
 * The conditional return type lets `useActiveWalletForChain('ton')` keep
 * its narrow `TonContract` type at call sites — callers that hard-code
 * `'ton'` don't pay an `as` cast tax — while `'evm' | 'btc' | 'tron' |
 * 'sol'` is statically `undefined`, which is exactly the runtime story.
 */
export type WalletForChain<C extends ChainId> = C extends 'ton' ? TonContract : never;

/**
 * Pure selector behind `useActiveWalletForChain`. Returns the account's
 * active TON wallet for `chain === 'ton'` (parity with the existing
 * `useActiveWallet()` hook), `undefined` for every other chain.
 *
 * Phase 1 scaffolding: callers exist only in unit tests and the hook
 * itself; production code keeps using `useActiveWallet()` until Phase 2
 * starts migrating consumers chain-by-chain. The MD explicitly chose
 * `undefined` for `'tron'` even on accounts that already carry a legacy
 * `tronWallet` — the existing TRON lookup channel (`useTronWalletState`)
 * stays untouched in Phase 1 (Phase 3 replaces TRON wholesale).
 */
export const selectActiveWalletForChain = <C extends ChainId>(
    activeTonWallet: TonContract,
    chain: C
): WalletForChain<C> | undefined => {
    if (chain === 'ton') {
        return activeTonWallet as WalletForChain<C>;
    }
    return undefined;
};
