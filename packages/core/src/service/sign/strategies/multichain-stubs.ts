import { ChainId } from '../../../chains';
import { register } from '../registry';
import { SignerFactory } from '../types';

/**
 * Non-TON signer stubs for `AccountMultichain`. Each registered pair
 * throws on invocation with a precise phase-pointer message — more
 * useful than the registry's generic fallback (`"… other chains in
 * Phase 2+"`), since the consumer now knows the work is queued for
 * Phase 4 specifically.
 *
 * TON is registered separately by `strategies/ton/index.ts` against
 * `multichainTonSigner`.
 */
const NON_TON_CHAINS: ReadonlyArray<Exclude<ChainId, 'ton'>> = ['evm', 'btc', 'tron', 'sol'];

const phase4Stub =
    (chain: ChainId): SignerFactory =>
    async () => {
        throw new Error(`Multichain ${chain} signing lands in Phase 4`);
    };

let registered = false;
export const registerMultichainStubs = (): void => {
    if (registered) return;
    registered = true;
    for (const chain of NON_TON_CHAINS) {
        register('multichain', chain, phase4Stub(chain));
    }
};
