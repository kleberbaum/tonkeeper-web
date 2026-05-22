/**
 * `@tonkeeper/core/dist/chains` — the chain-kit facade.
 *
 * Callers reach a `ChainAdapter` via `getAdapter(chain)`. Before the
 * first sync call on any adapter, `ensureReady()` must have been
 * awaited (app startup; `beforeAll` in tests). See `adapter.ts` for
 * the contract.
 */

import { buildAdapter } from './adapter';
import { ChainAdapter, ChainId } from './types';

export { CHAIN_IDS, NotImplementedError } from './types';
export type { BuildTxArgs, ChainAdapter, ChainId, ChainSigner, Fee } from './types';
export { ensureReady } from './ready';
export { unwrap } from './result';
export type { ChainKitRes } from './result';

const cache = new Map<ChainId, ChainAdapter>();

export const getAdapter = (chain: ChainId): ChainAdapter => {
    let adapter = cache.get(chain);
    if (adapter) return adapter;
    adapter = buildAdapter(chain);
    cache.set(chain, adapter);
    return adapter;
};
