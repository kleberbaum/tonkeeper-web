import { Cell } from '@ton/core';
import type { SignedTransaction, Transaction } from 'tronweb/src/types/Transaction';

import { IAppSdk } from '../../AppSdk';
import { AccountId } from '../../entries/account';
import { WalletId } from '../../entries/wallet';
import { ChainId } from '../../chains';
import { LedgerTransaction } from '../ledger/connector';

/**
 * Cell-based signer used by every TON wallet contract version. The `type`
 * brand lets the dispatching code in `MessageSender` discriminate the
 * union without instanceof checks.
 */
export type BaseSigner = (message: Cell) => Promise<Buffer>;
export type CellSigner = BaseSigner & { type: 'cell' };

/**
 * Ledger speaks in batched `LedgerTransaction` payloads and returns Cells
 * already signed by the device. The branded `type` mirrors `CellSigner`.
 */
export type LedgerSigner = ((messages: LedgerTransaction[]) => Promise<Cell[]>) & {
    type: 'ledger';
};

/**
 * Multichain signer union. Phase 1 only populates the two TON variants;
 * later phases extend this union with `'eth-typed'`, `'btc-psbt'`, etc.
 * Existing consumers continue to import `Signer` from `entries/signer`,
 * which re-exports this type.
 */
export type ChainSigner = CellSigner | LedgerSigner;
export type Signer = ChainSigner;

export type TronSigner = (tx: Transaction) => Promise<Transaction & SignedTransaction>;

export type MultiTransactionsSigner = (
    txs: (Transaction | Cell)[]
) => Promise<((Transaction & SignedTransaction) | Buffer)[]>;

/**
 * Inputs every `SignerFactory` receives. `chain` is `'ton'` in Phase 1;
 * later phases pass `'evm' | 'btc' | 'tron' | 'sol'` and the registry
 * picks the matching strategy.
 */
export interface SignerFactoryArgs {
    sdk: IAppSdk;
    accountId: AccountId;
    chain: ChainId;
    walletId?: WalletId;
    options?: {
        shouldCreateMetaKeys?: boolean;
    };
}

export type SignerFactory = (args: SignerFactoryArgs) => Promise<ChainSigner>;
