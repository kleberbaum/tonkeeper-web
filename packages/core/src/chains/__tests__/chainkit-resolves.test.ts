/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

// A1 smoke test: prove that the shared `@tonkeeper/chainkit` package is resolvable from
// `packages/core` and that `await ready()` resolves under vitest's Node
// environment. The lifecycle init does not pull `wallet-core.wasm` —
// that load happens lazily when consumers actually call into wallet
// derivation. Browser code paths still need the dev-time fetch shim
// shown in `apps/web/src/pages/dev/ChainKitSmoke.tsx`.
describe('chainkit resolves from @tonkeeper/core', () => {
    it('imports the package and ready() resolves', async () => {
        const chainkit = await import('@tonkeeper/chainkit');
        expect(typeof chainkit.ready).toBe('function');
        await expect(chainkit.ready()).resolves.toBeUndefined();
    });
});
