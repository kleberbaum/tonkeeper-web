# Phase 2 — `AccountMultichain` variant + key management (task breakdown)

Sibling document to `MULTICHAIN_PLAN.md` (Phase 2 section, lines 106–127) and
`MULTICHAIN_PHASE_1_TASKS.md`. Phase 2 puts the new wallet shape into the codebase so the rest of
the plan has something to plug in to: a `AccountMultichain` variant alongside the existing legacy
types, BIP39 key derivation per chain, per-chain wallet entries, secure storage, and the create /
import flows behind `multichainEnabled`.

**Team:** one developer on web integration. Tracks are sequenced serially below — no parallelism.
**Exit criterion:** A dev build (`multichainEnabled = true`) can create a multichain account and
display TON / EVM / BTC / TRON addresses. No transactions yet. No migration. Existing TON-only
accounts and the legacy TRON code path are byte-identical to Phase 1 end-state — the snapshot
harness (Track G) still passes.

---

## Non-negotiable invariants

These must hold from the first commit of Phase 2 to the last. Violating any of them is a Phase 2
regression by definition.

1. **Legacy TRON keeps working unchanged.** The `tronWalletByTonMnemonic` bolt-on
   (`packages/core/src/service/walletService.ts`) and the `m/44'/195'/0'/0` derivation continue to
   serve every non-multichain account exactly as they did at Phase 1 exit. Users on
   `AccountTonMnemonic` / `AccountMAM` / `AccountTonSK` / `AccountTonTestnet` / etc. see no
   behaviour change on TRON. The new BIP39-rooted multichain TRON path (canonical
   `m/44'/195'/0'/0/0` from `DEFAULT_BIP44_PATH.tron`) is **additive** and only used by
   `AccountMultichain`. Migration from legacy → multichain is Phase 4, not Phase 2.
2. **62-BOC snapshot harness stays green.** Every track must re-run
   `yarn workspace @tonkeeper/core test` and confirm `src/__tests__/snapshots/sign/sign.test.ts`
   produces byte-identical output. Phase 2 is purely additive on the TON signing path.
3. **Legacy `Account` union members are not touched.** New variant `AccountMultichain` is added, but
   `AccountTonMnemonic`, `AccountMAM`, `AccountTonSK`, `AccountTonTestnet`, `AccountTonWatchOnly`,
   `AccountTonOnly`, `AccountLedger`, `AccountKeystone`, `AccountTonMultisig` stay binary-compatible
   on disk. A user who installs the Phase 2 build, never opts in, and downgrades back to Phase 1
   loses nothing.
4. **`multichainEnabled` gates every new UI surface.** Creation, import, and address-display screens
   for multichain are hidden in production (flag default `false`). Toggling the flag is the only way
   to reach the new flows. Legacy creation / import stay reachable regardless of flag state.
5. **TWA stays excluded.** The 4 target apps are web / desktop / extension / mobile. TWA is on the
   deprecation track (project memory `project_twa_unsupported`); no Phase 2 work touches it.

---

## Track summary & order

Serialized for a single developer. Each track must be complete before the next begins, with
exceptions noted.

```
  H. Per-chain wallet entries     ← types, foundational
            │
  I. AccountMultichain variant    ← needs H
            │
  J. Storage keys + serialization ← needs I
            │
  K. Per-chain derivation wiring  ← needs Phase 1 Track A (chain-kit adapter)
            │
  L. IKeychainService chain keys  ← cross-cutting, touches all 4 platforms
            │
  O. Registry wiring (multichain) ← needs I + K (and Phase 1 B/C)
            │
  M. Create-multichain flow (UI)  ← needs I/J/K/L/O
            │
  N. Import-multichain flow (UI)  ← needs M (reuses pieces)
            │
  P. Address display + dev demo   ← needs M/N — proves Phase 2 exit
```

**Exceptions:** L (IKeychainService) is cross-cutting and platform-touching — can slot in earlier if
a context-switch is convenient (it has no dependency on H/I/J/K). K can move ahead of I/J if
chain-kit's address-derivation surface is what's blocking design choices on the variant's shape. But
H → I → J → O must stay in that order: each layer builds on the previous one's types or storage
schema.

---

## Track H — Per-chain wallet entries

**Depends on:** Phase 1 (`ChainId` from `packages/core/src/chains/types.ts`). **Touches:**
`packages/core/src/entries/wallet.ts`, possibly new files under
`packages/core/src/entries/<chain>/`.

### Goal

Define the per-chain wallet shapes that `AccountMultichain` will hold. `TonWalletStandard` already
exists and stays untouched. Add `EvmWallet`, `BtcWallet`, `SolWallet`. The existing legacy
`TronWallet` type stays — Phase 2 does **not** introduce a separate `MultichainTronWallet` because
the on-chain object is identical; what differs between legacy and multichain TRON is the
_derivation_ (path, curve, mnemonic type), not the wallet shape.

### Shape

```ts
// packages/core/src/entries/wallet.ts
export type EvmWallet = {
    id: WalletId; // chain-prefixed: 'evm:<addr>' or similar
    chain: 'evm';
    rawAddress: string; // 0x-prefixed hex, EIP-55 checksummed
    publicKey: string; // hex, secp256k1 uncompressed
    derivationPath: string; // BIP-44 path actually used
};

export type BtcWallet = {
    id: WalletId;
    chain: 'btc';
    rawAddress: string; // bech32 (default: BIP-84 native segwit)
    publicKey: string; // hex, secp256k1 compressed
    derivationPath: string;
};

export type SolWallet = {
    id: WalletId;
    chain: 'sol';
    rawAddress: string; // base58
    publicKey: string; // hex, ed25519
    derivationPath: string;
};

// TronWallet — existing type stays. Multichain reuses it but tags
// instances with the new BIP-44 path in `derivationPath`.
```

### Tasks

-   [ ] **H1.** Define `EvmWallet`, `BtcWallet`, `SolWallet` types in
        `packages/core/src/entries/wallet.ts` (or one file per chain under
        `packages/core/src/entries/<chain>/wallet.ts` if it keeps `wallet.ts` readable). Each
        carries `id`, `chain` discriminator, `rawAddress`, `publicKey`, `derivationPath`.
-   [ ] **H2.**
        `MultichainWallet = TonWalletStandard | EvmWallet | BtcWallet | TronWallet | SolWallet`.
        Document that `TonWalletStandard` lacks a `chain` discriminator (it predates the multichain
        types) — narrow on `'version' in wallet` per the existing `isStandardTonWallet`, or add a
        `chain: 'ton'` field via a backwards-compatible intersection.
-   [ ] **H3.** Add `derivationPath` to `TonWalletStandard` as **optional**
        (`derivationPath?: string`). Legacy TON wallets serialize without it (same as today);
        multichain TON wallets write it. This is the only modification to the legacy type and must
        round-trip on disk: a Phase 1 wallet read by Phase 2 code parses fine; a Phase 2 wallet with
        no `derivationPath` (legacy) reads fine too.
-   [ ] **H4.** Type-narrowing helpers: `isEvmWallet`, `isBtcWallet`, `isTronWallet` (the existing
        legacy `tronWallet?: TronWallet` field on `DerivationItem` — keep it; the new helper just
        narrows the union), `isSolWallet`.
-   [ ] **H5.** Unit tests in `packages/core/src/entries/__tests__/wallet.test.ts` exercising each
        narrowing helper against representative fixtures, plus round-trip of `TonWalletStandard`
        with and without `derivationPath` (the H3 backwards-compat case).

### Risk callouts

-   **TonWalletStandard discriminator gap.** Existing code branches on `'version' in wallet` — don't
    add a `chain: 'ton'` field that breaks that narrowing. Either keep the implicit narrowing or add
    `chain` as `'ton' | undefined` with downstream consumers updated.
-   **`TronWallet` identity.** The existing type lives in
    `packages/core/src/entries/tron/tron-wallet.ts`. It is _the_ TRON wallet type for both legacy
    and multichain accounts. Do not fork it. If multichain needs extra fields, add them as optional.

### Done when

-   `MultichainWallet` union exported from `packages/core/src/entries/wallet.ts`.
-   Unit tests pass; 62-BOC snapshot harness still byte-identical (purely additive types).
-   `yarn turbo typecheck` green on all 9 workspaces (TWA still excluded).
-   No legacy account-type serialization changes.

---

## Track I — `AccountMultichain` variant in the `Account` union

**Depends on:** H. **Touches:** `packages/core/src/entries/account.ts`.

### Goal

Add the new account variant. Existing union members untouched. Discriminator
`account.type === 'multichain'`. Holds a BIP39 seed (encrypted, mirroring how `AccountTonMnemonic`
stores its mnemonic), per-chain wallets, and active-wallet-per-chain selection.

### Shape

```ts
export class AccountMultichain extends BaseAccount {
    readonly type = 'multichain' as const;

    constructor(
        id: AccountId,
        name: string,
        emoji: string,
        auth: AuthState,                                  // existing AuthKeychain etc.
        public enabledChains: ChainId[],                  // e.g. ['ton','evm','btc','tron']
        public activeWalletByChain: Partial<Record<ChainId, WalletId>>,
        public wallets: MultichainWallet[]                // one or more per enabled chain
    ) { super(...); }

    get allTonWallets(): TonWalletStandard[] {
        return this.wallets.filter(isStandardTonWallet);
    }
    get activeTonWallet(): TonWalletStandard {
        const id = this.activeWalletByChain.ton;
        return this.allTonWallets.find(w => w.id === id) ?? this.allTonWallets[0];
    }
    getWalletByChain<C extends ChainId>(chain: C): WalletForChain<C> | undefined { ... }
}
```

### Tasks

-   [ ] **I1.** Implement `AccountMultichain` class extending `BaseAccount`. `type: 'multichain'`
        discriminator. Fields per Shape above.
-   [ ] **I2.** Add `'multichain'` to the `AccountType` discriminated union, and `AccountMultichain`
        to the `Account` union in `packages/core/src/entries/account.ts`.
-   [ ] **I3.** Implement `allTonWallets` / `activeTonWallet` getters so the new variant satisfies
        the same `BaseAccount` contract every other account type already satisfies. Multichain
        accounts with `enabledChains` not including `'ton'` should still return an empty
        `allTonWallets` array (never throw — downstream code uses `useActiveWallet()` defensively).
        Concretely: a multichain account _without_ TON is rare but valid, and
        `account.activeTonWallet` returning `undefined` from a type that nominally promises
        `TonContract` breaks hundreds of call sites. Phase 2 decision (mark in doc): every
        `AccountMultichain` must include `'ton'` in `enabledChains` for v1 — enforce this at
        creation time. Document the restriction; relax in Phase 5 if needed.
-   [ ] **I4.** `getWalletByChain<C extends ChainId>(chain: C)`: returns the active wallet for that
        chain on this account, or `undefined`. This is the runtime backbone the existing
        `useActiveWalletForChain` hook (Phase 1 Track E) plugs into for multichain accounts. Update
        the hook's selector to route multichain accounts here.
-   [ ] **I5.** Factory function `createAccountMultichain(params)` in `entries/account.ts` (or
        nearby) for storage deserialization. Mirrors how `createAccountTonMnemonic` etc. work today.
-   [ ] **I6.** Update every `assertUnreachable(account)` site so the new variant compiles. Use the
        TS-exhaustive pattern — `account.type === 'multichain'` branch returns the new behaviour or
        throws "Phase 2+: multichain handler not wired yet" for sites that aren't yet ready (e.g.,
        signer factory, pro features). Each call site gets a Phase-pointer comment so Phase 3/4/5
        can grep for them.
-   [ ] **I7.** Unit tests for `AccountMultichain` covering: construction with each combination of
        enabled chains, `activeTonWallet` returning the correct wallet, `getWalletByChain` for each
        chain id, exhaustive `assertUnreachable` integration.

### Risk callouts

-   **Pervasive `account.type` switches.** Adding a variant ripples into every existing switch
    statement on `account.type`. The full list is grep-able: `rg "account\.type ===" packages apps`.
    Each site must be triaged: legitimate Phase 2 handler vs. "throws Phase 3+" stub vs. no-op
    (display name etc., works generically). Plan an explicit subtask per call site; don't batch.
-   **Backwards-compatible storage.** Phase 2 ships with `AccountMultichain` as a _new_ serial form,
    but the storage schema must round-trip Phase 1 accounts unchanged. Test: write a Phase 1 account
    snapshot, read it through Phase 2 code, assert byte-identical re-serialization.
-   **`activeTonWallet` getter and TON requirement.** The decision in I3 (every multichain account
    must enable TON) reduces a lot of `undefined` plumbing; document it and lock it behind a runtime
    guard in the creation flow (Track M).

### Done when

-   `AccountMultichain` constructable, serializable, deserializable.
-   All `account.type` switches compile and route the new variant either to a handler or to a
    clearly-marked "Phase 3+" throw.
-   Unit tests pass; snapshot harness still green; 9/9 typechecks green.

---

## Track J — Storage keys + (de)serialization

**Depends on:** I. **Touches:** `packages/core/src/Keys.ts`,
`packages/core/src/service/accountsStorage.ts` (or the platform-specific storage glue).

### Goal

Multichain accounts persist alongside legacy accounts in the same `accounts` storage list. No new
top-level storage key for accounts themselves — the existing `IStorage` map already supports
mixed-type lists via the `type` discriminator. New storage keys are needed only for _chain-level_
state (the `multichainEnabled` flag is already plumbed via `IAppContext`; that's not storage).

### Tasks

-   [ ] **J1.** Add `MULTICHAIN_CHAIN_CONFIG` to `AppKey` enum in `packages/core/src/Keys.ts`.
        Stores per-account chain-level preferences (which chains visible, jetton/ERC-20 hide lists,
        etc.). Defer the actual schema to Phase 3 when chain preferences become user-facing — Phase
        2 just reserves the key.
-   [ ] **J2.** Storage serializer / deserializer for `AccountMultichain`. The existing pattern in
        `accountsStorage.ts` uses a `type` discriminator on the stored object — extend that switch.
        Round-trip test: serialize → deserialize → deep-equal against original.
-   [ ] **J3.** Add `MULTICHAIN_MIGRATION_STATE` as a **reserved** `AppKey` (no read/write code in
        Phase 2). Phase 4 implements the migration flow that uses it; reserving the key in Phase 2
        lets Phase 4 land without touching `Keys.ts` again.
-   [ ] **J4.** Backwards-compat round-trip test: write a Phase 1 accounts snapshot to the storage
        layer, read through Phase 2 code, assert the deserialized account matches the original.
        Covers the H3 `derivationPath?: string` optional-field guarantee.

### Risk callouts

-   **Storage corruption blast radius.** If `(de)serialize` has a bug that mangles legacy accounts,
    users lose access to their wallets. The backwards-compat test (J4) is the gate — do not merge
    without it. Cover at least one fixture per legacy account type.
-   **Storage migration on read.** If you discover a Phase 2 schema needs a one-time write to
    upgrade legacy accounts, route it through the existing `StorageMigrationService` pattern
    (apps/mobile/src/libs/storage.ts:86-204) rather than ad-hoc in the deserializer.

### Done when

-   `MULTICHAIN_CHAIN_CONFIG` and `MULTICHAIN_MIGRATION_STATE` reserved in `AppKey`.
-   Multichain accounts persist and reload through `IStorage` round-trip.
-   Legacy accounts unaffected — round-trip test green.

---

## Track K — Per-chain derivation wiring

**Depends on:** Phase 1 Track A (chain-kit adapter), Phase 1 Track D (`DEFAULT_BIP44_PATH` map).
**Touches:** `packages/core/src/chains/adapter.ts` (extend `deriveAddress`),
`packages/core/src/chains/<chain>/derivation.ts` (new per-curve helpers, or single helper if
chain-kit handles it).

### Goal

Phase 1's `ChainkitAdapter.deriveAddress` throws `NotImplementedError`. Phase 2 wires it up so that
given a BIP39 seed (or its derived chain-specific keypair), the adapter returns the chain's
canonical address. This is what makes the Phase 2 demo work — addresses for TON / EVM / BTC / TRON
visible to the user.

### Tasks

-   [ ] **K1.** EVM derivation: BIP39 seed → secp256k1 keypair at `DEFAULT_BIP44_PATH.evm`
        (`m/44'/60'/0'/0/0`) → EIP-55 checksummed address. Use chain-kit's
        `CryptoWallet.fromMnemonic(...).getAddress(Chain.Ethereum.Mainnet)` if its surface is
        stable; otherwise an `ethers` HD walk (already a dep in `uikit`).
-   [ ] **K2.** BTC derivation: BIP39 seed → secp256k1 keypair at `DEFAULT_BIP44_PATH.btc`
        (`m/84'/0'/0'/0/0`, BIP-84 native segwit) → bech32 address. chain-kit preferred.
-   [ ] **K3.** TRON derivation (multichain path): BIP39 seed → secp256k1 keypair at
        `DEFAULT_BIP44_PATH.tron` (`m/44'/195'/0'/0/0`, canonical BIP-44) → base58 TRON address.
        **Do not touch** the legacy `tronWalletByTonMnemonic` path or its non-canonical
        `m/44'/195'/0'/0` (no terminal `/0`). Per invariant #1, legacy accounts continue to derive
        TRON via the existing code.
-   [ ] **K4.** TON derivation for `AccountMultichain`: reuses the Phase 1
        `bip39MnemonicToEd25519Seed` helper at `pathFor('ton')` (Track D). Same code path as legacy
        `mnemonic-bip39` accounts — the snapshot harness already covers this byte-identically. No
        new code; just confirmation that the multichain account creation flow funnels through this
        helper.
-   [ ] **K5.** SOL derivation (conditional on chain-kit Solana availability — see Phase 0
        decision). If chain-kit ships SOL by Phase 2: ed25519-SLIP-0010 at `DEFAULT_BIP44_PATH.sol`
        (`m/44'/501'/0'/0'`) → base58 address. If not: leave the SOL branch throwing
        `NotImplementedError` and exclude `'sol'` from default `enabledChains` in the creation flow
        (Track M). Document the descope in the open questions section of this doc.
-   [ ] **K6.** `ChainkitAdapter.deriveAddress` implementation: switch on `this.chain`, delegate to
        the per-chain helpers above. Update Phase 1's `chainkit-resolves.test.ts` (or a new test) to
        assert the canonical abandon×11+about BIP39 fixture produces a known address per chain
        (test-vector source: chain-kit's own integration tests, or BIP39 reference implementations).
-   [ ] **K7.** Cross-chain reference fixtures: pin one expected address per chain in
        `packages/core/src/chains/__tests__/multichain-fixtures.test.ts`. These are the regression
        canary for any drift in derivation — analogous to Track D's `EXPECTED_TON_ PUBLIC_KEY_HEX`
        pin.

### Risk callouts

-   **chain-kit surface stability.** The Phase 1 adapter wraps chain-kit's Kotlin/JS ergonomics
    behind `ChainAdapter`. If chain-kit's address-derivation API changes pre-1.0 (it's pre-alpha),
    the per-chain helpers absorb the impact — the adapter consumers don't see it.
-   **TRON path divergence.** Pinning the multichain TRON path at canonical `m/44'/195'/0'/0/0`
    means a user who exports their multichain BIP39 seed and re-imports it into a _different_ wallet
    that uses non-canonical legacy `m/44'/195'/0'/0` will see a different TRON address. Document
    this in the import flow (Track N).
-   **EVM checksumming.** EIP-55 checksumming is mandatory for `rawAddress`. Test the lowercase vs.
    mixed-case fixtures explicitly.

### Done when

-   `getAdapter(chain).deriveAddress({ publicKey, opts })` returns canonical addresses for TON / EVM
    / BTC / TRON (and SOL if chain-kit ships it).
-   Fixture test pins one expected address per chain against the canonical BIP39 vector.
-   Snapshot harness still green; 9/9 typechecks green.

---

## Track L — `IKeychainService` chain-prefixed keys

**Depends on:** nothing structurally — cross-cutting. **Touches:** `packages/core/src/AppSdk.ts`
(`IKeychainService` interface), `apps/desktop/src/electron/*` (keytar wrapper),
`apps/extension/src/libs/*` (extension keychain), `apps/mobile/src/libs/*` (Capacitor keychain),
`apps/web/src/libs/*` (web keychain stub).

### Goal

The existing `IKeychainService` stores wallet secrets keyed by `accountId`. Phase 2 extends it so
keys can also be chain-prefixed: e.g., per-chain ephemeral data (derived public keys, per-chain view
keys for privacy chains in the future, etc.) can live in the same secure store without colliding
with the mnemonic.

### Tasks

-   [ ] **L1.** Extend `IKeychainService` with `getValue(prefix: string, key: string)` /
        `setValue(prefix, key, value)` / `deleteValue(prefix, key)` / `deletePrefix(prefix)`.
        Existing single-arg `getPassword(accountId)` etc. stay — Phase 2 adds an orthogonal
        namespace, not a replacement.
-   [ ] **L2.** Platform impls prefix keys with the chain id (or any caller-supplied prefix) before
        delegating to the underlying store:
    -   **Desktop** (`keytar`): service name becomes `${SERVICE}::${prefix}`.
    -   **Extension** (`chrome.storage.local` or similar — confirm with existing code): key becomes
        `${prefix}::${key}`.
    -   **Capacitor** (mobile): use the existing secure-storage plugin's prefix support, or mangle
        the key.
    -   **Web** (browser): no real keychain — current implementation uses encrypted localStorage
        keyed by account. Mirror the prefix mangling.
-   [ ] **L3.** Audit existing keychain consumers (`getMAMWalletMnemonic`,
        `createAndStoreMetaEncryptionKeys`, etc.) — confirm none collide with a `'ton:'` or `'evm:'`
        prefix in the new namespace. If any do, escape or migrate.
-   [ ] **L4.** Platform-specific unit tests for round-tripping a chain-prefixed value on each of
        desktop / extension / mobile / web. The existing test setup per app can host these — no new
        test infrastructure needed.

### Risk callouts

-   **Cross-platform divergence.** Each `IKeychainService` implementation handles the storage
    differently (keytar OS keychain on desktop, browser storage on extension/web, Capacitor plugin
    on mobile). The prefix mangling must be consistent so a user who logs in on multiple platforms
    (unlikely Phase 2 scenario but plausible long-term) gets the same data.
-   **Sensitive data exposure.** Keychain is where mnemonics live. Any test that writes a real
    mnemonic to the device keychain must clean up on exit — use the throwaway fixture seed, never a
    real one.

### Done when

-   All four platform `IKeychainService` impls expose the prefixed API.
-   Round-trip test green on each platform.
-   No collisions with existing keychain consumers.

---

## Track O — Registry wiring for multichain account type

**Depends on:** I, K. Builds on Phase 1 Tracks B (signer registry) and C (wallet-contract registry).
**Touches:** `packages/core/src/service/sign/strategies/`,
`packages/core/src/service/wallet/contracts/`.

### Goal

Register `(accountType: 'multichain', chain: <each>)` entries with the signer factory and extend the
wallet-contract registry so `AccountMultichain` can produce wallet contracts / addresses for TON.
Write paths (signing) stay as `NotImplementedError` per the Phase 2 exit criterion — only the read
paths (deriveAddress, contract construction) are wired.

### Tasks

-   [ ] **O1.** TON strategy for multichain accounts: register `('multichain', 'ton')` against the
        signer registry pointing at a new strategy module `strategies/ton/multichain-ton-signer.ts`.
        The body is structurally identical to `mnemonic-ton-signer.ts` but pulls the secret from the
        multichain account's BIP39 seed (not from a legacy mnemonic field). Snapshot-harness this
        strategy: add a new fixture `multichain-ton__V*__*.json` to verify byte-identity against
        `mnemonic-bip39` (same derivation, same KDF — should produce identical signatures).
-   [ ] **O2.** EVM / BTC / TRON / SOL strategies registered with **NotImplementedError** bodies.
        The registry already throws "Phase 2+" for unregistered pairs; explicit registration makes
        the phase-pointer message more precise: `'Multichain ${chain} signing lands in Phase 4'`.
-   [ ] **O3.** Wallet-contract strategy: TON branch already works via Phase 1 Track C and accepts
        `(publicKey, version, network)`. Multichain accounts call into the same `getStrategy('ton')`
        — no new TON strategy needed. The non-TON strategies remain `NotImplementedError` per Phase
        1 Track C's exit state.
-   [ ] **O4.** Update Phase 1 Track E's `selectActiveWalletForChain` selector
        (`packages/core/src/chains/wallet-selector.ts`) so it returns multichain wallets for
        `AccountMultichain` accounts:
    -   For legacy accounts: unchanged (chain `'ton'` → `account.activeTonWallet`, else
        `undefined`).
    -   For `account.type === 'multichain'`: dispatch to `account.getWalletByChain(chain)`. The
        selector signature changes — it now takes the full `Account` instead of just the active TON
        wallet — but the `useActiveWalletForChain` hook signature stays the same because the hook
        resolves the account internally. Update the unit tests under
        `chains/__tests__/wallet-selector.test.ts` for the new multichain branch.

### Risk callouts

-   **O4 selector signature change.** Track E's selector takes `(activeTonWallet, chain)`. Phase 2
    needs the whole account to dispatch by `account.type`. Refactor carefully — the hook is the only
    caller; tests need updating in lock-step.
-   **Multichain TON signature byte-identity.** O1 must be tested via the snapshot harness with a
    `multichain` fixture, not just deduced from "BIP39 + same path = same key". Pin actual BOCs in
    `__tests__/snapshots/sign/multichain-ton__V*__*.json`.

### Done when

-   `getSigner({ accountId, chain: 'ton' })` works for `AccountMultichain` and produces
    byte-identical BOCs against the `multichain-ton` snapshot fixtures.
-   `getSigner({ accountId, chain: 'evm'|'btc'|'tron'|'sol' })` throws the "Phase 4" error for
    multichain accounts.
-   `useActiveWalletForChain` returns the correct per-chain wallet for multichain accounts.

---

## Track M — Create-multichain-wallet flow (UI)

**Depends on:** I, J, K, L, O. Behind `multichainEnabled`. **Touches:**
`packages/uikit/src/pages/import/` (or `packages/uikit/src/components/create/`), each app's
onboarding routing.

### Goal

A user with `multichainEnabled = true` can:

1. Tap "Create multichain wallet".
2. See a BIP39 phrase (12 words by default; 24 advanced).
3. Confirm backup via the existing word-quiz UX.
4. See per-chain enable toggles (TON forced on per Track I3).
5. See the derived addresses for each enabled chain.
6. Save the account.

### Tasks

-   [ ] **M1.** New entry point in onboarding: `CreateMultichainWalletPage` (or equivalent).
        Surfaced in onboarding/create routes **only** when `useAppContext().multichainEnabled`.
        Phase 1 Track F made the flag required and false-everywhere; Phase 2 is the first consumer.
-   [ ] **M2.** BIP39 mnemonic generation. 12-word default with a "24-word" advanced toggle. Use
        `bip39.generateMnemonic(128|256)` — already a dep.
-   [ ] **M3.** Backup confirmation: reuse the existing word-quiz component
        (`packages/uikit/src/components/create/Words.tsx` or similar; search by `import { Words }`
        to locate). It's mnemonic-agnostic.
-   [ ] **M4.** Chain selection step: list `CHAIN_IDS` with toggles. TON is force-enabled (Track I3
        invariant). Default: TON + EVM + BTC + TRON on; SOL off if chain-kit hasn't shipped SOL yet
        (per Track K5 fallback). User can opt chains in/out before final save.
-   [ ] **M5.** Address preview step: for each selected chain, call
        `getAdapter(chain).deriveAddress({...})` and render the address. This is the user-facing
        proof Phase 2 works.
-   [ ] **M6.** Save: encrypt the BIP39 mnemonic via the existing encrypted-secret pattern
        (`encryptWalletSecret`), construct `AccountMultichain`, write through `IAccountsStorage`,
        set as active account.
-   [ ] **M7.** Localization: every new string lands in `packages/locales` source files. Plan for
        ~30–40 new strings. **Required before flag flip**, not before merge.

### Risk callouts

-   **TON forced-enabled UX.** The toggle for `'ton'` must be visually disabled with a tooltip
    explaining "TON is required" — silently auto-enabling without UI feedback is worse than
    explicit. The Track I3 decision (TON required for v1) is what makes this clean.
-   **Mnemonic exposure window.** BIP39 phrase shown in plaintext during backup. Reuse the existing
    TON-mnemonic display component's screenshot-blocking / blur-on-blur behaviour. Don't reinvent.
-   **WASM warm-up.** `getAdapter(chain).deriveAddress(...)` may require `await ensureReady()`
    (chain-kit WASM load). Show a loading state on the address preview step; first-time load can be
    ~1s.

### Done when

-   Dev build with `VITE_MULTICHAIN_ENABLED=true` (web/mobile) or constant flip (desktop/extension)
    reaches a "Create multichain wallet" entry from onboarding.
-   Completed flow produces an `AccountMultichain` with derived addresses for all enabled chains.
-   No production callers — flag is `false` in prod, so the entry point is hidden.

---

## Track N — Import-multichain-wallet flow (UI)

**Depends on:** M (reuses most pieces). Behind `multichainEnabled`. **Touches:**
`packages/uikit/src/pages/import/`, the BIP39-vs-TON-standard-vs-MAM disambiguation logic in
`mnemonicService.ts`.

### Goal

A user with `multichainEnabled = true` can paste a BIP39 phrase and end up with an
`AccountMultichain` (instead of an `AccountTonMnemonic` with `mnemonicType: 'bip39'`, which is how
Phase 1 and earlier route BIP39).

### Tasks

-   [ ] **N1.** Detection: the existing `validateMnemonicTonOrMAM` / `validateBip39Mnemonic` helpers
        already disambiguate. Phase 2 adds a routing layer: TON-standard → `AccountTonMnemonic`
        (legacy, unchanged); MAM → `AccountMAM` (legacy, unchanged); BIP39 → branching choice:
    -   `multichainEnabled === false`: BIP39 routes to `AccountTonMnemonic` with
        `mnemonicType: 'bip39'` (Phase 1 behavior, byte-identical).
    -   `multichainEnabled === true`: BIP39 routes to `AccountMultichain` by default. Show an
        advanced option "Import as TON-only (legacy BIP39 wallet)" for users with paper-backup
        wallets that were created as TON-only BIP39 outside our app.
-   [ ] **N2.** Chain-selection step on import: same UI as Track M, defaulted to all chains
        supported by chain-kit. User can opt chains out (e.g., privacy-conscious users who don't
        want a TRON address derived for their seed).
-   [ ] **N3.** Optional derivation-path override per chain — advanced UI. Defaults to
        `DEFAULT_BIP44_PATH[chain]`. Letting users specify a non-canonical path is the only way a
        legacy hardware-wallet-derived BIP39 seed lands in our app with the expected addresses.
        Phase 2 ships the _plumbing_ for the override; the UI can be a single textbox per chain
        behind an "Advanced" expander, no fancy validation beyond the regex `/^m(\/\d+'?)+$/`.
-   [ ] **N4.** Save: same path as Track M6.

### Risk callouts

-   **Ambiguous BIP39.** A BIP39 phrase could equally be a legacy `mnemonic-bip39` TON-only wallet
    or a multichain wallet — the seed itself doesn't tell you. The "Import as TON-only" escape hatch
    in N1 must be discoverable for users with legacy backups. `MULTICHAIN_PLAN.md` open-question #7
    settles on multichain-default with the escape hatch visible; honour that until product overrides
    it.
-   **Non-canonical TRON path.** A user importing a BIP39 seed they originally created in another
    wallet that used the _non-canonical_ TRON path (`m/44'/195'/0'/0` — our legacy bolt-on uses
    this) will get a different TRON address by default. Surface this in the address-preview step's
    "Wrong TRON address?" copy with a link to the path override.

### Done when

-   Dev build with flag on routes BIP39 import to `AccountMultichain` by default.
-   "Import as TON-only" path produces `AccountTonMnemonic` (legacy) byte-identically.
-   Non-canonical derivation-path overrides accepted per chain.

---

## Track P — Address display + dev demo screen

**Depends on:** M, N. Behind `multichainEnabled`. **Touches:** `packages/uikit/src/pages/wallet/`
(or a new dev-only debug screen).

### Goal

This track is the Phase 2 exit demo. After M / N, a developer can see their multichain account and
switch between chains to see addresses. UI sophistication is deliberately minimal — full multichain
UX is Phase 3 (read paths) and Phase 4 (write paths). Phase 2 just needs proof of life.

### Tasks

-   [ ] **P1.** Minimal "Multichain wallet" header on the existing wallet page when
        `account.type === 'multichain'`. Shows the active chain's address. Switching chains is a
        dropdown / segmented control. No balances, no history (those are Phase 3).
-   [ ] **P2.** "Show all addresses" debug action: lists every chain in `enabledChains` with its
        address. Copy-to-clipboard via the existing `useAppSdk().copyToClipboard()`.
-   [ ] **P3.** Receive flow integration (read-only): the existing `ReceiveContent` already accepts
        `chain?: BLOCKCHAIN_NAME`. Wire the chain selector to use `useActiveWalletForChain(chain)`
        for multichain accounts. **Do not** rewrite Receive from scratch — that's Phase 3's job
        (`MULTICHAIN_PLAN.md` line 137: "Replace the TRON tab — TRON now flows through the same
        chain-kit path"). For Phase 2 we only need the new multichain account to show a correct
        address in Receive's existing TON / TRON tabs; EVM / BTC / SOL tabs land in Phase 3.
-   [ ] **P4.** Hide / no-op every other wallet feature for multichain accounts in Phase 2. Sending,
        swapping, history, dashboards, etc. should either render an empty/coming-soon state or hide
        entirely. The fastest pattern is a top-level
        `if (account.type === 'multichain') { return <MultichainComingSoon /> }` near the root of
        each unaffected screen. Phase 3 lights them up one by one.

### Risk callouts

-   **Scope creep.** P is the Phase 2 demo, not a polished UX. Resist the temptation to add balances
    or QR-codes-per-chain. Every minute spent on Phase 2 polish delays Phase 3, which is where the
    real read-path UX lives.
-   **Empty-state coverage.** Step P4 must triage every wallet page — not just the ones a developer
    remembers. `grep` for `useActiveAccount` and `useActiveWallet` to find every consumer, then
    triage one at a time. Missing pages will crash or show wrong data when a multichain account is
    active.

### Done when

-   Dev build (flag on) can: create a multichain account, see its TON + EVM + BTC + TRON (+
    optionally SOL) addresses, copy each to clipboard, switch between chains in the wallet header.
-   No transactions, no balances, no history — that's Phase 3.
-   Snapshot harness still green; 9/9 typechecks green; no production-build behaviour change (flag
    is `false` in prod).

---

## Milestones (not calendar)

Track progress by milestone, not week. Each milestone gates the next; don't skip.

1. **M8 — Per-chain types in place.** Track H complete: `EvmWallet`/`BtcWallet`/`SolWallet` defined,
   `MultichainWallet` union exported, legacy types untouched, snapshot harness still green.
2. **M9 — Variant landed.** Track I complete: `AccountMultichain` constructable, every
   `account.type` switch compiles, exhaustive `assertUnreachable` integration verified, unit tests
   green.
3. **M10 — Persistence in place.** Tracks J + L complete: multichain accounts round-trip through
   storage; `IKeychainService` exposes prefixed-key API on all 4 platforms; backwards-compat
   round-trip test green for every legacy account type.
4. **M11 — Derivation wired.** Track K complete: `getAdapter(chain).deriveAddress(...)` returns
   canonical addresses for TON / EVM / BTC / TRON; fixture-pinned test per chain passes.
5. **M12 — Registries wired.** Track O complete: multichain TON signing produces byte-identical BOCs
   against new `multichain-ton__*` snapshot fixtures; non-TON multichain signing throws the "Phase
   4" error; selector dispatches multichain accounts correctly.
6. **M13 — Create flow.** Track M complete: dev build with flag on creates a multichain account
   end-to-end; addresses preview correctly.
7. **M14 — Import flow.** Track N complete: dev build with flag on imports a BIP39 seed into a
   multichain account, with escape hatch to legacy TON-only.
8. **M15 — Demo proof.** Track P complete: dev build can display the new account's per-chain
   addresses on the wallet page; all other wallet features no-op safely for multichain accounts.
9. **M16 — Phase 2 exit review.** Full app suite green on all 4 target apps with flag on _and_ with
   flag off; legacy TRON code path verified intact (manual smoke: a legacy `AccountTonMnemonic`
   account still shows its TRON tab in Receive with the same address as Phase 1 end-state);
   bundle-size delta documented and within the Phase 0 budget. Sign-off before Phase 3.

---

## Phase 2 exit checklist

-   [ ] All 4 target apps (web, desktop, extension, mobile) build green with flag on and with flag
        off.
-   [ ] All existing unit tests pass.
-   [ ] 62-BOC snapshot harness still byte-identical for every legacy combo. New `multichain-ton__*`
        BOCs pinned and green.
-   [ ] `AccountMultichain` round-trips through `IStorage` without loss; legacy accounts round-trip
        byte-identical to Phase 1.
-   [ ] `useActiveWalletForChain(chain)` returns multichain wallets for `AccountMultichain` and
        keeps legacy parity for everything else.
-   [ ] `IKeychainService` exposes prefixed-key API on all 4 platforms; round-trip tests green.
-   [ ] `getAdapter(chain).deriveAddress(...)` returns canonical addresses for TON / EVM / BTC /
        TRON (and SOL if Phase 0 included it).
-   [ ] Dev build with flag on: create + import + display flows reach end-to-end.
-   [ ] Production build with flag off: zero user-visible changes — every multichain entry point is
        hidden; legacy onboarding paths are byte-identical to Phase 1.
-   [ ] **Legacy TRON path verified intact.** Manual smoke: log in with an `AccountTonMnemonic` that
        has a legacy `tronWallet`, confirm the TRON tab in Receive shows the same address as Phase
        1; confirm no Phase 2 code path is reachable for the legacy account.
-   [ ] Bundle-size delta per app documented and within Phase 0 budget. Extension and mobile
        (WASM-heavy) are highest-risk.
-   [ ] Localization keys added to `packages/locales` for every new screen (~30–40 keys).

---

## Out of scope for Phase 2

These are tempting but explicitly **deferred** to keep Phase 2 mechanical:

-   **Sending / swapping / signing transactions on non-TON chains.** Phase 4.
-   **Balances, history, portfolio aggregation across chains.** Phase 3.
-   **Receive UI rewrite (EVM/BTC/SOL tabs).** Phase 3 — Phase 2 only wires the existing TON +
    legacy TRON tabs through the new account's address resolver.
-   **Migration of legacy TON / MAM accounts to multichain.** Phase 4. Per invariant #1, no Phase 2
    code path modifies a legacy account.
-   **Replacing the legacy `tronWalletByTonMnemonic` bolt-on.** Phase 3 replaces TRON wholesale
    _only for multichain accounts_; legacy accounts continue using the bolt-on indefinitely.
-   **Public-facing UX polish.** Phase 5.
-   **Chain-kit Solana support if it's not yet shipped.** Track K5 leaves a clear opt-in path for
    whenever it lands.
-   **Hardware-wallet support for multichain accounts.** Ledger / Keystone for non-TON chains is
    Phase 4 at earliest.
-   **TWA.** Permanent — not coming back per memory `project_twa_unsupported`.

---

## Open question — chain-kit Solana availability at Phase 2 start

**Question:** Will chain-kit ship a working Solana module before Track K finishes?

**Context:**

-   `MULTICHAIN_PLAN.md` Phase 0 decision-needed item (line 49, "Descope from initial release, ship
    in Phase 5").
-   Phase 1 Track A registered SOL in the adapter registry but `validateAddress` returns false and
    `deriveAddress` throws `NotImplementedError`.
-   Track K5 above describes the contingent path — if SOL isn't ready, exclude `'sol'` from
    `enabledChains` defaults and leave the throw in place. Cost: low. Re-enabling is a single track
    in Phase 3 or Phase 5.

**Decision needed from:** chain-kit team / Phase 0 owner.

**Recommendation:** Proceed with TON + EVM + BTC + TRON as the v1 chain set; treat SOL as a Phase 5
deliverable per the main plan. If chain-kit ships SOL during Phase 2, fold it in via Track K5;
otherwise leave the stub.

**Decision:**

**Owner:**

**Date:**

---

## Resolved — Default BIP39 word count (12 vs 24)

**Question:** Does "Create multichain wallet" mint a 12-word or 24-word seed by default?

**Context:**

-   Legacy TON-standard mnemonic is 24 words. Users familiar with our app expect 24.
-   BIP39 standard for new wallets in the broader ecosystem is increasingly 12 words (less entropy
    than 24 but still 128-bit security, which is industry-standard).
-   Either is technically fine — chain-kit accepts both, and `bip39.generateMnemonic()` takes
    `128 | 256` bits.

**Recommendation:** 12 by default with a 24-word advanced toggle. Modern UX expectation + shorter
backup = lower abandonment rate. Power users opting into 24 is a single tap.

**Decision:** 12 words by default. 24-word option behind an "Advanced" toggle on the create flow.
Import accepts both lengths transparently (no UI toggle needed — `bip39.validateMnemonic` covers 12
and 24).

**Owner:** Natalia Stus

**Date:** 2026-05-25

---

## Resolved — TON forced-enabled invariant

**Question:** Must every `AccountMultichain` include `'ton'` in `enabledChains`?

**Context:**

-   Track I3 above proposes yes. Rationale: `BaseAccount.activeTonWallet` returns `TonContract`, not
    `TonContract | undefined`. Hundreds of call sites assume it's defined. A multichain account
    without TON breaks the contract.
-   Alternative: change `BaseAccount.activeTonWallet` to `TonContract | undefined` and audit every
    call site. Big refactor, no immediate user benefit.

**Recommendation:** Enforce the invariant in v1 (Phase 2). Document clearly in the create flow's
chain-selection step (TON toggle disabled with a tooltip). Phase 5 can relax it if there's demand.

**Decision:** Yes — TON is required on every `AccountMultichain`. Enforced at construction:
`AccountMultichain` constructor throws if `enabledChains` omits `'ton'`. The Track M4 chain
selection UI renders the TON toggle as disabled-on with a tooltip ("TON is required for multichain
wallets in v1"). Phase 5 can relax the invariant if there's demand, but every Phase 2–4 code path
can rely on `account.activeTonWallet` being defined for multichain accounts.

**Owner:** Natalia Stus

**Date:** 2026-05-25
