import { Account } from '../../entries/account';
import { ChainId } from '../../chains';
import { ChainSigner, SignerFactory, SignerFactoryArgs } from './types';

/**
 * Registry of `(account.type, chain)` → `SignerFactory` strategies.
 *
 * Phase 1 only populates the TON column; non-TON chains fall through to
 * `NotImplementedError` so callers can wire chain-aware code paths and
 * get a clean error at runtime instead of an opaque undefined.
 *
 * Strategies are registered at module load time by their containing
 * files importing this module and calling `register(...)`. The
 * aggregator at `./factory.ts` imports the strategy modules for their
 * side effects, then exposes `resolve(...)`.
 */

type AccountType = Account['type'];
type RegistryKey = `${AccountType}:${ChainId}`;

const registry = new Map<RegistryKey, SignerFactory>();

const keyOf = (accountType: AccountType, chain: ChainId): RegistryKey =>
    `${accountType}:${chain}` as RegistryKey;

export const register = (
    accountType: AccountType,
    chain: ChainId,
    factory: SignerFactory
): void => {
    const key = keyOf(accountType, chain);
    if (registry.has(key)) {
        throw new Error(`Signer strategy already registered for ${key}`);
    }
    registry.set(key, factory);
};

export const resolve = async (
    args: SignerFactoryArgs & { accountType: AccountType }
): Promise<ChainSigner> => {
    const { accountType, chain } = args;
    const factory = registry.get(keyOf(accountType, chain));
    if (!factory) {
        throw new Error(
            `Signer strategy not registered for account type "${accountType}" on chain "${chain}". ` +
                'TON strategies land in Phase 1; other chains in Phase 2+.'
        );
    }
    return factory(args);
};

/** Test-only: reset registrations so tests can register fresh strategies. */
export const _resetRegistryForTests = (): void => {
    registry.clear();
};
