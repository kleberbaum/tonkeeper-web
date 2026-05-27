# Phase 2 — `AccountMultichain` variant + key management (task breakdown)

> **Status: WRAPPED (2026-05-27).** Phase 2 closed with the full backend/core foundation + Tailwind
> setup. **All multichain UI moved to Phase 3** behind the UI-library refactor: the create flow
> (Track M) had its screens built then **reverted — only its non-UI service foundation stayed** —
> and import (N) + address display (P) were never built. Everything UI gets built on the refactored
> library rather than the current one. The blocked **N3** path-override plumbing also moves to Phase
> 3 (waits on chain-kit exposing a path-aware derivation method). See the per-track banners below
> and `MULTICHAIN_PLAN.md` Phase 3 / `MULTICHAIN_PHASE_3_TASKS.md`.
>
> **Shipped in Phase 2 (non-UI):** Tracks H, I, J, K, L, O, Q (✅) and Track M's **service layer
> only** (`multichainCreateService`, `generateBip39Mnemonic`, the adapter `derivePublicKey`
> extension), all with core test coverage. Track M's UI was reverted and is now Phase 3 Track S.

Sibling document to `MULTICHAIN_PLAN.md` (Phase 2 section, lines 106–127) and
`MULTICHAIN_PHASE_1_TASKS.md`. Phase 2 puts the new wallet shape into the codebase so the rest of
the plan has something to plug in to: a `AccountMultichain` variant alongside the existing legacy
types, BIP39 key derivation per chain, per-chain wallet entries, secure storage, and the create flow
behind `multichainEnabled`.

**Team:** one developer on web integration. Tracks are sequenced serially below — no parallelism.
**Exit criterion (as wrapped):** The codebase holds the complete non-UI foundation for a multichain
account — the `AccountMultichain` variant, per-chain wallet entries + storage, per-chain key
derivation, `IKeychainService` chain-prefixed keys, registry wiring, the tested
`multichainCreateService` (BIP39 → TON + per-chain addresses → `AccountMultichain`), and the
Tailwind setup. **No multichain UI ships in Phase 2** — every screen waits on the Phase 3 UI-library
refactor. No transactions, no migration. Existing TON-only accounts and the legacy TRON code path
are byte-identical to Phase 1 end-state — the snapshot harness (Track G) still passes.

**Redesign scope:** Phase 2 introduced Tailwind as the styling system going forward (Track Q). The
create flow's UI (Track M) was built in Tailwind then reverted out — its service foundation stayed,
the screens move to Phase 3 Track S. All multichain UI (create/import/display) is built on the Phase
3 refactored library, ported opportunistically, not as a codebase-wide rewrite.

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
6. **Styling migration is opportunistic, not wholesale.** Tailwind replaces styled-components only
   for (a) new files under `packages/uikit/src/multichain/**` and (b) any existing component edited
   as part of Track M/N/P. Everything else stays styled-components. There is no Phase 2 PR whose
   diff is "migrate component X to Tailwind" without an accompanying multichain change — that's
   scope creep and Phase 5 territory.

---

## Track summary & order

Serialized for a single developer. Each track must be complete before the next begins, with
exceptions noted.

```
  H. Per-chain wallet entries     ← types, foundational           ✅
            │
  I. AccountMultichain variant    ← needs H                        ✅
            │
  J. Storage keys + serialization ← needs I                        ✅
            │
  K. Per-chain derivation wiring  ← needs Phase 1 Track A          ✅
            │
  L. IKeychainService chain keys  ← cross-cutting, all 4 platforms ✅
            │
  O. Registry wiring (multichain) ← needs I + K (and Phase 1 B/C)  ✅
            │
  Q. Tailwind setup + token bridge← cross-platform CSS             ✅
            │
  M. Create flow — SERVICE ONLY   ← service shipped; UI reverted   ✅ (service)
  ─────────────────────────────── Phase 2 wrapped here (non-UI) ───────────────
  M(ui). Create flow screens      → moved to Phase 3 Track S (after UI refactor)
            │
  N. Import-multichain flow (UI)  → moved to Phase 3 Track T (after UI refactor)
            │
  P. Address display + dev demo   → moved to Phase 3 Track U (after UI refactor)
```

**Phase 2 wrapped at the non-UI foundation.** Track M's create UI was built then reverted — only its
service layer (`multichainCreateService`, `generateBip39Mnemonic`, adapter `derivePublicKey`)
stayed. All multichain UI — create (→ Phase 3 Track S), import (→ T), address display (→ U) — is
built on the Phase 3 refactored library. N3 (per-chain derivation-path override) is additionally
blocked on chain-kit exposing a path-aware derivation method.

**Exceptions (historical):** L (IKeychainService) is cross-cutting and platform-touching — could
slot in earlier (no dependency on H/I/J/K). K could move ahead of I/J if chain-kit's
address-derivation surface blocked the variant's shape. Q (Tailwind) had no dependency on
H/I/J/K/L/O — landed before M so designs could prototype against a real Tailwind setup. H → I → J →
O stayed in order: each layer builds on the previous one's types or storage schema.

---

## Track H — Per-chain wallet entries ✅

**Status:** Done (2026-05-26).

**Done summary:** Per-chain wallet types live in
`packages/core/src/entries/{evm,btc,sol}/<chain>-wallet.ts` and a new
`entries/tron/multichain-tron-wallet.ts` (mirrors the existing `entries/tron/tron-wallet.ts`
convention; no cross-file imports to avoid circular type refs). TRON is split intentionally —
`TronWallet` (legacy bolt-on `{id, address}` on `DerivationItem.tronWallet`) is byte-and-bit
untouched; `MultichainTronWallet` is a sibling of `EvmWallet`/`BtcWallet`/`SolWallet` with
`{id, chain: 'tron', rawAddress, publicKey, derivationPath}`. This was a deliberate flip from the
original MD ("do not introduce a separate `MultichainTronWallet`") — see the revised Goal and risk
callout below for the reasoning. `MultichainWallet` union and the four chain-symmetric narrowing
helpers (`isEvmWallet`, `isBtcWallet`, `isSolWallet`, `isTronWallet` — all narrow on
`wallet.chain === '<chain>'`) live in `entries/wallet.ts`.
`TonWalletStandard.derivationPath?: string` added — optional, round-trips. New test file
`entries/__tests__/wallet.test.ts` covers all four helpers + exhaustive-narrowing + round-trip. All
223 core tests pass including the 62-BOC snapshot harness; full workspace typecheck green (9/9).

**Depends on:** Phase 1 (`ChainId` from `packages/core/src/chains/types.ts`). **Touches:**
`packages/core/src/entries/wallet.ts`, new files under
`packages/core/src/entries/{evm,btc,sol}/<chain>-wallet.ts`,
`packages/core/src/entries/tron/multichain-tron-wallet.ts`.

### Goal

Define the per-chain wallet shapes that `AccountMultichain` will hold. `TonWalletStandard` already
exists and stays untouched (only addition: optional `derivationPath?: string`, populated by the
multichain creation flow). Add `EvmWallet`, `BtcWallet`, `SolWallet`, and a new
`MultichainTronWallet` sibling of the other three.

**Design flip on TRON.** The original MD said do not introduce a separate `MultichainTronWallet`
because "the on-chain object is identical." In implementation we split anyway: the legacy
`TronWallet` (`{id, address}`) at `entries/tron/tron-wallet.ts` is a minimal bolt-on attached to
`AccountTonMnemonic` / `AccountMAM` via `DerivationItem.tronWallet`, not a first-class wallet entry.
Forcing legacy and multichain TRON to share that shape would mean either (a) adding `chain` /
`rawAddress` / `publicKey` / `derivationPath` to the legacy type (modifies persisted storage and
weakens invariant #1) or (b) shape-detection narrowing helpers asymmetric with their EVM/BTC/SOL
siblings. Splitting into two types — legacy `TronWallet` untouched, new `MultichainTronWallet`
symmetric with the other chain entries — keeps Phase 2 invariant #1 strict _and_ produces clean
discriminated-union narrowing. TON does _not_ get the same split: legacy and multichain TON share
`TonWalletStandard` because the shape genuinely matches, the wallet-contract factory and signing
strategies are shared (Track O3), and `BaseAccount.activeTonWallet: TonContract` polymorphism
depends on it (Track I3).

### Shape

```ts
// Per-chain files: packages/core/src/entries/{evm,btc,sol}/<chain>-wallet.ts
// and packages/core/src/entries/tron/multichain-tron-wallet.ts.

export type EvmWallet = {
    id: string; // chain-prefixed: 'evm:<addr>' or similar
    chain: 'evm';
    rawAddress: string; // 0x-prefixed hex, EIP-55 checksummed
    publicKey: string; // hex, secp256k1 uncompressed
    derivationPath: string; // BIP-44 path actually used
};

export type BtcWallet = {
    id: string;
    chain: 'btc';
    rawAddress: string; // bech32 (default: BIP-84 native segwit)
    publicKey: string; // hex, secp256k1 compressed
    derivationPath: string;
};

export type MultichainTronWallet = {
    id: string;
    chain: 'tron';
    rawAddress: string; // base58 TRON address (e.g. 'T...')
    publicKey: string; // hex, secp256k1 compressed
    derivationPath: string; // canonical m/44'/195'/0'/0/0
};

export type SolWallet = {
    id: string;
    chain: 'sol';
    rawAddress: string; // base58
    publicKey: string; // hex, ed25519
    derivationPath: string;
};

// Legacy `TronWallet` (= { id, address }) at entries/tron/tron-wallet.ts
// stays byte-and-bit untouched. It lives on DerivationItem.tronWallet?,
// not in AccountMultichain.wallets[].
```

### Tasks

-   [x] **H1.** Defined `EvmWallet`, `BtcWallet`, `SolWallet`, `MultichainTronWallet` in per-chain
        files under `packages/core/src/entries/{evm,btc,sol}/<chain>-wallet.ts` and
        `entries/tron/multichain-tron-wallet.ts`. Each carries `id`, `chain` discriminator,
        `rawAddress`, `publicKey`, `derivationPath`. Legacy `entries/tron/tron-wallet.ts` is
        untouched.
-   [x] **H2.**
        `MultichainWallet = TonWalletStandard | EvmWallet | BtcWallet | MultichainTronWallet | SolWallet`
        exported from `entries/wallet.ts`. `TonWalletStandard` keeps implicit narrowing via
        `isStandardTonWallet` (`'version' in wallet && 'publicKey' in wallet`). Legacy `TronWallet`
        deliberately _not_ in the union — it lives on `DerivationItem.tronWallet?:`, not on
        `AccountMultichain.wallets[]`.
-   [x] **H3.** Added `derivationPath?: string` to `TonWalletStandard`. JSON round-trip verified in
        tests for both legacy (absent) and multichain (present) shapes.
-   [x] **H4.** All four chain helpers symmetric:
        `isEvmWallet`/`isBtcWallet`/`isSolWallet`/`isTronWallet` each narrow via
        `wallet.chain === '<chain>'`. No shape-detection asymmetry.
-   [x] **H5.** `entries/__tests__/wallet.test.ts` (13 tests): per-helper fixture matching,
        exhaustive narrowing (every shape lands in exactly one branch), `TonWalletStandard` JSON
        round-trip in both shapes, legacy → Phase 2 read.

### Risk callouts

-   **TonWalletStandard discriminator gap.** Existing code branches on `'version' in wallet` — don't
    add a `chain: 'ton'` field that breaks that narrowing. Either keep the implicit narrowing or add
    `chain` as `'ton' | undefined` with downstream consumers updated.
-   **Legacy `TronWallet` is byte-and-bit untouched.** The original MD said the legacy type at
    `packages/core/src/entries/tron/tron-wallet.ts` would be _the_ TRON wallet type for both legacy
    and multichain accounts. Implementation flipped that: legacy `TronWallet` (`{id, address}`) is a
    minimal bolt-on used only by `AccountTonMnemonic` / `AccountMAM` via
    `DerivationItem.tronWallet`, and `MultichainTronWallet`
    (`entries/tron/multichain-tron-wallet.ts`) is the sibling-symmetric chain-tagged entry used in
    `AccountMultichain.wallets[]`. The split keeps invariant #1 strict (no on-disk shape change for
    any legacy account) and lets all four chain helpers narrow on `chain === '<chain>'`
    symmetrically. TON does **not** get the same split — see the Goal section for the asymmetry.

### Done when

-   `MultichainWallet` union exported from `packages/core/src/entries/wallet.ts`.
-   Unit tests pass; 62-BOC snapshot harness still byte-identical (purely additive types).
-   `yarn turbo typecheck` green on all 9 workspaces (TWA still excluded).
-   No legacy account-type serialization changes.

---

## Track I — `AccountMultichain` variant in the `Account` union ✅

**Depends on:** H. **Touches:** `packages/core/src/entries/account.ts`,
`packages/core/src/chains/wallet-selector.ts`, `packages/uikit/src/state/wallet.ts`, and the seven
files that exhaustively switch on `account.type` (see I6 below).

### Done summary

`AccountMultichain` extends `Clonable` and implements `IAccountTonWalletStandard` — same contract
every other TON-standard account already satisfies. The class is co-located in `account.ts` with the
other variants; the static `create()` factory mirrors `AccountTonMnemonic.create`. The variant is
added to `AccountTonWalletStandard` (and therefore `Account`) so all existing type predicates narrow
correctly.

`WalletForChain<C>` in `chains/wallet-selector.ts` was widened from "TON only" to a chain-tagged map
across all five chains, and `selectActiveWalletForChain(account, chain)` (formerly
`(activeTonWallet, chain)`) routes multichain accounts through `account.getWalletByChain(chain)`.
The `useActiveWalletForChain` hook now passes the account through unchanged.

The seven `assertUnreachable(account)` sites either gained a working `'multichain'` branch (badge
helpers, settings rows, aside menu — all render `null` until Track P designs the multichain UI) or a
`'multichain'` branch that throws `'Phase 3+: <method> not wired'` (Track O3 wires `signDataOver` /
`signTonConnectOver`). Each branch carries an inline comment pointing at the Phase that finishes the
wiring.

### Goal

Add the new account variant. Existing union members untouched. Discriminator
`account.type === 'multichain'`. Holds a BIP39 seed (encrypted, mirroring how `AccountTonMnemonic`
stores its mnemonic), per-chain wallets, and active-wallet-per-chain selection.

### v1 TON-required invariant

Every `AccountMultichain` must include `'ton'` in `enabledChains` and carry at least one
`TonWalletStandard` in `wallets`. The constructor throws if either is missing, plus a third guard
that `activeWalletByChain.ton` points at one of those TON wallets. Rationale: `activeTonWallet` is
typed as `TonWalletStandard` (not `TonWalletStandard | undefined`) to match the
`IAccountTonWalletStandard` contract that hundreds of call sites read. Letting a TON-less multichain
account flow through would have meant either weakening that contract everywhere or throwing inside a
getter that nobody expects to throw. Phase 5 may relax this if a TON-less multichain account becomes
a real product requirement.

### Shape

```ts
export class AccountMultichain extends Clonable implements IAccountTonWalletStandard {
    public readonly type = 'multichain';

    constructor(
        public readonly id: AccountId,
        public name: string,
        public emoji: string,
        public auth: AuthPassword | AuthKeychain,
        public enabledChains: ChainId[],
        public activeWalletByChain: Partial<Record<ChainId, WalletId>>,
        public wallets: MultichainWallet[]
    ) {
        super(); /* TON-required invariant enforced here */
    }

    get allTonWallets(): TonWalletStandard[] {
        return this.wallets.filter(isStandardTonWallet);
    }
    get activeTonWallet(): TonWalletStandard {
        /* by activeWalletByChain.ton */
    }

    getTonWallet(id: WalletId): TonWalletStandard | undefined;
    setActiveTonWallet(walletId: WalletId): void;
    getWalletByChain(chain: ChainId): MultichainWallet | undefined;

    static create(params): AccountMultichain;
}
```

Note on `getWalletByChain` typing: the method returns `MultichainWallet | undefined` (not a
conditional `WalletForChain<C>`). Keeping the per-chain narrowing on the dispatcher
(`selectActiveWalletForChain`) avoids a cyclic import between `entries/account.ts` and
`chains/wallet-selector.ts`. Callers that want chain-precise typing go through the dispatcher;
callers that already know the chain branch can `as` the result.

### Tasks

-   [x] **I1.** `AccountMultichain` class implementing `IAccountTonWalletStandard`. Constructor
        enforces the v1 TON-required invariant.
-   [x] **I2.** `AccountMultichain` added to `AccountTonWalletStandard` (transitively to `Account`).
        `multichain: AccountMultichain.prototype` added to the prototypes map.
-   [x] **I3.** `allTonWallets` / `activeTonWallet` getters. `activeTonWallet` is a total function
        (never `undefined`) thanks to the constructor invariant.
-   [x] **I4.** `getWalletByChain(chain)` on the class + dispatcher routing in
        `selectActiveWalletForChain(account, chain)`. `WalletForChain<C>` widened to all five
        chains. `useActiveWalletForChain` hook updated to pass the account.
-   [x] **I5.** Static `AccountMultichain.create(params)` factory for storage deserialization.
-   [x] **I6.** Exhaustive-switch sites updated:
    -   `packages/core/src/entries/account.ts` — predicates: `isAccountVersionEditable` (false),
        `isAccountTonWalletStandard` (true), `isAccountSupportTonConnect` (false, Phase 3+),
        `isAccountCanManageMultisigs` (false), `isMnemonicAndPassword` (false),
        `getNetworkByAccount` (MAINNET), `isAccountTronCompatible` (false — legacy channel only),
        `isAccountBip39` (true — multichain seed is BIP39 by construction).
    -   `packages/core/src/entries/dashboard.ts` — multichain row renders version suffix when
        account has multiple TON wallets.
    -   `packages/core/src/analytics/wallet-mapping.ts` — `toWalletSource` → `'mnemonic'`.
    -   `packages/core/src/service/sign/strategies/ton/_shared.ts` —
        `AccountByType['multichain'] = AccountMultichain`.
    -   `packages/uikit/src/state/mnemonic.ts` (two sites) — `signDataOver` and `signTonConnectOver`
        throw `'Phase 3+: <method> not wired for multichain accounts'`.
    -   `packages/uikit/src/desktop-pages/settings/DesktopManageWalletsSettings.tsx`,
        `packages/uikit/src/components/desktop/aside/AsideMenuAccount.tsx`,
        `packages/uikit/src/components/account/AccountBadge.tsx`,
        `packages/uikit/src/pages/settings/Version.tsx` — render `null` / `Navigate` until Track P
        designs multichain UI. Gated by `multichainEnabled` so no production users hit these paths
        in Phase 2.
    -   `legacy-tron-signer.ts` and `getMultiPayloadSigner` were already inside
        `isAccountTronCompatible` guards that now exclude `'multichain'`, so no edit needed there.
-   [x] **I7.** 25 unit tests in `entries/__tests__/account-multichain.test.ts` covering
        construction invariants, all `IAccountTonWalletStandard` methods, `getWalletByChain` for
        every chain, all seven Account predicates, and `clone()` prototype preservation. Plus 13
        tests in `chains/__tests__/wallet-selector.test.ts` (legacy + multichain dispatch).

### Risk callouts

-   **Pervasive `account.type` switches.** All seven `assertUnreachable(account)` sites were triaged
    and updated; plus three implicit-exhaustive sites discovered during typecheck (`Version.tsx`,
    `wallet-mapping.ts`, `_shared.ts`'s `AccountByType` map). Future `account.type` switches will
    surface as typecheck errors — that's the system working as designed.
-   **Backwards-compatible storage.** Track J owns the storage round-trip test (J4). `account.ts`
    changes here are purely additive; existing account types stayed byte-identical, and the
    serialized form of `AccountMultichain` is new in Phase 2.
-   **`activeTonWallet` getter and TON requirement.** Locked at construction time
    (`AccountMultichain` throws on bad input); Track M (creation flow) gets a runtime guard at
    user-facing entry to surface a friendly error rather than a thrown exception.

### Done when

-   [x] `AccountMultichain` constructable, serializable shape stable.
-   [x] All `account.type` switches compile and route the new variant either to a handler or to a
        clearly-marked "Phase 3+" throw.
-   [x] Unit tests pass (254 / 254 in `@tonkeeper/core`); snapshot harness still green (62 BOCs
        byte-identical); 9/9 typechecks green.

---

## Track J — Storage keys + (de)serialization ✅

**Status:** Done (2026-05-26).

**Depends on:** I. **Touches:** `packages/core/src/Keys.ts`, new
`packages/core/src/service/__tests__/accountsStorage.test.ts`.

### Done summary

`AppKey` now reserves `MULTICHAIN_CHAIN_CONFIG` (per-account chain preferences) and
`MULTICHAIN_MIGRATION_STATE` (legacy→multichain migration). Both keys are documented in-place with
the rationale; no read/write code is wired against them yet.

No `accountsStorage.ts` code change was needed. The existing pattern persists the `accounts` list
through `IStorage` as a plain JSON list, then `bindAccountToClass(account)` re-attaches the class
prototype based on `account.type` after read. Adding `multichain: AccountMultichain.prototype` to
the prototypes map in Track I was sufficient — the serializer / deserializer paths are fully generic
over the union.

A new test (`packages/core/src/service/__tests__/accountsStorage.test.ts`) round-trips every account
class through a JSON-serializing storage shim that mirrors how real platforms persist
(`localStorage`, electron-store, mobile secure storage). 14 tests cover: every legacy account class
(`AccountTonMnemonic`, `AccountTonTestnet`, `AccountTonSK`, `AccountTonOnly`, `AccountTonWatchOnly`,
`AccountKeystone`, `AccountLedger`, `AccountMAM`, `AccountTonMultisig`), `AccountMultichain` with
all five chains, `AccountMultichain` with TON-only, the `IAccountTonWalletStandard` contract on the
deserialized multichain instance, a mixed legacy + multichain list preserving array order, and the
two new `AppKey` enum values. Each assertion checks `instanceof` plus deep-equal, and verifies
`TonWalletStandard.derivationPath` is absent on legacy fixtures and present on multichain. The
`@ton-keychain/{core,trx}` modules pulled in transitively by `walletService.ts` are stubbed via
`vi.mock` — the round-trip code paths under test never call them, and the real ESM has a malformed
internal import path that vitest's loader can't resolve.

Full `@tonkeeper/core` suite: 17/17 files, 268/268 tests, 62-BOC snapshot harness byte-identical.
Workspace typecheck: 9/9 green.

### Goal

Multichain accounts persist alongside legacy accounts in the same `accounts` storage list. No new
top-level storage key for accounts themselves — the existing `IStorage` map already supports
mixed-type lists via the `type` discriminator. New storage keys are reserved only for _chain-level_
state (the `multichainEnabled` flag is plumbed via `IAppContext`; that's not storage).

### Tasks

-   [x] **J1.** `MULTICHAIN_CHAIN_CONFIG` added to `AppKey` enum in `packages/core/src/Keys.ts`.
        Stores per-account chain-level preferences (visible chains, hide-lists, etc.). Reserved only
        — schema lands when chain preferences become user-facing.
-   [x] **J2.** Storage serializer / deserializer round-trip verified. No new code: the existing
        `AccountsStorage.setAccounts` / `getAccounts` path encodes the full list as JSON and
        `bindAccountToClass` re-attaches the prototype on read. `multichain` is in the prototypes
        map (Track I2). Round-trip asserts deep-equal + `instanceof`.
-   [x] **J3.** `MULTICHAIN_MIGRATION_STATE` added to `AppKey` as a reserved key (no read/write code
        yet). The legacy→multichain migration flow uses this; reserving now keeps the enum stable.
-   [x] **J4.** Backwards-compat round-trip test exercises every legacy account class plus
        `AccountMultichain`. `TonWalletStandard.derivationPath` is optional and round-trips both
        absent (legacy) and present (multichain).

### Risk callouts

-   **Storage corruption blast radius.** Mangled (de)serialize on legacy accounts = users locked out
    of their wallets. The round-trip test is the gate; every legacy account class is covered.
-   **Storage migration on read.** No schema migration was needed in this track. If a future change
    requires a one-time legacy-upgrade write, the right hook is the existing
    `StorageMigrationService` pattern (`apps/mobile/src/libs/storage.ts:86-204`) — not ad-hoc
    deserializer logic.

### Done when

-   [x] `MULTICHAIN_CHAIN_CONFIG` and `MULTICHAIN_MIGRATION_STATE` reserved in `AppKey`.
-   [x] Multichain accounts persist and reload through `IStorage` round-trip; `instanceof` + deep
        equal after deserialization.
-   [x] Legacy accounts unaffected — every legacy class round-trips byte-identical.
-   [x] Full core suite green (17/17 files, 268 tests); snapshot harness still byte-identical (62
        BOCs); workspace typecheck 9/9 green.

---

## Track K — Per-chain derivation wiring ✅

**Status:** Done (2026-05-26).

**Depends on:** Phase 1 Track A (chain-kit adapter), Phase 1 Track D (`DEFAULT_BIP44_PATH` map).
**Touches:** `packages/core/src/chains/types.ts` (signature change),
`packages/core/src/chains/adapter.ts` (chain-kit-backed implementation),
`packages/core/src/chains/__tests__/adapter.test.ts`, new
`packages/core/src/chains/__tests__/multichain-fixtures.test.ts`.

### Done summary

`ChainAdapter.deriveAddress` signature widened to `{ mnemonic: string } → Promise<string>` — the
Phase 1 `{ publicKey: Uint8Array }` placeholder is replaced. Chain-kit's
`CryptoWallet.Companion.fromMnemonic(mnemonic).getAddress(chainOf(chain)).display` is the single
backend for EVM / BTC / TRON. No per-curve helpers were needed — chain-kit handles BIP-44 / BIP-84
internally and returns each chain's canonical address shape (EIP-55 EVM, bech32 BTC, base58 TRON).

TON and SOL throw `NotImplementedError`:

-   **TON** because the address depends on the wallet contract version (V4R2 vs V5R1 vs …), which
    only `walletContract(pubkey, version)` knows. The multichain create flow (Track M) derives the
    TON pubkey via `bip39MnemonicToEd25519Seed` at `pathFor('ton')` — the same path the legacy
    `mnemonic-bip39` accounts use, byte-identical against the 62-BOC snapshot harness.
-   **SOL** because chain-kit still ships no Solana module. Per Phase 0, SOL is descoped to a later
    phase; Track M's default `enabledChains` will exclude it.

The fixture-pinned regression canary lives in
`packages/core/src/chains/__tests__/multichain-fixtures.test.ts`. It derives the canonical BIP39
reference mnemonic (`abandon` ×11 + `about`) and pins one expected address per chain — these values
match every other BIP39 reference implementation at `DEFAULT_BIP44_PATH[chain]`:

| Chain | Path                | Pinned address                               |
| ----- | ------------------- | -------------------------------------------- |
| EVM   | `m/44'/60'/0'/0/0`  | `0x9858EfFD232B4033E47d90003D41EC34EcaEda94` |
| BTC   | `m/84'/0'/0'/0/0`   | `bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu` |
| TRON  | `m/44'/195'/0'/0/0` | `TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH`         |

Any chain-kit upgrade that silently changes these will fail this test instead of moving every
multichain user's address.

Full `@tonkeeper/core` suite: 18/18 files, 275/275 tests, snapshot harness still byte-identical (62
BOCs). Workspace typecheck: 9/9 green.

### Goal

Phase 1's `ChainkitAdapter.deriveAddress` throws `NotImplementedError`. Phase 2 wires it up so that
given a BIP39 mnemonic, the adapter returns the chain's canonical address. This is what makes the
Phase 2 demo work — addresses for TON / EVM / BTC / TRON visible to the user.

### Tasks

-   [x] **K1.** EVM derivation via chain-kit's
        `CryptoWallet.fromMnemonic(...).getAddress(Chain.Ethereum.Mainnet)`. Returns EIP-55
        checksummed `0x…` address at `m/44'/60'/0'/0/0`.
-   [x] **K2.** BTC derivation via chain-kit. Returns bech32 (BIP-84 native segwit) address at
        `m/84'/0'/0'/0/0`.
-   [x] **K3.** TRON derivation (multichain path) via chain-kit. Returns base58 address at canonical
        `m/44'/195'/0'/0/0`. The legacy `tronWalletByTonMnemonic` path and its non-canonical
        `m/44'/195'/0'/0` (no terminal `/0`) are untouched — invariant #1 holds.
-   [x] **K4.** TON derivation for `AccountMultichain` reuses `bip39MnemonicToEd25519Seed` at
        `pathFor('ton')` — the same path the legacy `mnemonic-bip39` accounts use. The adapter's TON
        branch throws with a pointer to `walletContract()` in `service/wallet/contractService.ts`,
        since address resolution there is version-aware and the adapter can't pick a wallet version.
-   [x] **K5.** SOL derivation deferred — chain-kit has no Solana module. Adapter's SOL branch
        throws `NotImplementedError`. Track M's default `enabledChains` will exclude `'sol'` until
        chain-kit ships it.
-   [x] **K6.** `ChainkitAdapter.deriveAddress` implementation switches on `this.chain` — single
        chain-kit pipeline for EVM / BTC / TRON, throws for TON / SOL. `adapter.test.ts` updated to
        assert real derivation for EVM / BTC / TRON and throws for TON / SOL.
-   [x] **K7.** `chains/__tests__/multichain-fixtures.test.ts` pins one address per chain against
        the canonical abandon×11+about BIP39 vector.

### Risk callouts

-   **chain-kit surface stability.** Chain-kit is pre-alpha. A breaking change to
    `CryptoWallet.Companion.fromMnemonic` or `getAddress` lands in the adapter, not in adapter
    consumers — and the fixture test fails loudly if the derived addresses ever drift.
-   **TRON path divergence.** A user who exports their multichain BIP39 seed and re-imports it into
    a _different_ wallet that uses non-canonical legacy `m/44'/195'/0'/0` will see a different TRON
    address. Track N's import flow surfaces this in the address-preview copy.
-   **EVM checksumming.** Chain-kit returns the EIP-55 checksummed form (verified in the pinned
    fixture: `0x9858EfFD232B4033E47d90003D41EC34EcaEda94`). Downstream code that lowercases EVM
    addresses for `validateAddress` round-tripping is unaffected — chain-kit's `validateAddress`
    accepts both cases.

### Done when

-   [x] `getAdapter(chain).deriveAddress({ mnemonic })` returns canonical addresses for EVM / BTC /
        TRON; throws for TON (version-aware) and SOL (chain-kit gap).
-   [x] Fixture test pins one expected address per chain against the canonical BIP39 vector.
-   [x] Snapshot harness still byte-identical (62 BOCs); 9/9 typechecks green.

---

## Track L — `IKeychainService` chain-prefixed keys ✅

**Status:** Done (2026-05-26).

**Depends on:** nothing structurally — cross-cutting. **Touches:** `packages/core/src/AppSdk.ts`
(interface), `packages/core/src/base-keychain-service.ts` (concrete prefix-namespace impl),
`packages/core/src/Keys.ts` (`KEYCHAIN_PREFIX_INDEX` reserved), `apps/desktop/src/libs/keychain.ts`,
`apps/mobile/src/libs/keychain.ts`, new `packages/core/src/__tests__/base-keychain-service.test.ts`.

### Done summary

`IKeychainService` exposes a new orthogonal namespace alongside the existing
`setData/getData/removeData`:

```ts
setValue(prefix, key, value): Promise<void>;
getValue(prefix, key): Promise<string | null>;
deleteValue(prefix, key): Promise<void>;
deletePrefix(prefix): Promise<void>;
```

The four methods are implemented **concretely on `BaseKeychainService`** in terms of three new
abstract raw I/O methods (`setRawData`, `getRawData`, `deleteRawData`) that each platform supplies.
The base layers the namespacing (`chain::<prefix>::<key>`) and tracks per-prefix keys in `IStorage`
under the new `KEYCHAIN_PREFIX_INDEX` key — that lets `deletePrefix` iterate without needing a
platform-specific `listAllKeys()` on the secure store.

Critical: the prefixed reads **bypass `securityCheck()`**. The new values are not the mnemonic —
they're per-chain derived pubkeys, future view keys, etc. Prompting the user for biometry on every
chain switch would be hostile. The interface docstring spells this out; the abstract methods are
documented "must NOT call securityCheck".

Platform impls landed on the two platforms that actually have a keychain:

-   **Desktop (`KeychainDesktop`)** — `setRawData` / `getRawData` / `deleteRawData` reuse the
    existing `sendBackground` IPC bridge to `keytar`. The raw key (e.g. `chain::evm::cached-pubkey`)
    flows verbatim through the IPC; the main-process handler prepends its own `Wallet-` prefix, so
    the final keytar entry is `Wallet-chain::evm::cached-pubkey` — no collision with legacy
    `Wallet-<hexPubkey>` entries.
-   **Mobile (`KeychainCapacitor`)** — same shape over Capacitor `SecureStorage` with id
    `Wallet-chain::<prefix>::<key>`.

Extension and web do not currently ship an `IKeychainService` implementation (the field is
`keychain?: IKeychainService | undefined` on `IAppSdk`). The spec originally enumerated four
platforms — only two have a real impl. No Phase 2 consumer of this API runs on extension or web, so
we're not adding stubs. If/when those platforms grow a keychain, the abstract method contract they
inherit makes the prefixed API a single-line wire-up away.

### L3 audit — no collisions

Existing callers of `setData(key, …)` pass `account.auth.keychainStoreKey`, which equals the
account's hex public key. The legacy stored form is `Wallet-<hexPubkey>` (64 lowercase hex chars).
The new namespace stores as `Wallet-chain::<prefix>::<key>`. `chain::` cannot appear at the start of
a hex public key, so the two namespaces are disjoint by construction.

### Tests

`packages/core/src/__tests__/base-keychain-service.test.ts` — 11 tests against an in-memory subclass
that exercises only the prefixed namespace: round-trip, per-prefix isolation, per-key isolation, the
underlying `chain::` key shape, index tracking on set (incl. dedupe on overwrite), untracking on
delete (incl. collapsing an emptied prefix), `deletePrefix` walking the index, and the empty-prefix
no-op.

Full `@tonkeeper/core` suite: 19/19 files, 286/286 tests. Snapshot harness still byte-identical (62
BOCs). Workspace typecheck: 9/9 green — desktop and mobile both rebuilt cleanly with the new
abstract methods.

### Tasks

-   [x] **L1.** `IKeychainService` extended with `setValue` / `getValue` / `deleteValue` /
        `deletePrefix`. Existing `setData/getData/removeData` untouched.
-   [x] **L2.** Platform impls land on desktop and mobile via three new abstract raw I/O methods on
        `BaseKeychainService`. Extension and web stay unimplemented (no impl class exists for
        either; spec was aspirational on this point).
-   [x] **L3.** Audit confirms no collision with the legacy `Wallet-<hexPubkey>` namespace.
-   [x] **L4.** 11 vitest unit tests in `packages/core/src/__tests__/base-keychain-service.test.ts`.

### Risk callouts

-   **Cross-platform divergence.** Desktop's keytar service name and mobile's SecureStorage id both
    end up as `Wallet-chain::<prefix>::<key>` because the prefix logic lives in
    `BaseKeychainService`, not per platform. No drift possible.
-   **Mnemonic exposure.** None — the prefixed API is for non-secret per-chain metadata and the test
    suite uses placeholder strings, not real mnemonics.
-   **Security check bypass.** The prefixed namespace explicitly bypasses `securityCheck()`. This is
    intentional but documented on the interface and the abstract raw methods. Any future caller that
    wants the legacy "prompt before reading" semantics must use `getData`, not `getValue`.

### Done when

-   [x] Two `IKeychainService` impls (desktop + mobile) expose the prefixed API; extension/web
        inherit the abstract contract for when a keychain is wired there.
-   [x] Round-trip test green (11/11, in `BaseKeychainService` against an in-memory subclass).
-   [x] No collisions with existing keychain consumers.
-   [x] Full core suite green (19/19 files, 286 tests); snapshot harness byte-identical (62 BOCs);
        workspace typecheck 9/9 green.

---

## Track O — Registry wiring for multichain account type ✅

**Depends on:** I, K. Builds on Phase 1 Tracks B (signer registry) and C (wallet-contract registry).
**Touches:** `packages/core/src/service/sign/strategies/`,
`packages/core/src/service/wallet/contracts/`.

### Goal

Register `(accountType: 'multichain', chain: <each>)` entries with the signer factory and extend the
wallet-contract registry so `AccountMultichain` can produce wallet contracts / addresses for TON.
Write paths (signing) stay as `NotImplementedError` per the Phase 2 exit criterion — only the read
paths (deriveAddress, contract construction) are wired.

### Tasks

-   [x] **O1.** TON strategy for multichain accounts: register `('multichain', 'ton')` against the
        signer registry pointing at a new strategy module `strategies/ton/multichain-ton-signer.ts`.
        The body is structurally identical to `mnemonic-ton-signer.ts` but pulls the secret from the
        multichain account's BIP39 seed (not from a legacy mnemonic field). Snapshot-harness this
        strategy: add a new fixture `multichain-ton__V*__*.json` to verify byte-identity against
        `mnemonic-bip39` (same derivation, same KDF — should produce identical signatures).
-   [x] **O2.** EVM / BTC / TRON / SOL strategies registered with **NotImplementedError** bodies.
        The registry already throws "Phase 2+" for unregistered pairs; explicit registration makes
        the phase-pointer message more precise: `'Multichain ${chain} signing lands in Phase 4'`.
-   [x] **O3.** Wallet-contract strategy: TON branch already works via Phase 1 Track C and accepts
        `(publicKey, version, network)`. Multichain accounts call into the same `getStrategy('ton')`
        — no new TON strategy needed. The non-TON strategies remain `NotImplementedError` per Phase
        1 Track C's exit state.
-   [x] **O4.** Update Phase 1 Track E's `selectActiveWalletForChain` selector
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

### Done summary

-   **O1 (TON signer + snapshot harness).** New
    `service/sign/strategies/ton/multichain-ton-signer.ts` mirrors `mnemonicLikeTonSigner` but
    hardcodes BIP39 derivation (no `mnemonicType` field on `AccountMultichain`). Registered via
    `('multichain', 'ton')` in `strategies/ton/index.ts`. `getSecretAndPassword` widened to accept
    `account.type === 'multichain'` alongside the existing `isMnemonicAndPassword` predicate — that
    predicate stays untouched (its other call sites gate legacy editing flows that aren't safe for
    multichain). Snapshot harness gains the `'multichain-ton'` fixture kind plus 10 pinned files
    (`multichain-ton__V{3R1,3R2,4R2,5_BETA,5R1}__{MAINNET,TESTNET}.json`). All 10 are byte-identical
    to their `mnemonic-bip39__*` counterparts at the pinned wallet versions × networks — verified
    both by the generic harness assertion (each combo matches its own saved file) and by a paired
    `multichain TON ≡ mnemonic-bip39` describe block that asserts publicKeyHex / address /
    transferBocBase64 cross-equality per (version, network). Harness writer bumped to 4-space indent
    to match the legacy fixture formatting so future `UPDATE_SNAPSHOTS=1` runs don't churn the
    on-disk files.
-   **O2 (non-TON stubs).** `service/sign/strategies/multichain-stubs.ts` registers
    `('multichain', 'evm'|'btc'|'tron'|'sol')` against a phase-4 stub factory that throws
    `'Multichain ${chain} signing lands in Phase 4'` on invocation. More precise than the registry's
    generic `"…other chains in Phase 2+"` fallback. Aggregator hook added to `factory.ts` next to
    `registerTonStrategies()`. Unit-tested via the new
    `strategies/__tests__/multichain-stubs.test.ts`.
-   **O3 (wallet-contract registry).** No code change needed. The Phase 1 wallet-contract registry
    keys strategies by `chain`, not by `(account.type, chain)`. Multichain accounts that need a TON
    contract call `getStrategy('ton').create({ publicKey, version, network })` — identical to every
    other account type. Confirmed by inspection; the existing
    `service/wallet/contracts/__tests__/registry.test.ts` already exercises this path.
-   **O4 (selector).** Already landed when Track I shipped `account.getWalletByChain(chain)` —
    `chains/wallet-selector.ts` was updated at the same time. `selectActiveWalletForChain` already
    dispatches on `account.type === 'multichain'` and `chains/__tests__/wallet-selector.test.ts`
    already covers the multichain branch end-to-end (5-chain `it.each` + a partial case where a
    chain is enabled but has no active wallet id). `useActiveWalletForChain` in
    `uikit/src/state/wallet.ts` resolves the active account internally and forwards into the pure
    selector — no signature change leaked to callers.

### Gates

-   `@tonkeeper/core`: 20/20 files, 310/310 tests. Snapshot harness covers 82 cases (62 legacy + 10
    new multichain-ton combo files + 10 multichain ↔ mnemonic-bip39 equivalence assertions); every
    legacy fixture is byte-identical to its pre-track state (`git diff` shows no churn outside the
    new `multichain-ton__*.json` files and the harness/test additions).
-   `yarn turbo typecheck`: 9/9 green.

### Cleanup sweep

-   Removed the one `Track O1` pointer in `strategies/multichain-stubs.ts`. Other `Phase 4` /
    `Phase 2+` mentions in that file (and in the stub test) are intentional content — they describe
    or assert the actual runtime error message, not a future-work pointer, and stay per the cleanup
    rule's "general-idea" carve-out.

---

## Track Q — Tailwind setup + design-token bridge ✅

**Status:** Done (2026-05-27).

**Done summary:** Tailwind v3.4.17 installed in `packages/uikit` (PostCSS pipeline runs in consuming
apps, not in uikit's `tsc` build). `tailwind.config.ts` anchors `content` globs via `__dirname` so
Vite (web/mobile/extension) and webpack (desktop) both scan uikit + each app's `src/**`. Theme
bridge: `theme.extend.colors` and `borderRadius` resolve every styled-components token to a CSS
custom property (`bg-textPrimary` → `var(--tk-text-primary)`); `tailwindBridge.ts` rewrites those
CSS variables on `:root` from `UserThemeProvider` whenever the active theme changes, so Tailwind
utilities and styled-components render the same color under any active theme. No `darkMode` config —
both available themes (`dark`, `pro`) are dark, so the `dark:` variant would be a no-op; theme
switching happens through the CSS-variable rewrite. Each of the four target apps (web / mobile /
desktop / extension) has its own `postcss.config.cjs` pointing at
`../../packages/uikit/tailwind.config.ts`, imports `@tonkeeper/uikit/dist/styles/tailwind.css` from
its renderer entry, and ships tailwindcss/postcss/autoprefixer in devDeps (desktop also adds
`postcss-loader` to its webpack CSS rule chain). TWA is skipped per memory. `WalletName.tsx` is the
Q6 canonical-example port — two styled-components refs replaced with utility classes;
`Body1`/`Body2` swap driven by a `text-body1` / `text-body2` custom font size keyed off
`theme.displayType`. ESLint override (`.eslintrc.js`) makes `styled-components` imports under
`packages/uikit/src/multichain/**` an error via `no-restricted-imports`. Web CSS bundle came in at
11,372 B raw / 2,995 B gzipped — well under the 20KB target. Desktop's `style-loader` inlines CSS
into the renderer JS bundle (verified by grep for `--tk-text-primary` and `text-body1` in the built
`index.js`). CONTRIBUTING.md gained a "Styling: Tailwind + styled-components" section covering the
design-token bridge, theme variants, and the style-precedence pitfall (Tailwind loads at bundle
time, styled-components injects at runtime — runtime wins, important to know when chasing
partial-migration bugs). All 8 subtasks (Q1–Q8) done; full workspace typecheck green (9/9). Single
commit on `feature/multichain_pt2`: `1cd2fa54 init tailwind`.

**Depends on:** nothing structurally — can land any time before M starts. **Touches:**
`packages/uikit/package.json`, new `packages/uikit/tailwind.config.ts`, new
`packages/uikit/src/styles/tailwind.css`, each app's CSS entry + PostCSS config (web / mobile /
desktop / extension), `.eslintrc` for the new-code lint rule.

### Goal

Stand up Tailwind as the styling system for new multichain UI surfaces and for any legacy component
edited during Phase 2 redesign work. The rule is opportunistic migration (per invariant #6): any
component changed in service of Tracks M/N/P gets ported in the same PR; everything else stays
styled-components. Two design systems coexist for the duration of Phase 2 — the design-token bridge
in Q2 is what keeps them visually consistent.

### Decisions baked in

-   **Tailwind v3.x**, not v4. v4 is still cutting changes in plugin/theme APIs that affect
    component libs; v3 is the stable target for React component libraries today. Re-evaluate at
    Phase 5.
-   **`darkMode: 'class'`** paired with the existing theme provider's root class toggle — cleanest
    bridge to the live light/dark system.
-   **Tailwind lives in `packages/uikit`**, not per-app, so design tokens are defined once and every
    consumer app gets the same setup. Apps add a single CSS import + PostCSS config.

### Tasks

-   [x] **Q1.** Install Tailwind v3 in `packages/uikit`: add `tailwindcss`, `postcss`,
        `autoprefixer` to `devDependencies`. Confirm peer-dep compatibility with the existing build
        toolchain (uikit ships as `dist/` from `tsc`; Tailwind's PostCSS pipeline runs in the
        consuming apps, not in uikit's compile step).
-   [x] **Q2.** `packages/uikit/tailwind.config.ts`:
        `content: ['<uikit src glob>', '<apps src globs>']`; `theme.extend` populated from the
        existing `theme` object (`packages/uikit/src/styles/defaultTheme.ts` and friends) — colors,
        spacing scale, font family, border radii, shadows. This is the canonical bridge: a Tailwind
        component and a styled-components component sitting side-by-side must render byte-identical
        pixels.
-   [x] **Q3.** `packages/uikit/src/styles/tailwind.css` with
        `@tailwind base; @tailwind components; @tailwind utilities;` plus `@layer base` overrides
        matching the existing global styles (font smoothing, scrollbar styling, etc.). This file is
        what each app imports.
-   [x] **Q4.** Per-app build wiring:
    -   **Web** + **mobile**: add `postcss.config.cjs` at the app root with `tailwindcss` +
        `autoprefixer` plugins. Vite auto-detects PostCSS. Import `tailwind.css` from the app's root
        CSS entry.
    -   **Extension**: webpack's `css-loader` chain already supports PostCSS — confirm
        `postcss-loader` is wired or add it. Same CSS import.
    -   **Desktop**: electron-forge's webpack config — same PostCSS check, same import.
    -   **TWA**: skip (project memory `project_twa_unsupported`).
-   [x] **Q5.** Dark-mode parity: hook Tailwind's `dark:` variants to the existing theme provider's
        light/dark class on `<html>` or root container. Document the pattern in
        `packages/uikit/CONTRIBUTING.md` (or wherever uikit's contributor docs live).
-   [x] **Q6.** Canonical-example migration: pick the simplest styled-components component in the
        Phase 2 touchset — `WalletName.tsx` (2 styled refs, mostly an input wrapper) is the
        candidate — and port it end-to-end. The diff serves as the migration recipe for
        higher-effort components later in M/N/P.
-   [x] **Q7.** Lint rule: ESLint warns (error in CI) on `import .* from 'styled-components'` in
        files matching `packages/uikit/src/multichain/**`. Legacy paths unaffected. Mechanism:
        `no-restricted-imports` with a `patterns` override scoped via an `overrides` block in
        `.eslintrc`.
-   [x] **Q8.** Production-build size check: run `yarn build:web` + `yarn build:desktop` with and
        without Q1-Q5 applied; record CSS bundle delta per app. Target: <20KB gzipped added. If a
        misconfigured `content` glob ships full Tailwind (~3MB raw), it'll be obvious here.

### Risk callouts

-   **Theme drift.** Q2's token bridge must cover every value the styled-components theme exposes —
    miss one and Tailwind components look subtly wrong next to styled siblings. Audit
    `defaultTheme.ts` (and any dark theme override) line-by-line; don't paste a "starter" Tailwind
    theme.
-   **Style precedence with partial migrations.** During M/N/P, a screen will have Tailwind and
    styled-components on adjacent elements. Tailwind's CSS loads at bundle time; styled-components
    injects at runtime — runtime wins. Document this so a developer chasing a "Tailwind class isn't
    applying" bug knows to check for a styled-components override on a parent.
-   **Bundle bloat from loose `content` glob.** A glob like `**/*.tsx` that catches stuff outside
    `src/` will balloon the CSS. Pin `content` to specific `src/` paths and verify with the Q8 size
    check.
-   **Cross-app PostCSS divergence.** Each of the 4 target apps has its own bundler config. A plugin
    missing in one app means Tailwind silently no-ops there. Q4 must verify Tailwind classes
    actually compile in each app's prod build, not just dev.
-   **Scope creep.** Invariant #6 forbids "migrate component X" PRs without a multichain change.
    Track Q itself ships the foundation + Q6 example only. Resist the urge to port unrelated
    components even when the diff would be small.

### Done when

-   Tailwind v3 installed in `packages/uikit`; config and base CSS land in source.
-   Each of the 4 target apps loads Tailwind through PostCSS and renders the Q6 example correctly in
    a dev build.
-   Q6 example renders pixel-equivalent to its styled-components original (visual diff verified by
    eye against the dev build of the relevant onboarding screen).
-   ESLint rule rejects `styled-components` imports inside `packages/uikit/src/multichain/**`.
-   Bundle-size delta documented per app; under 20KB gzipped added.
-   Dark-mode toggle works on Tailwind classes via the existing theme provider's root class.

---

## Track M — Create-multichain-wallet flow — SERVICE SHIPPED, UI REVERTED → Phase 3 Track S

> **UI reverted (2026-05-27).** The create-flow **UI** (the `packages/uikit/src/multichain/create/`
> screens, the `useCreateAccountMultichain` hook, the `AddWallet`/`AddWalletNotificationControlled`
> wiring, the `'create-multichain'` `addWalletMethod` entry, and the multichain locale keys) was
> reverted from the working tree so the create UI is rebuilt on the Phase 3 refactored library — see
> **`MULTICHAIN_PHASE_3_TASKS.md` Track S**. What **stayed** (the non-UI foundation, tested and
> green): `multichainCreateService` (`createAccountMultichainByMnemonic`, `previewTonAddress`,
> `deriveNonTonMultichainWallets`), `generateBip39Mnemonic`, and the adapter `derivePublicKey`
> extension. The Done summary below describes the original (now reverted) UI for reference.

**Status:** Service shipped (2026-05-27); UI reverted to Phase 3 Track S.

**Done summary (UI portion reverted — kept for reference):** Multichain create flow lived under
`packages/uikit/src/multichain/create/` — Tailwind-only, gated behind
`useAppContext().multichainEnabled`. Five-step state machine (intro → words → check → chains →
address preview → final). BIP39 generation routed through a new `generateBip39Mnemonic(12|24)`
helper in `packages/core/src/service/mnemonicService.ts` so uikit doesn't pick up `bip39` as a
direct dep — only `@tonkeeper/core` does. The 24-word default matches the legacy TON-standard flow's
entropy; a 12-word toggle is one-tap from the words step. Words display + 3-position quiz forked to
`multichain/create/Words.tsx` (Tailwind, BIP39-aware, no MAM/TRON callouts) rather than
ported-in-place — the legacy `components/create/Words.tsx` is shared by 5 callers (CreateStandard,
CreateMAM, ImportExisting, ImportTestnet, Recovery) and the risk-callout fork strategy applies.
Legacy file byte-and-bit untouched (`git diff` confirmed). Chain-selection step: TON force-enabled
with a tooltip "TON is always enabled on a multichain wallet"; SOL defaults off (Track K5 fallback —
chain-kit has no Solana module today, so derivation would throw); all others default on. Address
preview calls `await ensureReady()` then iterates through
`getAdapter(chain).deriveAddress({mnemonic})` per selected chain — TON goes through a new
`previewTonAddress()` helper that resolves the version-aware address via the existing
`getWalletAddress(publicKey, defaultWalletVersion, MAINNET)` path. Save: encrypt the BIP39 mnemonic
via `encryptWalletSecret`, build the account through the new
`createAccountMultichainByMnemonic(...)` service (bridges the legacy
`createStandardTonAccount- ByMnemonic` for TON wallet construction with chain-kit-derived
`EvmWallet`/`BtcWallet`/ `MultichainTronWallet`/`SolWallet` entries), then activate. Chain-kit gaps
are swallowed: a selected chain whose adapter throws is dropped from `enabledChains` +
`activeWalletByChain` rather than failing the whole flow.

Adapter surface gained a symmetric `derivePublicKey({mnemonic}): Promise<string>` method alongside
`deriveAddress` — chain-kit's `CryptoWallet.getPublicKeyHex(chain)` per chain. The multichain create
service uses both. TON and SOL still throw `NotImplementedError` from `derivePublicKey` (TON via
`bip39MnemonicToEd25519Seed` separately; SOL not shipped). Existing `useCreateAccountMnemonic` path
was duplicated as `useCreateAccountMultichain` (different account type, different secret pathway —
keychain vs password — same mutation shape).

Wiring: `AddWalletMethod` enum extended with `'create-multichain'`;
`AddWalletNotificationControlled.tsx` handles the new case; `AddWallet.tsx` picker shows the entry
behind `multichainEnabled` with a "Beta" badge and the `add_wallet_modal_multichain_*` copy.
Locales: 18 new keys in `packages/locales/src/tonkeeper-web/en.json` (titles, captions, chain
labels, save button, TON-required tooltip, "Not available" fallback) — other languages backfilled by
localization team before flag flip per the plan. 9/9 typecheck green; 20/20 core test files (310/310
tests) pass including the 62-BOC snapshot harness — the multichain create service routes TON through
the legacy `createStandardTonAccountByMnemonic`, so the signing-strategy registry is untouched and
the harness output is byte-identical.

**Depends on:** I, J, K, L, O, Q. Behind `multichainEnabled`. **Touches:** new
`packages/uikit/src/multichain/create/` directory (Tailwind from day one), each app's onboarding
routing. Existing components in `packages/uikit/src/components/create/` that are reused (e.g., the
word-quiz `Words.tsx`) get ported to Tailwind in this track per invariant #6.

### Goal

A user with `multichainEnabled = true` can:

1. Tap "Create multichain wallet".
2. See a BIP39 phrase (12 words by default; 24 advanced).
3. Confirm backup via the existing word-quiz UX.
4. See per-chain enable toggles (TON forced on per Track I3).
5. See the derived addresses for each enabled chain.
6. Save the account.

### Tasks

-   [x] **M1.** New entry point in onboarding: `CreateMultichainWalletPage` lives under
        `packages/uikit/src/multichain/create/` and is **Tailwind from day one** (Track Q
        invariant). Surfaced in onboarding/create routes **only** when
        `useAppContext().multichainEnabled`. Phase 1 Track F made the flag required and
        false-everywhere; Phase 2 is the first consumer.
-   [x] **M2.** BIP39 mnemonic generation. 12-word default with a "24-word" advanced toggle. Use
        `bip39.generateMnemonic(128|256)` — already a dep.
-   [x] **M3.** Backup confirmation: reuse the existing word-quiz component
        (`packages/uikit/src/components/create/Words.tsx` — 13 styled-components refs; this is the
        biggest reused component in M). Per invariant #6, port it to Tailwind in the same PR. It's
        mnemonic-agnostic, which keeps the migration mechanical.
-   [x] **M4.** Chain selection step: list `CHAIN_IDS` with toggles. TON is force-enabled (Track I3
        invariant). Default: TON + EVM + BTC + TRON on; SOL off if chain-kit hasn't shipped SOL yet
        (per Track K5 fallback). User can opt chains in/out before final save.
-   [x] **M5.** Address preview step: for each selected chain, call
        `getAdapter(chain).deriveAddress({...})` and render the address. This is the user-facing
        proof Phase 2 works.
-   [x] **M6.** Save: encrypt the BIP39 mnemonic via the existing encrypted-secret pattern
        (`encryptWalletSecret`), construct `AccountMultichain`, write through `IAccountsStorage`,
        set as active account.
-   [x] **M7.** Localization: every new string lands in `packages/locales` source files. Plan for
        ~30–40 new strings. **Required before flag flip**, not before merge.
-   [x] **M8.** Migration audit: for each reused legacy component in this track (M3's `Words.tsx`,
        and any helpers it pulls in like `MnemonicCheckBox` / display tiles), confirm the
        Tailwind-ported version renders pixel-equivalent to the styled-components original in the
        existing legacy create flow. The legacy flow still uses the original components elsewhere —
        if they ship from `Words.tsx` directly, fork or refactor to keep both call sites rendering
        identically. Don't break the legacy onboarding by mutating shared components in place.

### Risk callouts

-   **TON forced-enabled UX.** The toggle for `'ton'` must be visually disabled with a tooltip
    explaining "TON is required" — silently auto-enabling without UI feedback is worse than
    explicit. The Track I3 decision (TON required for v1) is what makes this clean.
-   **Mnemonic exposure window.** BIP39 phrase shown in plaintext during backup. Reuse the existing
    TON-mnemonic display component's screenshot-blocking / blur-on-blur behaviour. Don't reinvent.
-   **WASM warm-up.** `getAdapter(chain).deriveAddress(...)` may require `await ensureReady()`
    (chain-kit WASM load). Show a loading state on the address preview step; first-time load can be
    ~1s.
-   **Shared-component migration risk.** M3's `Words.tsx` and any helper components it pulls in are
    used by the _legacy_ create flow too (`CreateStandardWallet.tsx`, `CreateMAMWallet.tsx`, etc.).
    Porting them to Tailwind without breaking the legacy flow is the highest-risk part of this
    track. Safer: fork into `multichain/create/Words.tsx` (Tailwind) and leave the legacy
    `components/create/Words.tsx` (styled) intact. Refactor to a single shared component in Phase 3
    if it becomes worth the cleanup.

### Done when

-   Dev build with `VITE_MULTICHAIN_ENABLED=true` (web/mobile) or constant flip (desktop/extension)
    reaches a "Create multichain wallet" entry from onboarding.
-   Completed flow produces an `AccountMultichain` with derived addresses for all enabled chains.
-   No production callers — flag is `false` in prod, so the entry point is hidden.
-   Every new file in `multichain/create/` uses Tailwind (lint rule Q7 enforces this). Reused legacy
    components either ported to Tailwind in-place (with legacy callers verified intact) or forked
    into `multichain/create/` per the risk-callout fork strategy.
-   Legacy create flow (`CreateStandardWallet`, `CreateMAMWallet`, etc.) renders pixel-equivalent to
    Phase 1 — manual smoke confirms no regression from shared-component edits.

---

## Track N — Import-multichain-wallet flow (UI) → MOVED TO PHASE 3

> **Moved to Phase 3 (2026-05-27).** Import is UI-heavy and builds on the same screens the Phase 3
> UI-library refactor reworks, so it lands after that refactor. Two findings from the Phase 2 wrap,
> carried forward:
>
> -   **N1 routing is not cleanly non-UI.** Import detection is multi-valued — a 24-word phrase can
>     be valid as MAM _and_ TON-standard _and_ BIP39 at once (MAM roots are a subset of
>     TON-standard), and the legacy flow disambiguates via on-chain balance lookups +
>     existing-account checks + a user choice (`SelectMnemonicType`). A single-valued router would
>     misroute every MAM root. The only genuinely-new Phase 2 logic (BIP39 → `AccountMultichain`
>     default + "Import as TON-only" escape hatch) is inseparable from that UI, so it moves
>     wholesale to Phase 3.
> -   **N3 is blocked on chain-kit.** `CryptoWallet.getAddress(chain)` takes no derivation-path
>     argument, so a per-chain path override would be a no-op. Chain-kit has a `Derivation.Path`
>     type but no path-aware wallet-from-mnemonic surface yet. Revisit when it ships.

**Depends on:** M (reuses most pieces) + Phase 3 UI-library refactor. Behind `multichainEnabled`.
**Touches:** new `packages/uikit/src/multichain/import/` directory (Tailwind), the
BIP39-vs-TON-standard-vs-MAM disambiguation logic in `mnemonicService.ts`. Reused legacy components
from `packages/uikit/src/pages/import/` get the same fork-or-port treatment as Track M.

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
-   **Tailwind / styled-components hybrid screens.** The import disambiguation step renders the
    "Import as TON-only (legacy BIP39)" escape hatch, which routes back into the _legacy_
    styled-components import flow. The wrapper screen is new (Tailwind); the destination screen is
    legacy (styled). Verify visual continuity at the handoff so the transition doesn't look like a
    different app.

### Done when

-   Dev build with flag on routes BIP39 import to `AccountMultichain` by default.
-   "Import as TON-only" path produces `AccountTonMnemonic` (legacy) byte-identically.
-   Non-canonical derivation-path overrides accepted per chain.

---

## Track P — Address display + dev demo screen → MOVED TO PHASE 3

> **Moved to Phase 3 (2026-05-27).** This was the Phase 2 exit demo (view a created account's
> per-chain addresses). It's entirely UI and overlaps the Phase 3 read-path work (wallet header,
> Receive wiring), so it lands in Phase 3 after the UI-library refactor rather than as a throwaway
> Phase 2 demo screen. The Phase 2 create flow already previews per-chain addresses before save
> (Track M5), which covers the "proof the derivation works" need without a post-create screen.

**Depends on:** M, N + Phase 3 UI-library refactor. Behind `multichainEnabled`. **Touches:** new
`packages/uikit/src/multichain/wallet/` directory (Tailwind) for the multichain header and
address-list components; minimal taps into `packages/uikit/src/pages/wallet/` to gate legacy
sub-screens behind the multichain check (gate-only edits, no full rewrites — those gated screens
stay styled-components until Phase 3 redesigns them).

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
-   **Gate-only edits stay styled-components.** P4 wraps a lot of existing screens in
    `if (account.type === 'multichain') return <ComingSoon/>`. The wrapped legacy screens are _not_
    touched-for-redesign — they only get a gate. Per invariant #6 they stay styled-components.
    `<ComingSoon/>` itself is new and Tailwind.

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
6. **M12.5 — Tailwind foundation ready.** Track Q complete: Tailwind v3 installed in uikit, PostCSS
   wired in all 4 apps, design-token bridge live, canonical-example component (Q6) renders
   pixel-equivalent to its styled-components original, lint rule blocks styled imports in
   `multichain/**`, bundle-size delta under 20KB gzipped.
7. **M13 — Create service.** Track M's **service layer** complete and tested:
   `createAccountMultichainByMnemonic` builds an `AccountMultichain` from a BIP39 seed (TON + per-
   chain addresses), `previewTonAddress` resolves the version-aware TON address,
   `generateBip39- Mnemonic` + adapter `derivePublicKey` shipped. The create **UI** was reverted (→
   Phase 3 Track S).
8. **M14 — Phase 2 exit review (as wrapped).** Full app suite green on all 4 target apps with flag
   on _and_ off; legacy TRON code path verified intact; snapshot harness byte-identical; bundle-size
   delta documented and within the Phase 0 budget. No multichain UI ships. Sign-off before Phase 3.

**Moved to Phase 3** (all multichain UI): create flow (was Track M, UI reverted → Phase 3 Track S),
import flow (was Track N → Track T), address display (was Track P → Track U). Track M's service
foundation stayed in Phase 2; everything user-facing is built on the Phase 3 refactored library.

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
-   [ ] Create **service** verified by unit test: `createAccountMultichainByMnemonic` (seed →
        per-chain wallets → `AccountMultichain`) and `previewTonAddress`. The create UI + import +
        display all moved to Phase 3 (built on the refactored library).
-   [ ] Production build with flag off: zero user-visible changes — every multichain entry point is
        hidden; legacy onboarding paths are byte-identical to Phase 1.
-   [ ] **Legacy TRON path verified intact.** Manual smoke: log in with an `AccountTonMnemonic` that
        has a legacy `tronWallet`, confirm the TRON tab in Receive shows the same address as Phase
        1; confirm no Phase 2 code path is reachable for the legacy account.
-   [ ] Bundle-size delta per app documented and within Phase 0 budget. Extension and mobile
        (WASM-heavy) are highest-risk. CSS-side delta from Tailwind under 20KB gzipped per app
        (separate line item — WASM and CSS measured separately).
-   [ ] No multichain locale keys in `packages/locales` (all multichain UI — create/import/display —
        lands with its screens in Phase 3; create keys were reverted with the UI).
-   [ ] Tailwind foundation in place: PostCSS configured per app, design-token bridge covers every
        token in the styled-components theme, lint rule rejects `styled-components` imports under
        `packages/uikit/src/multichain/**`.
-   [ ] **Legacy onboarding pixel-parity check.** Manual smoke of `CreateStandardWallet`,
        `CreateMAMWallet`, `ImportExistingWallet`, `ImportTestnetWallet`, `CreateLedgerWallet`,
        `CreateKeystoneWallet`, `CreateSignerWallet`, `CreateWatchOnlyWallet`, `ImportBySKWallet`,
        `Subscribe`, `Password` — every legacy onboarding screen renders pixel-equivalent to
        Phase 1. This is the gate against shared-component edits leaking into legacy flows.
-   [ ] All Phase 2 new UI lives under `packages/uikit/src/multichain/` and is 100% Tailwind. No new
        styled-components in this directory.

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
-   **Codebase-wide Tailwind migration.** Track Q sets up Tailwind and Tracks M/N/P port what they
    touch. Everything Phase 2 doesn't touch — settings pages, browser tab, send/receive history,
    dashboards, dapp connection screens, the activity feed, etc. — stays styled-components. Bulk
    migration of unrelated components is a future redesign phase, not Phase 2.
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
