import { ChainId } from '../../../chains/types';
import { WalletContractStrategy } from './types';

/**
 * Registry of `chain` → `WalletContractStrategy` mirroring the sign
 * registry (`service/sign/registry.ts`). Phase 1 only registers TON;
 * non-TON chains fall through to a clear runtime error so callers wiring
 * chain-aware code paths get a useful failure instead of an undefined.
 *
 * Strategies are registered at module load time by the aggregator at
 * `./index.ts`, which imports the concrete strategy modules for their
 * side effects.
 */

const registry = new Map<ChainId, WalletContractStrategy>();

export const register = <TArgs, TContract>(
    chain: ChainId,
    strategy: WalletContractStrategy<TArgs, TContract>
): void => {
    if (registry.has(chain)) {
        throw new Error(`Wallet contract strategy already registered for chain "${chain}"`);
    }
    registry.set(chain, strategy as WalletContractStrategy);
};

export const getStrategy = <TArgs = unknown, TContract = unknown>(
    chain: ChainId
): WalletContractStrategy<TArgs, TContract> => {
    const strategy = registry.get(chain);
    if (!strategy) {
        throw new Error(
            `Wallet contract strategy not registered for chain "${chain}". ` +
                'TON lands in Phase 1; other chains in Phase 2+.'
        );
    }
    return strategy as WalletContractStrategy<TArgs, TContract>;
};

/** Test-only: reset registrations so tests can register fresh strategies. */
export const _resetRegistryForTests = (): void => {
    registry.clear();
};
