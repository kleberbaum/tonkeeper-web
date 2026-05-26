import { Account } from '../entries/account';
import { BtcWallet } from '../entries/btc/btc-wallet';
import { EvmWallet } from '../entries/evm/evm-wallet';
import { SolWallet } from '../entries/sol/sol-wallet';
import { MultichainTronWallet } from '../entries/tron/multichain-tron-wallet';
import { TonContract } from '../entries/wallet';
import { ChainId } from './types';

/**
 * Map from chain id to the wallet shape returned for that chain. Phase 1
 * mapped only `'ton'` (every other chain was `never`). Phase 2 Track H
 * introduces per-chain wallet entries, and `AccountMultichain` carries
 * one wallet per enabled chain — this type widens accordingly.
 *
 * The indexed lookup lets `useActiveWalletForChain('evm')` keep its narrow
 * `EvmWallet` type at call sites — no `as` cast tax — while staying
 * exhaustive over `ChainId`.
 */
type WalletByChain = {
    ton: TonContract;
    evm: EvmWallet;
    btc: BtcWallet;
    tron: MultichainTronWallet;
    sol: SolWallet;
};

export type WalletForChain<C extends ChainId> = WalletByChain[C];

/**
 * Pure selector behind `useActiveWalletForChain`. Routes by account type:
 *
 *  - `AccountMultichain` → `account.getWalletByChain(chain)` (Track I4).
 *  - Every legacy account type → returns `activeTonWallet` for
 *    `chain === 'ton'`, `undefined` for any other chain.
 *
 * The legacy TRON channel (`AccountTonMnemonic.tronWallet` /
 * `AccountMAM.activeTronWallet`) is *not* surfaced here — Phase 1
 * deliberately kept that lookup on `useTronWalletState`, and Phase 2
 * keeps that boundary intact (invariant #1). Phase 3 unifies the two.
 */
export const selectActiveWalletForChain = <C extends ChainId>(
    account: Account,
    chain: C
): WalletForChain<C> | undefined => {
    if (account.type === 'multichain') {
        return account.getWalletByChain(chain) as WalletForChain<C> | undefined;
    }
    if (chain === 'ton') {
        return account.activeTonWallet as WalletForChain<C>;
    }
    return undefined;
};
