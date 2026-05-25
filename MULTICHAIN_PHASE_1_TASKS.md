# Phase 1 — TON refactor for multichain shape (task breakdown)

Sibling document to `MULTICHAIN_PLAN.md`. Phase 1 is the gate to everything else: strip TON
assumptions from the chokepoints (signer dispatch, wallet contract factory, derivation paths)
without changing any user-visible behavior, then add the scaffolding multichain will plug into in
Phase 2.

**Team:** one developer on web integration. Tracks are sequenced serially below — no parallelism.
**Exit criterion:** All apps build, all existing tests pass, snapshot-test harness shows
byte-identical output for every legacy account type signing every supported TON wallet version.

---

## Track summary & order

Serialized for a single developer. Each track must be complete before the next begins, with two
exceptions noted.

```
  G. Snapshot-test harness    ← lands first, gates B/C/D
            │
  A. chain-kit facade         ← unblocks B/C/D
            │
  B. Signer factory           ← biggest refactor
            │
  C. Wallet contract factory  ← smaller refactor, same pattern as B
            │
  D. Derivation paths config  ← cleanup
            │
  E. useActiveWalletForChain  ← additive
            │
  F. multichainEnabled flag   ← additive
```

**Exceptions:** F (flag plumbing) is so small it can slot in anywhere if you need a context-switch.
E is also additive and can move earlier if convenient — it has no dependencies. But B → C → D must
stay in that order: B establishes the factory pattern that C reuses, and D's tests benefit from B/C
being in place.

---

## Track A — `packages/core/src/chains/` facade ✅

**Depends on:** Phase 0 (chain-kit `.tgz` available in monorepo).

### Goal

Hide chain-kit's Kotlin/JS ergonomics (`Companion.from(...)`, `Res<T,E>`, `await ready()`,
`Int8Array` vs `Uint8Array`) behind a clean TS interface that the rest of `uikit` can use.

### Shape

A `ChainkitAdapter` class implements `ChainAdapter` for every `ChainId`. `validateAddress`,
`formatAmount`, and `parseAmount` work uniformly through chain-kit (or a static decimals table).
`deriveAddress` and the write-side methods throw `NotImplementedError` because chain-kit's
`wallet.getAddress(chain)` doesn't expose a `(publicKey, WalletVersion)` pair — TON's version-aware
derivation lives in `walletContract()` (Track C) and tx flows in the per-strategy signer modules
(Track B).

### Files

| File                                                           | Purpose                                                                                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/src/chains/types.ts`                            | `ChainId` (`'ton' \| 'evm' \| 'btc' \| 'tron' \| 'sol'`), `ChainAdapter<TMessage, TSignature>` interface, `BuildTxArgs`, `Fee`, `NotImplementedError`.                               |
| `packages/core/src/chains/ready.ts`                            | `ensureReady()` — memoised, single-shared-promise wrapper around `chainkit.ready()`. Awaited at app startup and in test `beforeAll`.                                                 |
| `packages/core/src/chains/result.ts`                           | `unwrap<T,E>(res: Res<T,E>): T` helper that throws on `Err`. Centralises the chain-kit `Res` translation.                                                                            |
| `packages/core/src/chains/adapter.ts`                          | `ChainkitAdapter` class — single implementation for every chain. `chainOf(id)` maps `ChainId → chainkit.Chain.X.Mainnet`; throws for `sol` ("chain-kit 0.0.1-alpha1 has no Solana"). |
| `packages/core/src/chains/index.ts`                            | `getAdapter(chain)` with a `Map<ChainId, ChainAdapter>` memo. Re-exports types + `ensureReady` + `unwrap`.                                                                           |
| `packages/core/src/chains/__tests__/adapter.test.ts`           | 20 assertions across `validateAddress`, amount roundtrips, NotImplementedError stubs, and registry memoisation.                                                                      |
| `packages/core/src/chains/__tests__/chainkit-resolves.test.ts` | A1 smoke — `import('chainkit')` resolves and `await ready()` returns in ~25ms under vitest Node.                                                                                     |

### `ChainAdapter` interface shape

```ts
export interface ChainAdapter<TMessage = unknown, TSignature = unknown> {
    readonly chain: ChainId;

    validateAddress(addr: string): boolean;
    formatAmount(amount: bigint, opts?: { decimals?: number }): string;
    parseAmount(human: string, opts?: { decimals?: number }): bigint;

    deriveAddress(args: { publicKey: Uint8Array; opts?: unknown }): Promise<string>;
    estimateFee(args: { from: string; to: string; amount: bigint; data?: unknown }): Promise<Fee>;
    buildTransaction(args: BuildTxArgs): Promise<TMessage>;
    signTransaction(args: { message: TMessage; signer: ChainSigner }): Promise<TSignature>;
    broadcast(args: { signed: TSignature }): Promise<{ hash: string }>;
}
```

`ChainSigner` is a placeholder (`unknown`) in Phase 1 — Track B replaces it with a discriminated
union (`{ type: 'cell' | 'eth-typed' | … }`) without touching the adapter shape.

### Tasks

-   [x] **A1.** Add chain-kit `.tgz` dependency to `packages/core/package.json` and smoke-test that
        `import { ready } from 'chainkit'` resolves and `await ready()` returns. `ready()` is ~25ms
        under Node CJS — no `wallet-core.wasm` fetch shim needed (that's browser-only).
-   [x] **A2.** Scaffold `index.ts`, `types.ts`, `ready.ts`, `result.ts`, `adapter.ts`. Five files.
-   [x] **A3.** `ensureReady()` memoises into a single shared promise; `unwrap()` translates
        `Res<T,E>` into a regular thrown `Error`. Exercised via the adapter tests.
-   [x] **A4.** `ChainkitAdapter` class, parameterised by `ChainId`:
    -   `validateAddress` → `chainkit.Address.Companion.from(addr, chainOf(this.chain)) != null` for
        ton/evm/btc/tron; `false` for sol (chain-kit lacks the module).
    -   `formatAmount` / `parseAmount` → static decimals table
        `{ ton:9, evm:18, btc:8, tron:6, sol:9 }`, with `opts.decimals` override for jettons /
        ERC-20.
    -   `deriveAddress` → `throw NotImplementedError`. TON uses `walletContract()` (Track C); other
        chains wait on Phase 2+.
    -   `signTransaction`, `buildTransaction`, `estimateFee`, `broadcast` →
        `throw NotImplementedError` with phase pointers (TON sign → Track B; everything else → Phase
        2+).
-   [x] **A5.** `getAdapter(chain)`: `Map<ChainId, ChainAdapter>` memo in `index.ts`;
        `buildAdapter(chain)` constructs the adapter on first access. The `chainOf()` switch is
        TS-exhaustive over `ChainId`, so adding a chain id forces a compile error here.
-   [x] **A6.** Tests: 20 adapter assertions in `packages/core/src/chains/__tests__/adapter.test.ts`
        covering `validateAddress` per chain (good address + garbage + cross-chain rejection +
        sol-throws), amount roundtrips per chain with default decimals, NotImplementedError contract
        on every Phase 1 stub method per chain, and registry memoisation. Full core suite is now 189
        tests (was 167 before Track G, 183 after the first cut of Track A). All green; the 62 signer
        snapshots remain byte-identical.

### Done

-   `import { getAdapter } from '@tonkeeper/core/dist/chains'` works from `uikit`.
-   `getAdapter('ton'|'evm'|'btc'|'tron')` returns a chain-kit-backed adapter that validates
    addresses and formats amounts; `getAdapter('sol')` returns an adapter that throws on validate
    (chain-kit alpha lacks the module).
-   `deriveAddress` and the write-side methods throw `NotImplementedError` everywhere — no existing
    TON behaviour is routed through the adapter yet (that's Track B → onwards).

---

## Track B — Signer factory extraction ✅

**Depends on:** A (uses `ChainAdapter`), G (snapshot harness gating). **Touches:**
`packages/uikit/src/state/mnemonic.ts:267-433` (the 157-line switch).

### Goal

Replace the inline switch in `getSigner()` with a registry of strategies keyed on
`(account.type, chain)`. Default chain is `'ton'`. TON behavior must be byte-identical (verified by
track G).

### New shape

```ts
// packages/core/src/service/sign/types.ts
export type ChainSigner =
    | { type: 'cell'; sign(msg: Cell): Promise<Buffer> } // TON
    | { type: 'eth-typed'; sign(msg: TypedData): Promise<Hex> } // EVM
    | { type: 'eth-raw'; sign(msg: Bytes): Promise<Hex> }
    | { type: 'btc-psbt'; sign(psbt: Psbt): Promise<Psbt> }
    | { type: 'tron-raw'; sign(msg: Bytes): Promise<Bytes> }
    | { type: 'sol-tx'; sign(msg: Transaction): Promise<Transaction> }
    | { type: 'ledger'; sign(txs: LedgerTransaction[]): Promise<Buffer> };

// packages/core/src/service/sign/factory.ts
export interface SignerFactoryArgs {
    sdk: IAppSdk;
    accountId: AccountId;
    chain: ChainId;
    walletId?: WalletId;
    options?: { shouldCreateMetaKeys?: boolean };
}
export type SignerFactory = (args: SignerFactoryArgs) => Promise<ChainSigner>;
```

### Tasks

-   [x] **B1.** `Signer`, `CellSigner`, `LedgerSigner`, `TronSigner`, `MultiTransactionsSigner` now
        live in `packages/core/src/service/sign/types.ts`. `ChainSigner = CellSigner | LedgerSigner`
        is the multichain union (Phase 1 only the two TON variants populated). `entries/signer.ts`
        is a thin re-export shim so the dozen existing call sites in core/uikit keep working.
        `SignerFactoryArgs` and `SignerFactory` shapes match the prescription.
-   [x] **B2.** `packages/core/src/service/sign/registry.ts` with
        `register(accountType, chain, factory)` and
        `resolve({sdk, accountId, accountType, chain, walletId, options})`. Unregistered
        `(accountType, chain)` pairs throw a clear `Error("...Phase 2+...")` — covers B7's intent
        without needing 36 explicit stubs.
-   [x] **B3.** Eight TON strategies extracted to `packages/core/src/service/sign/strategies/ton/`:
        `ton-only-signer.ts`, `ledger-ton-signer.ts`, `keystone-ton-signer.ts`, `mam-ton-signer.ts`,
        `mnemonic-ton-signer.ts` (one module, two registrations — `mnemonic` and `testnet` share the
        body), `sk-ton-signer.ts`, `watch-only-signer.ts`, `multisig-signer.ts`. A `_shared.ts`
        helper centralises the `loadAccountOfType` / `pickWallet` narrowing so each strategy is ~20
        lines.
-   [x] **B4.** `strategies/ton/index.ts` exposes `registerTonStrategies()` (idempotent guard);
        `factory.ts` invokes it at module load.
-   [x] **B5.** `uikit/state/mnemonic.ts:getSigner` is now a 4-line delegation to
        `coreGetSigner(sdk, accountId, options)`. Original public signature unchanged, so the
        existing `useGetAccountSigner` hook and every direct caller (web/extension/desktop/mobile)
        keeps working untouched. The MAM/keystone/signer-deeplink/web vs non-web branches landed in
        the per-strategy modules verbatim.
-   [x] **B6.** Snapshot harness still green: 62 BOC snapshots byte-identical across all fixture ×
        WalletVersion × Network combos. 189 core tests pass total. All 9 workspace typechecks pass.
        ESLint clean across the new sign/ tree and the slimmed mnemonic.ts.
-   [x] **B7.** `resolve()` throws
        `Error("Signer strategy not registered for account type X on chain Y. TON strategies land in Phase 1; other chains in Phase 2+.")`
        for any unregistered `(accountType, chain)`. The phrase "Phase 2+" is the search anchor;
        callers wiring chain switches get a clear runtime failure instead of an opaque undefined
        lookup.
-   [x] **B8.** `getTronSigner()` body relocated to
        `packages/core/src/service/sign/strategies/tron/legacy-tron-signer.ts`.
        `uikit/state/mnemonic.ts` re-exports it from the new location, so `useTronSender.ts` and
        every other call site is unchanged. Not unified with the registry — Phase 3 replaces TRON
        wholesale, so the legacy shape stays put.

### Risk callouts

-   **MAM secret retrieval** (`getMAMWalletMnemonic`) and `getAccountSecret` are reused across
    strategies. Don't duplicate them — keep them as shared helpers in
    `packages/core/src/service/sign/secrets.ts`.
-   **Meta-encryption keys** (`createAndStoreMetaEncryptionKeys`) are a side effect of the `'mam'`
    and `'mnemonic'` cases. Preserve the `shouldCreateMetaKeys` flag plumbing exactly — silent
    regression risk.
-   **`signer-deeplink` web vs non-web branch** (lines 296–338) is platform-dependent and the most
    surprising path. Snapshot-test it on both targets.

### Done

-   `mnemonic.ts:getSigner()` shrunk from 167 lines to 4 (delegation only).
-   All existing signing call sites work unchanged — `useGetAccountSigner`, `useTronSender`,
    `tonConnect.ts`, `Recovery.tsx`, `wallet.ts`, etc. were not touched.
-   Snapshot harness passes for every `(account.type, ton) × WalletVersion × Network` (62 BOC
    snapshots, byte-identical). 189 core tests green; 9 workspace typechecks green.
-   `core/src/service/sign/` is the new home for the registry (`registry.ts`), the entry-point
    factory (`factory.ts`), the 8 TON strategies (`strategies/ton/*.ts`), the relocated legacy TRON
    signer (`strategies/tron/legacy-tron-signer.ts`), and the shared helpers (`secrets.ts`,
    `pairing.ts`, `meta-keys.ts`, `types.ts`).

---

## Track C — Wallet contract factory ✅

**Depends on:** A, G. **Touches:** `packages/core/src/service/wallet/contractService.ts`.

### Goal

Replace the hardcoded `walletContract()` switch (lines 24–58) with a per-chain strategy. TON keeps
its existing `WalletContractVxxx` path; other chains stub out and throw.

### Tasks

-   [x] **C1.** `packages/core/src/service/wallet/contracts/types.ts` defines a generic
        `WalletContractStrategy<TArgs, TContract>` (`chain: ChainId`,
        `create(args: TArgs): TContract`). The MD's prescribed `WalletContractLike` structural
        interface was downgraded to a documentary aspiration — gasless / battery / two-fa senders
        downcast the result to `WalletContractV5R1`, `externalMessage()` consumes the concrete union
        directly, so narrowing the return now would break those casts. Phase 2 can tighten this once
        the casts are cleaned up.
-   [x] **C2.** `packages/core/src/service/wallet/contracts/ton-strategy.ts` hosts
        `tonWalletContractStrategy` — the `WalletVersion` switch and `const workchain = 0` moved
        verbatim from the top-level file. Exports `TonWalletContractArgs` and the
        `TonWalletContract` union (the same five `ReturnType<typeof WalletContractV*.create>`
        shapes) for typed callers.
-   [x] **C3.** `packages/core/src/service/wallet/contracts/registry.ts` mirrors the sign registry:
        `register(chain, strategy)`, `getStrategy<TArgs, TContract>(chain)`, plus
        `_resetRegistryForTests()` for parity. Unregistered chains throw a clear "Phase 2+" `Error`
        instead of stubbing out 4 explicit throw-only strategies.
-   [x] **C4.** `contractService.ts` is now 14 lines of delegation around the strategy:
        `walletContract(publicKey, version, network)` →
        `getStrategy('ton').create({ publicKey, version, network })`;
        `walletContractFromState(wallet)` →
        `walletContract(wallet.publicKey, wallet.version, wallet.network ?? Network.MAINNET)`.
        Public `WalletContract` type alias re-exports `TonWalletContract`, so the
        `as WalletContractV5R1` downcasts in gasless / battery / two-fa senders keep compiling
        unchanged.
-   [x] **C5.** No stub strategies registered for EVM / BTC / TRON / SOL — `getStrategy()` throws
        `Error("Wallet contract strategy not registered for chain \"X\". TON lands in Phase 1; other chains in Phase 2+.")`
        for any unregistered chain. A new `contracts/__tests__/registry.test.ts` pins this message
        across all four non-TON chain ids (search anchor: "Phase 2+").
-   [x] **C6.** 194 core tests pass (62 sign-harness BOCs byte-identical, +5 new registry tests).
        All 9 workspace typechecks pass via `yarn turbo typecheck`. ESLint clean across the new
        `contracts/` tree and the slimmed `contractService.ts` (only a pre-existing `==` warning
        survives, inside the untouched `estimateWalletContractExecutionGasFee`).

### Risk callouts

-   `walletStateInitFromState()` (line 60) calls into `walletContractFromState()`. Verify it still
    works (it should — same delegation).
-   `estimateWalletContractExecutionGasFee()` (line 76+) uses `WalletVersion` directly. Leave it
    untouched in Phase 1 — it's TON-specific by design; move to TON strategy in Phase 2.

### Done

-   `contractService.ts` shrunk from 178 lines to 138 — and the contract-factory portion is now a
    14-line delegation (the bulk of the remaining lines is the untouched gas-fee estimator, per MD
    scope).
-   Snapshot harness identical pre/post: all 62 BOCs across
    `(FixtureKind × WalletVersion × Network)` re-produced byte-for-byte through the new delegation
    path.
-   Non-TON chains throw a clear "Phase 2+" error from `getStrategy()`; new registry test pins the
    message for evm / btc / tron / sol.
-   `core/src/service/wallet/contracts/` is the new home for the registry (`registry.ts`), the TON
    strategy (`ton-strategy.ts`), the strategy interface (`types.ts`), and the aggregator that
    performs the load-time `register('ton', ...)` (`index.ts`).

---

## Track D — Derivation paths config ✅

**Depends on:** A. **Touches:** `packages/core/src/service/mnemonicService.ts`,
`packages/core/src/chains/`.

### Goal

The string `"m/44'/607'/0'"` is hardcoded in `mnemonicService.ts` (a constant at line 15 reused at
lines 114 and 154). Move into a per-chain config map; existing TON paths unchanged.

### Tasks

-   [x] **D1.** Created `packages/core/src/chains/derivation.ts` with
        `DEFAULT_BIP44_PATH: Record<ChainId, string>` (TON / EVM / BTC / TRON / SOL canonical paths)
        and `pathFor(chain, index = 0)`. `index !== 0` throws "Phase 2+" instead of silently
        mis-deriving — Phase 1 only needs the default account on every chain.
-   [x] **D2.** `bip39ToPrivateKey(mnemonic, path = pathFor('ton'))` — existing callers unchanged,
        new TON-multi-account flows can pass an alternate path. JSDoc spells out that EVM / BTC /
        SOL won't route through this helper (curve mismatch).
-   [x] **D3.** Same treatment for `bip39MnemonicToEd25519Seed(mnemonic, path = pathFor('ton'))`.
-   [x] **D4.** `packages/core/src/chains/__tests__/derivation.test.ts` — 9 assertions including a
        regression test that derives the canonical abandon×11+about BIP39 fixture through
        `mnemonicToKeypair(_, 'bip39')` and pins the resulting public-key hex against the value
        already snapshotted by Track G (`mnemonic-bip39__V5R1__MAINNET.json`). A drift in the TON
        path (dropped `'/0'`, wrong curve, etc.) fails this fast unit test before the slower
        snapshot suite catches it.
-   [x] **D5.** JSDoc on `DEFAULT_BIP44_PATH` carries a "Scope warning" explaining that the path
        shape is shared but the _derivation function_ is curve-specific — EVM / BTC need secp256k1,
        SOL needs ed25519-SLIP-0010, and TRON's legacy code (untouched in Phase 1) uses its own
        ethers.js HD walk in `walletService.ts:tonMnemonicToTronMnemonic`. Both bip39 helpers carry
        a JSDoc cross-reference.

### Risk callouts

-   Existing TRON derivation uses `m/44'/195'/0'/0` (no terminal `/0`) in
    `walletService.ts:tonMnemonicToTronMnemonic` — left untouched per Phase 1 scope (Phase 3
    replaces TRON wholesale). The `DEFAULT_BIP44_PATH.tron` entry follows the standard BIP-44 layout
    with the trailing `/0` so Phase 2+ has the canonical shape to start from; the legacy code path
    doesn't consume the map yet, so this is documentation-only.

### Done

-   The string `m/44'/607'/0'` lives in exactly one source file (`chains/derivation.ts`). The
    regression test re-asserts the literal value to detect drift; that occurrence is the intentional
    pin and not a duplicate definition.
-   `mnemonicService.ts` no longer holds a `TON_DERIVATION_PATH` constant — both `bip39ToPrivateKey`
    and `bip39MnemonicToEd25519Seed` resolve their default path via `pathFor('ton')`. Existing call
    sites pass no path arg and continue to derive the same key.
-   **203 core tests pass** (194 prior + 9 new derivation tests); the 62 sign-harness BOC snapshots
    remain byte-identical (proves the BIP39 → ed25519 path is unchanged for every
    `mnemonic-bip39 × WalletVersion × Network` combo).
-   **9/9 workspace typechecks pass** via `yarn turbo typecheck`.
-   **ESLint clean** across `chains/derivation.ts`, `chains/__tests__/derivation.test.ts`,
    `chains/index.ts` (re-export added), and the slimmed `mnemonicService.ts`.

---

## Track E — `useActiveWalletForChain(chain)` hook

**Depends on:** nothing. **Touches:** `packages/uikit/src/state/wallet.ts`.

### Goal

Add a new hook that returns the active wallet for a given chain. For legacy accounts
(`AccountTonMnemonic`, `AccountMAM`, etc.), this is a thin wrapper around `useActiveWallet()` and
returns the TON wallet unchanged. Unused in production yet — sets up Phase 2 consumers.

### Tasks

-   [ ] **E1.** Add `useActiveWalletForChain(chain: ChainId)` in
        `packages/uikit/src/state/wallet.ts`. Returns
        `TonWalletStandard | EvmWallet | BtcWallet | TronWallet | SolWallet | undefined`.
-   [ ] **E2.** For legacy account types, implement:
        `chain === 'ton' ? useActiveWallet() : undefined`.
-   [ ] **E3.** Add `useActiveWalletForChain('ton')` as an alias in unit tests verifying parity with
        `useActiveWallet()`.
-   [ ] **E4.** **Do not** migrate any callers yet. Adding the hook is the entire scope; Phase 2/3
        will migrate components one-by-one.

### Done when

-   New hook exists, tested, but called nowhere in production code.
-   Storybook (if used) shows it returning expected values for fixture accounts.

---

## Track F — `multichainEnabled` AppContext flag

**Depends on:** nothing. **Touches:** `packages/uikit/src/hooks/appContext.ts`, root component of
each of the 4 apps.

### Tasks

-   [ ] **F1.** Add `multichainEnabled: boolean` to `IAppContext` in
        `packages/uikit/src/hooks/appContext.ts`.
-   [ ] **F2.** In each app's root component, source the value:
    -   `apps/web` — from `import.meta.env.VITE_MULTICHAIN_ENABLED`
    -   `apps/desktop` — from Electron main process config (passed via IPC at startup) OR same Vite
        env
    -   `apps/extension` — from a constant in `apps/extension/src/config.ts`
    -   `apps/mobile` — from Capacitor config or Vite env
-   [ ] **F3.** Default to `false` everywhere except local dev (`.env.local`).
-   [ ] **F4.** No UI consumers yet. Just plumbing.

### Done when

-   `useAppContext().multichainEnabled` returns `false` in all production builds, `true` when dev
    opts in.

---

## Track G — Snapshot-test harness (gate)

**Must land first.** Without it, every subsequent track is doing surgery on a signing chokepoint
with no regression net.

### Goal

Before any refactor, capture a snapshot of every signer × every wallet version × every account type
producing a known signed BOC against a fixture mnemonic. Then re-run after each Phase 1 PR and fail
on any byte difference.

### Tasks

-   [x] **G1.** Create `packages/core/src/__tests__/snapshots/sign/` directory.
-   [x] **G2.** Fixtures: 5 BIP39 mnemonics (one per account type that supports mnemonic input —
        `mnemonic`, `mam`, `sk`, `testnet`, and a synthetic `ton-only` case using a recorded signer
        response). Stored as hardcoded constants — never use real funds. _Landed as 6 fixture kinds:
        `mnemonic-ton`, `mnemonic-bip39`, `testnet`, `mam`, `sk`, `ton-only` — the two mnemonic
        types are split because `account.mnemonicType` is a separate dispatch axis._
-   [x] **G3.** For each fixture × `WalletVersion` (V3R1, V3R2, V4R2, V5*BETA, V5R1) × Network
        (MAINNET, TESTNET), pre-compute a signed transfer of a fixed canonical message. Store BOCs
        as base64 in `snapshots/sign/<combo>.json`. \_60 BOC snapshots committed; re-running the
        harness twice produces byte-identical output.*
-   [x] **G4.** Test runner: load fixture, call `getSigner()` (and after refactor, the new factory),
        assert output equals snapshot. _Runner lives in
        `packages/core/src/__tests__/snapshots/sign/sign.test.ts`. Uses core-only primitives
        (`mnemonicToKeypair`, `walletContract`, `signWithSecret`) so it can run without a uikit SDK;
        the Track B factory will plug in here. `UPDATE_SNAPSHOTS=1` regenerates. Verified the runner
        detects intentional drift._
-   [x] **G5.** Ledger and Keystone are skipped (require hardware) — mock the pairing calls and
        snapshot the _call shape_ (`path`, `transactions[]` payload) instead of the signature.
        _Ledger derivation-path mapping snapshotted in `ledger-call-shapes.json` for indices
        0/1/5/42. Keystone's input is exactly the canonical transfer BOC, which is already pinned by
        the per-combo snapshots — no additional file needed._
-   [x] **G6.** Wire into CI (yarn workspace `@tonkeeper/core test`); make Phase 1 PRs auto-fail if
        snapshots diverge. _Added `test` task to `turbo.json`, root `test` script (filters out
        playwright), and new `test` job in `.github/workflows/quality.yaml`. Also needed
        `packages/core/vitest.config.mts` to alias `@ton/crypto/dist/mnemonic/mnemonic`
        (extension-less import inside `@ton-keychain/core`) so vitest can resolve it._

### Risk callouts

-   Snapshots include the message-hash signature. Ed25519 signing on the same seed + same message is
    deterministic, so this works. Verify in G3 that re-running produces identical output before
    committing snapshots.
-   V5 contracts use `walletId.networkGlobalId` — make sure that's in the canonical input so
    testnet/mainnet are properly distinguished.

### Done when

-   A green CI run on `main` with the snapshot harness passing.
-   Any subsequent PR that changes signing output fails the snapshot test by default. (Updates
    require an explicit `--update-snapshots` commit step, reviewed by 2 engs.)

---

## Milestones (not calendar)

Track progress by milestone, not week. Each milestone gates the next; don't skip.

1. **M1 — Harness in place.** ✅ Track G complete: snapshot harness running green on main against
   current code. Pinned baseline.
2. **M2 — Facade ready.** ✅ Track A complete: chain-kit `.tgz` resolves; `getAdapter('ton')`
   returns a working adapter; other chains stub clearly.
3. **M3 — Signer factory.** ✅ Track B complete: `getSigner()` is delegation-only (4 lines); all 62
   snapshot tests green; 189 core tests pass; 9 workspace typechecks pass. Manual smoke-test of TON
   send on all 4 apps remains pre-merge.
4. **M4 — Contract factory.** ✅ Track C complete: `walletContract()` is a 5-line delegation into
   `getStrategy('ton').create(...)`; 62 sign-harness snapshots still byte-identical; 194 core tests
   pass; 9 workspace typechecks pass. Manual smoke-test of TON send on all 4 apps remains pre-merge.
5. **M5 — Paths centralized.** ✅ Track D complete: `m/44'/607'/0'` appears in exactly one source
   file (`packages/core/src/chains/derivation.ts`); 203 core tests pass including a new BIP39 → TON
   regression test pinned against the Track G snapshot harness; 9 workspace typechecks pass.
6. **M6 — New scaffolding.** Tracks E + F complete: hook + flag plumbed but unused in prod.
7. **M7 — Phase 1 exit review.** Full app suite green on all 4 target apps; manual smoke test of
   send/receive/swap/buy on TON mainnet for each app; bundle size delta within agreed Phase 0
   budget. Sign-off before Phase 2 begins.

---

## Phase 1 exit checklist

-   [ ] All 4 target apps (web, desktop, extension, mobile) build green.
-   [ ] All existing unit tests pass.
-   [ ] Snapshot-test harness green for all `(account.type, WalletVersion, Network)` combos.
-   [ ] `getSigner()` is delegation-only (~20 lines).
-   [ ] `walletContract()` is delegation-only.
-   [ ] `m/44'/607'/0'` appears in exactly one file (`derivation.ts`).
-   [ ] `useActiveWalletForChain('ton')` returns the same wallet as `useActiveWallet()` for legacy
        accounts.
-   [ ] `multichainEnabled` flag plumbed; `false` in all prod builds.
-   [ ] `getAdapter('ton')` returns a working adapter; other chains throw `NotImplemented` clearly.
-   [ ] No user-visible changes in any app (manual smoke test of send/receive/swap/buy on TON
        mainnet for each app).
-   [ ] Bundle size delta per app documented and within agreed budget.

---

## Out of scope for Phase 1

These are tempting cleanups but explicitly **deferred** to keep Phase 1 mechanical:

-   Moving TRON code into the new adapter shape (Phase 3 replaces TRON entirely).
-   Changing `useActiveWallet()` callers to `useActiveWalletForChain('ton')` (Phase 2/3 migrates).
-   Switching the TON internals to chain-kit's TON module (Phase 2+ — keep using `@ton/ton` for
    now).
-   Multisig signer migration (`AccountTonMultisig` stays special-cased).
-   Adding `AccountMultichain` to the union (Phase 2).
-   Removing `CellSigner` (it becomes the `'cell'` variant of `ChainSigner` and stays).
