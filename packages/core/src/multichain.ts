import { ChainId } from './chains/types';

/**
 * Single source of truth for the multichain feature gate, used by every
 * app shell to populate `AppContext.multichainEnabled`.
 *
 * ## Contract
 *
 * The flag is a hard split between two well-defined product states —
 * not a per-feature toggle. Code that branches on it is expected to
 * honor this split exactly:
 *
 * - **`false` (default, ship-safe)** — Production parity. The app
 *   behaves exactly as it does today on `main`: legacy TON-only accounts
 *   only, BIP39 imports land as `AccountTonMnemonic`, hardware-wallet
 *   pairings unchanged. The **only** differences vs. production are
 *   pure visual / design changes (the multichain-design redesign of
 *   touched screens). Nothing in the data model, account types, or
 *   on-chain behaviour changes.
 *
 * - **`true`** — Full multichain functionality. BIP39 imports create
 *   `AccountMultichain` with TON + EVM + BTC + TRON wallets;
 *   per-chain selectors and chain-aware UI light up; multichain create
 *   flow is reachable. Use this for local development and feature QA.
 *
 * Keep the flag a source-level constant for now (no env var, no
 * runtime override). Flip locally to develop / test, default ships
 * `false`. A build-time replacement (DefinePlugin / Vite `define`) can
 * be wired later if we need per-environment flips without a recompile.
 */
export const MULTICHAIN_ENABLED = false;

/**
 * Chains every newly-created `AccountMultichain` ships with. SOL is
 * intentionally excluded — chain-kit has no Solana module today, so a
 * SOL wallet would derive nothing usable. Add SOL here once chain-kit
 * lands its Solana adapter (see `chains/types.ts` notes on
 * `deriveAddress` / `derivePublicKey`).
 *
 * Used by the create-standard and BIP39-import flows in `uikit` when
 * `MULTICHAIN_ENABLED` is on; service-level code (e.g.
 * `multichainCreateService`) takes the chain set as an argument and
 * doesn't depend on this constant directly.
 */
export const DEFAULT_MULTICHAIN_CHAINS: ChainId[] = ['ton', 'evm', 'btc', 'tron'];
