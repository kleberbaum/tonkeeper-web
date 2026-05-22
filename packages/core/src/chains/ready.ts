import { ready as chainkitReady } from 'chainkit';

/**
 * Idempotent wrapper around `chainkit.ready()`.
 *
 * chain-kit ships a Kotlin/JS lifecycle that must complete before any
 * Address/Wallet/Chain class is touched. This wrapper is the chokepoint
 * callers `await` so they don't need to know who else has already
 * initialised chain-kit.
 *
 * Returns the same Promise on every call. Errors are surfaced once and
 * never silently swallowed — the next call retries.
 */
let pending: Promise<void> | null = null;

export const ensureReady = (): Promise<void> => {
    if (pending) return pending;
    pending = chainkitReady().catch(err => {
        // Reset so a transient failure (e.g. browser missing wasm fetch
        // shim) can be retried once the environment is fixed.
        pending = null;
        throw err;
    });
    return pending;
};

/** Test-only: reset the memo so consecutive tests don't share state. */
export const _resetReadyForTests = (): void => {
    pending = null;
};
