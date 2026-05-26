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

**Redesign scope:** Phase 2 ships new UI surfaces (create, import, address display) **and** is the
introduction point for Tailwind as the styling system going forward. Track Q below sets up the
foundation; Tracks M/N/P build new screens in Tailwind from the start. Any legacy component edited
in service of M/N/P gets ported from styled-components to Tailwind in the same PR — opportunistic
migration, not a codebase-wide rewrite. Everything Phase 2 does not touch stays styled-components
until a future redesign covers it.

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
  Q. Tailwind setup + token bridge← blocks M/N/P; cross-platform CSS wiring
            │
  M. Create-multichain flow (UI)  ← needs I/J/K/L/O/Q
            │
  N. Import-multichain flow (UI)  ← needs M (reuses pieces)
            │
  P. Address display + dev demo   ← needs M/N — proves Phase 2 exit
```

**Exceptions:** L (IKeychainService) is cross-cutting and platform-touching — can slot in earlier if
a context-switch is convenient (it has no dependency on H/I/J/K). K can move ahead of I/J if
chain-kit's address-derivation surface is what's blocking design choices on the variant's shape. Q
(Tailwind) has no dependency on H/I/J/K/L/O — it can land at any point before M starts; doing it
earlier lets the developer prototype designs against a real Tailwind setup while back-end tracks
finish. But H → I → J → O must stay in that order: each layer builds on the previous one's types or
storage schema.

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

- [x] **H1.** Defined `EvmWallet`, `BtcWallet`, `SolWallet`, `MultichainTronWallet` in per-chain
      files under `packages/core/src/entries/{evm,btc,sol}/<chain>-wallet.ts` and
      `entries/tron/multichain-tron-wallet.ts`. Each carries `id`, `chain` discriminator,
      `rawAddress`, `publicKey`, `derivationPath`. Legacy `entries/tron/tron-wallet.ts` is
      untouched.
- [x] **H2.**
      `MultichainWallet = TonWalletStandard | EvmWallet | BtcWallet | MultichainTronWallet | SolWallet`
      exported from `entries/wallet.ts`. `TonWalletStandard` keeps implicit narrowing via
      `isStandardTonWallet` (`'version' in wallet && 'publicKey' in wallet`). Legacy `TronWallet`
      deliberately _not_ in the union — it lives on `DerivationItem.tronWallet?:`, not on
      `AccountMultichain.wallets[]`.
- [x] **H3.** Added `derivationPath?: string` to `TonWalletStandard`. JSON round-trip verified in
      tests for both legacy (absent) and multichain (present) shapes.
- [x] **H4.** All four chain helpers symmetric:
      `isEvmWallet`/`isBtcWallet`/`isSolWallet`/`isTronWallet` each narrow via
      `wallet.chain === '<chain>'`. No shape-detection asymmetry.
- [x] **H5.** `entries/__tests__/wallet.test.ts` (13 tests): per-helper fixture matching, exhaustive
      narrowing (every shape lands in exactly one branch), `TonWalletStandard` JSON round-trip in
      both shapes, legacy → Phase 2 read.

### Risk callouts

- **TonWalletStandard discriminator gap.** Existing code branches on `'version' in wallet` — don't
  add a `chain: 'ton'` field that breaks that narrowing. Either keep the implicit narrowing or add
  `chain` as `'ton' | undefined` with downstream consumers updated.
- **Legacy `TronWallet` is byte-and-bit untouched.** The original MD said the legacy type at
  `packages/core/src/entries/tron/tron-wallet.ts` would be _the_ TRON wallet type for both legacy
  and multichain accounts. Implementation flipped that: legacy `TronWallet` (`{id, address}`) is a
  minimal bolt-on used only by `AccountTonMnemonic` / `AccountMAM` via `DerivationItem.tronWallet`,
  and `MultichainTronWallet` (`entries/tron/multichain-tron-wallet.ts`) is the sibling-symmetric
  chain-tagged entry used in `AccountMultichain.wallets[]`. The split keeps invariant #1 strict (no
  on-disk shape change for any legacy account) and lets all four chain helpers narrow on
  `chain === '<chain>'` symmetrically. TON does **not** get the same split — see the Goal section
  for the asymmetry.

### Done when

- `MultichainWallet` union exported from `packages/core/src/entries/wallet.ts`.
- Unit tests pass; 62-BOC snapshot harness still byte-identical (purely additive types).
- `yarn turbo typecheck` green on all 9 workspaces (TWA still excluded).
- No legacy account-type serialization changes.

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

- [x] **I1.** `AccountMultichain` class implementing `IAccountTonWalletStandard`. Constructor
      enforces the v1 TON-required invariant.
- [x] **I2.** `AccountMultichain` added to `AccountTonWalletStandard` (transitively to `Account`).
      `multichain: AccountMultichain.prototype` added to the prototypes map.
- [x] **I3.** `allTonWallets` / `activeTonWallet` getters. `activeTonWallet` is a total function
      (never `undefined`) thanks to the constructor invariant.
- [x] **I4.** `getWalletByChain(chain)` on the class + dispatcher routing in
      `selectActiveWalletForChain(account, chain)`. `WalletForChain<C>` widened to all five chains.
      `useActiveWalletForChain` hook updated to pass the account.
- [x] **I5.** Static `AccountMultichain.create(params)` factory for storage deserialization.
- [x] **I6.** Exhaustive-switch sites updated:
    - `packages/core/src/entries/account.ts` — predicates: `isAccountVersionEditable` (false),
      `isAccountTonWalletStandard` (true), `isAccountSupportTonConnect` (false, Phase 3+),
      `isAccountCanManageMultisigs` (false), `isMnemonicAndPassword` (false), `getNetworkByAccount`
      (MAINNET), `isAccountTronCompatible` (false — legacy channel only), `isAccountBip39` (true —
      multichain seed is BIP39 by construction).
    - `packages/core/src/entries/dashboard.ts` — multichain row renders version suffix when account
      has multiple TON wallets.
    - `packages/core/src/analytics/wallet-mapping.ts` — `toWalletSource` → `'mnemonic'`.
    - `packages/core/src/service/sign/strategies/ton/_shared.ts` —
      `AccountByType['multichain'] = AccountMultichain`.
    - `packages/uikit/src/state/mnemonic.ts` (two sites) — `signDataOver` and `signTonConnectOver`
      throw `'Phase 3+: <method> not wired for multichain accounts'`.
    - `packages/uikit/src/desktop-pages/settings/DesktopManageWalletsSettings.tsx`,
      `packages/uikit/src/components/desktop/aside/AsideMenuAccount.tsx`,
      `packages/uikit/src/components/account/AccountBadge.tsx`,
      `packages/uikit/src/pages/settings/Version.tsx` — render `null` / `Navigate` until Track P
      designs multichain UI. Gated by `multichainEnabled` so no production users hit these paths in
      Phase 2.
    - `legacy-tron-signer.ts` and `getMultiPayloadSigner` were already inside
      `isAccountTronCompatible` guards that now exclude `'multichain'`, so no edit needed there.
- [x] **I7.** 25 unit tests in `entries/__tests__/account-multichain.test.ts` covering construction
      invariants, all `IAccountTonWalletStandard` methods, `getWalletByChain` for every chain, all
      seven Account predicates, and `clone()` prototype preservation. Plus 13 tests in
      `chains/__tests__/wallet-selector.test.ts` (legacy + multichain dispatch).

### Risk callouts

- **Pervasive `account.type` switches.** All seven `assertUnreachable(account)` sites were triaged
  and updated; plus three implicit-exhaustive sites discovered during typecheck (`Version.tsx`,
  `wallet-mapping.ts`, `_shared.ts`'s `AccountByType` map). Future `account.type` switches will
  surface as typecheck errors — that's the system working as designed.
- **Backwards-compatible storage.** Track J owns the storage round-trip test (J4). `account.ts`
  changes here are purely additive; existing account types stayed byte-identical, and the serialized
  form of `AccountMultichain` is new in Phase 2.
- **`activeTonWallet` getter and TON requirement.** Locked at construction time (`AccountMultichain`
  throws on bad input); Track M (creation flow) gets a runtime guard at user-facing entry to surface
  a friendly error rather than a thrown exception.

### Done when

- [x] `AccountMultichain` constructable, serializable shape stable.
- [x] All `account.type` switches compile and route the new variant either to a handler or to a
      clearly-marked "Phase 3+" throw.
- [x] Unit tests pass (254 / 254 in `@tonkeeper/core`); snapshot harness still green (62 BOCs
      byte-identical); 9/9 typechecks green.

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

- [ ] **J1.** Add `MULTICHAIN_CHAIN_CONFIG` to `AppKey` enum in `packages/core/src/Keys.ts`. Stores
      per-account chain-level preferences (which chains visible, jetton/ERC-20 hide lists, etc.).
      Defer the actual schema to Phase 3 when chain preferences become user-facing — Phase 2 just
      reserves the key.
- [ ] **J2.** Storage serializer / deserializer for `AccountMultichain`. The existing pattern in
      `accountsStorage.ts` uses a `type` discriminator on the stored object — extend that switch.
      Round-trip test: serialize → deserialize → deep-equal against original.
- [ ] **J3.** Add `MULTICHAIN_MIGRATION_STATE` as a **reserved** `AppKey` (no read/write code in
      Phase 2). Phase 4 implements the migration flow that uses it; reserving the key in Phase 2
      lets Phase 4 land without touching `Keys.ts` again.
- [ ] **J4.** Backwards-compat round-trip test: write a Phase 1 accounts snapshot to the storage
      layer, read through Phase 2 code, assert the deserialized account matches the original. Covers
      the H3 `derivationPath?: string` optional-field guarantee.

### Risk callouts

- **Storage corruption blast radius.** If `(de)serialize` has a bug that mangles legacy accounts,
  users lose access to their wallets. The backwards-compat test (J4) is the gate — do not merge
  without it. Cover at least one fixture per legacy account type.
- **Storage migration on read.** If you discover a Phase 2 schema needs a one-time write to upgrade
  legacy accounts, route it through the existing `StorageMigrationService` pattern
  (apps/mobile/src/libs/storage.ts:86-204) rather than ad-hoc in the deserializer.

### Done when

- `MULTICHAIN_CHAIN_CONFIG` and `MULTICHAIN_MIGRATION_STATE` reserved in `AppKey`.
- Multichain accounts persist and reload through `IStorage` round-trip.
- Legacy accounts unaffected — round-trip test green.

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

- [ ] **K1.** EVM derivation: BIP39 seed → secp256k1 keypair at `DEFAULT_BIP44_PATH.evm`
      (`m/44'/60'/0'/0/0`) → EIP-55 checksummed address. Use chain-kit's
      `CryptoWallet.fromMnemonic(...).getAddress(Chain.Ethereum.Mainnet)` if its surface is stable;
      otherwise an `ethers` HD walk (already a dep in `uikit`).
- [ ] **K2.** BTC derivation: BIP39 seed → secp256k1 keypair at `DEFAULT_BIP44_PATH.btc`
      (`m/84'/0'/0'/0/0`, BIP-84 native segwit) → bech32 address. chain-kit preferred.
- [ ] **K3.** TRON derivation (multichain path): BIP39 seed → secp256k1 keypair at
      `DEFAULT_BIP44_PATH.tron` (`m/44'/195'/0'/0/0`, canonical BIP-44) → base58 TRON address. **Do
      not touch** the legacy `tronWalletByTonMnemonic` path or its non-canonical `m/44'/195'/0'/0`
      (no terminal `/0`). Per invariant #1, legacy accounts continue to derive TRON via the existing
      code.
- [ ] **K4.** TON derivation for `AccountMultichain`: reuses the Phase 1
      `bip39MnemonicToEd25519Seed` helper at `pathFor('ton')` (Track D). Same code path as legacy
      `mnemonic-bip39` accounts — the snapshot harness already covers this byte-identically. No new
      code; just confirmation that the multichain account creation flow funnels through this helper.
- [ ] **K5.** SOL derivation (conditional on chain-kit Solana availability — see Phase 0 decision).
      If chain-kit ships SOL by Phase 2: ed25519-SLIP-0010 at `DEFAULT_BIP44_PATH.sol`
      (`m/44'/501'/0'/0'`) → base58 address. If not: leave the SOL branch throwing
      `NotImplementedError` and exclude `'sol'` from default `enabledChains` in the creation flow
      (Track M). Document the descope in the open questions section of this doc.
- [ ] **K6.** `ChainkitAdapter.deriveAddress` implementation: switch on `this.chain`, delegate to
      the per-chain helpers above. Update Phase 1's `chainkit-resolves.test.ts` (or a new test) to
      assert the canonical abandon×11+about BIP39 fixture produces a known address per chain
      (test-vector source: chain-kit's own integration tests, or BIP39 reference implementations).
- [ ] **K7.** Cross-chain reference fixtures: pin one expected address per chain in
      `packages/core/src/chains/__tests__/multichain-fixtures.test.ts`. These are the regression
      canary for any drift in derivation — analogous to Track D's `EXPECTED_TON_ PUBLIC_KEY_HEX`
      pin.

### Risk callouts

- **chain-kit surface stability.** The Phase 1 adapter wraps chain-kit's Kotlin/JS ergonomics behind
  `ChainAdapter`. If chain-kit's address-derivation API changes pre-1.0 (it's pre-alpha), the
  per-chain helpers absorb the impact — the adapter consumers don't see it.
- **TRON path divergence.** Pinning the multichain TRON path at canonical `m/44'/195'/0'/0/0` means
  a user who exports their multichain BIP39 seed and re-imports it into a _different_ wallet that
  uses non-canonical legacy `m/44'/195'/0'/0` will see a different TRON address. Document this in
  the import flow (Track N).
- **EVM checksumming.** EIP-55 checksumming is mandatory for `rawAddress`. Test the lowercase vs.
  mixed-case fixtures explicitly.

### Done when

- `getAdapter(chain).deriveAddress({ publicKey, opts })` returns canonical addresses for TON / EVM /
  BTC / TRON (and SOL if chain-kit ships it).
- Fixture test pins one expected address per chain against the canonical BIP39 vector.
- Snapshot harness still green; 9/9 typechecks green.

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

- [ ] **L1.** Extend `IKeychainService` with `getValue(prefix: string, key: string)` /
      `setValue(prefix, key, value)` / `deleteValue(prefix, key)` / `deletePrefix(prefix)`. Existing
      single-arg `getPassword(accountId)` etc. stay — Phase 2 adds an orthogonal namespace, not a
      replacement.
- [ ] **L2.** Platform impls prefix keys with the chain id (or any caller-supplied prefix) before
      delegating to the underlying store:
    - **Desktop** (`keytar`): service name becomes `${SERVICE}::${prefix}`.
    - **Extension** (`chrome.storage.local` or similar — confirm with existing code): key becomes
      `${prefix}::${key}`.
    - **Capacitor** (mobile): use the existing secure-storage plugin's prefix support, or mangle the
      key.
    - **Web** (browser): no real keychain — current implementation uses encrypted localStorage keyed
      by account. Mirror the prefix mangling.
- [ ] **L3.** Audit existing keychain consumers (`getMAMWalletMnemonic`,
      `createAndStoreMetaEncryptionKeys`, etc.) — confirm none collide with a `'ton:'` or `'evm:'`
      prefix in the new namespace. If any do, escape or migrate.
- [ ] **L4.** Platform-specific unit tests for round-tripping a chain-prefixed value on each of
      desktop / extension / mobile / web. The existing test setup per app can host these — no new
      test infrastructure needed.

### Risk callouts

- **Cross-platform divergence.** Each `IKeychainService` implementation handles the storage
  differently (keytar OS keychain on desktop, browser storage on extension/web, Capacitor plugin on
  mobile). The prefix mangling must be consistent so a user who logs in on multiple platforms
  (unlikely Phase 2 scenario but plausible long-term) gets the same data.
- **Sensitive data exposure.** Keychain is where mnemonics live. Any test that writes a real
  mnemonic to the device keychain must clean up on exit — use the throwaway fixture seed, never a
  real one.

### Done when

- All four platform `IKeychainService` impls expose the prefixed API.
- Round-trip test green on each platform.
- No collisions with existing keychain consumers.

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

- [ ] **O1.** TON strategy for multichain accounts: register `('multichain', 'ton')` against the
      signer registry pointing at a new strategy module `strategies/ton/multichain-ton-signer.ts`.
      The body is structurally identical to `mnemonic-ton-signer.ts` but pulls the secret from the
      multichain account's BIP39 seed (not from a legacy mnemonic field). Snapshot-harness this
      strategy: add a new fixture `multichain-ton__V*__*.json` to verify byte-identity against
      `mnemonic-bip39` (same derivation, same KDF — should produce identical signatures).
- [ ] **O2.** EVM / BTC / TRON / SOL strategies registered with **NotImplementedError** bodies. The
      registry already throws "Phase 2+" for unregistered pairs; explicit registration makes the
      phase-pointer message more precise: `'Multichain ${chain} signing lands in Phase 4'`.
- [ ] **O3.** Wallet-contract strategy: TON branch already works via Phase 1 Track C and accepts
      `(publicKey, version, network)`. Multichain accounts call into the same `getStrategy('ton')` —
      no new TON strategy needed. The non-TON strategies remain `NotImplementedError` per Phase 1
      Track C's exit state.
- [ ] **O4.** Update Phase 1 Track E's `selectActiveWalletForChain` selector
      (`packages/core/src/chains/wallet-selector.ts`) so it returns multichain wallets for
      `AccountMultichain` accounts:
    - For legacy accounts: unchanged (chain `'ton'` → `account.activeTonWallet`, else `undefined`).
    - For `account.type === 'multichain'`: dispatch to `account.getWalletByChain(chain)`. The
      selector signature changes — it now takes the full `Account` instead of just the active TON
      wallet — but the `useActiveWalletForChain` hook signature stays the same because the hook
      resolves the account internally. Update the unit tests under
      `chains/__tests__/wallet-selector.test.ts` for the new multichain branch.

### Risk callouts

- **O4 selector signature change.** Track E's selector takes `(activeTonWallet, chain)`. Phase 2
  needs the whole account to dispatch by `account.type`. Refactor carefully — the hook is the only
  caller; tests need updating in lock-step.
- **Multichain TON signature byte-identity.** O1 must be tested via the snapshot harness with a
  `multichain` fixture, not just deduced from "BIP39 + same path = same key". Pin actual BOCs in
  `__tests__/snapshots/sign/multichain-ton__V*__*.json`.

### Done when

- `getSigner({ accountId, chain: 'ton' })` works for `AccountMultichain` and produces byte-identical
  BOCs against the `multichain-ton` snapshot fixtures.
- `getSigner({ accountId, chain: 'evm'|'btc'|'tron'|'sol' })` throws the "Phase 4" error for
  multichain accounts.
- `useActiveWalletForChain` returns the correct per-chain wallet for multichain accounts.

---

## Track Q — Tailwind setup + design-token bridge

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

- **Tailwind v3.x**, not v4. v4 is still cutting changes in plugin/theme APIs that affect component
  libs; v3 is the stable target for React component libraries today. Re-evaluate at Phase 5.
- **`darkMode: 'class'`** paired with the existing theme provider's root class toggle — cleanest
  bridge to the live light/dark system.
- **Tailwind lives in `packages/uikit`**, not per-app, so design tokens are defined once and every
  consumer app gets the same setup. Apps add a single CSS import + PostCSS config.

### Tasks

- [ ] **Q1.** Install Tailwind v3 in `packages/uikit`: add `tailwindcss`, `postcss`, `autoprefixer`
      to `devDependencies`. Confirm peer-dep compatibility with the existing build toolchain (uikit
      ships as `dist/` from `tsc`; Tailwind's PostCSS pipeline runs in the consuming apps, not in
      uikit's compile step).
- [ ] **Q2.** `packages/uikit/tailwind.config.ts`:
      `content: ['<uikit src glob>', '<apps src globs>']`; `theme.extend` populated from the
      existing `theme` object (`packages/uikit/src/styles/defaultTheme.ts` and friends) — colors,
      spacing scale, font family, border radii, shadows. This is the canonical bridge: a Tailwind
      component and a styled-components component sitting side-by-side must render byte-identical
      pixels.
- [ ] **Q3.** `packages/uikit/src/styles/tailwind.css` with
      `@tailwind base; @tailwind components; @tailwind utilities;` plus `@layer base` overrides
      matching the existing global styles (font smoothing, scrollbar styling, etc.). This file is
      what each app imports.
- [ ] **Q4.** Per-app build wiring:
    - **Web** + **mobile**: add `postcss.config.cjs` at the app root with `tailwindcss` +
      `autoprefixer` plugins. Vite auto-detects PostCSS. Import `tailwind.css` from the app's root
      CSS entry.
    - **Extension**: webpack's `css-loader` chain already supports PostCSS — confirm
      `postcss-loader` is wired or add it. Same CSS import.
    - **Desktop**: electron-forge's webpack config — same PostCSS check, same import.
    - **TWA**: skip (project memory `project_twa_unsupported`).
- [ ] **Q5.** Dark-mode parity: hook Tailwind's `dark:` variants to the existing theme provider's
      light/dark class on `<html>` or root container. Document the pattern in
      `packages/uikit/CONTRIBUTING.md` (or wherever uikit's contributor docs live).
- [ ] **Q6.** Canonical-example migration: pick the simplest styled-components component in the
      Phase 2 touchset — `WalletName.tsx` (2 styled refs, mostly an input wrapper) is the candidate
      — and port it end-to-end. The diff serves as the migration recipe for higher-effort components
      later in M/N/P.
- [ ] **Q7.** Lint rule: ESLint warns (error in CI) on `import .* from 'styled-components'` in files
      matching `packages/uikit/src/multichain/**`. Legacy paths unaffected. Mechanism:
      `no-restricted-imports` with a `patterns` override scoped via an `overrides` block in
      `.eslintrc`.
- [ ] **Q8.** Production-build size check: run `yarn build:web` + `yarn build:desktop` with and
      without Q1-Q5 applied; record CSS bundle delta per app. Target: <20KB gzipped added. If a
      misconfigured `content` glob ships full Tailwind (~3MB raw), it'll be obvious here.

### Risk callouts

- **Theme drift.** Q2's token bridge must cover every value the styled-components theme exposes —
  miss one and Tailwind components look subtly wrong next to styled siblings. Audit
  `defaultTheme.ts` (and any dark theme override) line-by-line; don't paste a "starter" Tailwind
  theme.
- **Style precedence with partial migrations.** During M/N/P, a screen will have Tailwind and
  styled-components on adjacent elements. Tailwind's CSS loads at bundle time; styled-components
  injects at runtime — runtime wins. Document this so a developer chasing a "Tailwind class isn't
  applying" bug knows to check for a styled-components override on a parent.
- **Bundle bloat from loose `content` glob.** A glob like `**/*.tsx` that catches stuff outside
  `src/` will balloon the CSS. Pin `content` to specific `src/` paths and verify with the Q8 size
  check.
- **Cross-app PostCSS divergence.** Each of the 4 target apps has its own bundler config. A plugin
  missing in one app means Tailwind silently no-ops there. Q4 must verify Tailwind classes actually
  compile in each app's prod build, not just dev.
- **Scope creep.** Invariant #6 forbids "migrate component X" PRs without a multichain change. Track
  Q itself ships the foundation + Q6 example only. Resist the urge to port unrelated components even
  when the diff would be small.

### Done when

- Tailwind v3 installed in `packages/uikit`; config and base CSS land in source.
- Each of the 4 target apps loads Tailwind through PostCSS and renders the Q6 example correctly in a
  dev build.
- Q6 example renders pixel-equivalent to its styled-components original (visual diff verified by eye
  against the dev build of the relevant onboarding screen).
- ESLint rule rejects `styled-components` imports inside `packages/uikit/src/multichain/**`.
- Bundle-size delta documented per app; under 20KB gzipped added.
- Dark-mode toggle works on Tailwind classes via the existing theme provider's root class.

---

## Track M — Create-multichain-wallet flow (UI)

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

- [ ] **M1.** New entry point in onboarding: `CreateMultichainWalletPage` lives under
      `packages/uikit/src/multichain/create/` and is **Tailwind from day one** (Track Q invariant).
      Surfaced in onboarding/create routes **only** when `useAppContext().multichainEnabled`. Phase
      1 Track F made the flag required and false-everywhere; Phase 2 is the first consumer.
- [ ] **M2.** BIP39 mnemonic generation. 12-word default with a "24-word" advanced toggle. Use
      `bip39.generateMnemonic(128|256)` — already a dep.
- [ ] **M3.** Backup confirmation: reuse the existing word-quiz component
      (`packages/uikit/src/components/create/Words.tsx` — 13 styled-components refs; this is the
      biggest reused component in M). Per invariant #6, port it to Tailwind in the same PR. It's
      mnemonic-agnostic, which keeps the migration mechanical.
- [ ] **M4.** Chain selection step: list `CHAIN_IDS` with toggles. TON is force-enabled (Track I3
      invariant). Default: TON + EVM + BTC + TRON on; SOL off if chain-kit hasn't shipped SOL yet
      (per Track K5 fallback). User can opt chains in/out before final save.
- [ ] **M5.** Address preview step: for each selected chain, call
      `getAdapter(chain).deriveAddress({...})` and render the address. This is the user-facing proof
      Phase 2 works.
- [ ] **M6.** Save: encrypt the BIP39 mnemonic via the existing encrypted-secret pattern
      (`encryptWalletSecret`), construct `AccountMultichain`, write through `IAccountsStorage`, set
      as active account.
- [ ] **M7.** Localization: every new string lands in `packages/locales` source files. Plan for
      ~30–40 new strings. **Required before flag flip**, not before merge.
- [ ] **M8.** Migration audit: for each reused legacy component in this track (M3's `Words.tsx`, and
      any helpers it pulls in like `MnemonicCheckBox` / display tiles), confirm the Tailwind-ported
      version renders pixel-equivalent to the styled-components original in the existing legacy
      create flow. The legacy flow still uses the original components elsewhere — if they ship from
      `Words.tsx` directly, fork or refactor to keep both call sites rendering identically. Don't
      break the legacy onboarding by mutating shared components in place.

### Risk callouts

- **TON forced-enabled UX.** The toggle for `'ton'` must be visually disabled with a tooltip
  explaining "TON is required" — silently auto-enabling without UI feedback is worse than explicit.
  The Track I3 decision (TON required for v1) is what makes this clean.
- **Mnemonic exposure window.** BIP39 phrase shown in plaintext during backup. Reuse the existing
  TON-mnemonic display component's screenshot-blocking / blur-on-blur behaviour. Don't reinvent.
- **WASM warm-up.** `getAdapter(chain).deriveAddress(...)` may require `await ensureReady()`
  (chain-kit WASM load). Show a loading state on the address preview step; first-time load can be
  ~1s.
- **Shared-component migration risk.** M3's `Words.tsx` and any helper components it pulls in are
  used by the _legacy_ create flow too (`CreateStandardWallet.tsx`, `CreateMAMWallet.tsx`, etc.).
  Porting them to Tailwind without breaking the legacy flow is the highest-risk part of this track.
  Safer: fork into `multichain/create/Words.tsx` (Tailwind) and leave the legacy
  `components/create/Words.tsx` (styled) intact. Refactor to a single shared component in Phase 3 if
  it becomes worth the cleanup.

### Done when

- Dev build with `VITE_MULTICHAIN_ENABLED=true` (web/mobile) or constant flip (desktop/extension)
  reaches a "Create multichain wallet" entry from onboarding.
- Completed flow produces an `AccountMultichain` with derived addresses for all enabled chains.
- No production callers — flag is `false` in prod, so the entry point is hidden.
- Every new file in `multichain/create/` uses Tailwind (lint rule Q7 enforces this). Reused legacy
  components either ported to Tailwind in-place (with legacy callers verified intact) or forked into
  `multichain/create/` per the risk-callout fork strategy.
- Legacy create flow (`CreateStandardWallet`, `CreateMAMWallet`, etc.) renders pixel-equivalent to
  Phase 1 — manual smoke confirms no regression from shared-component edits.

---

## Track N — Import-multichain-wallet flow (UI)

**Depends on:** M (reuses most pieces). Behind `multichainEnabled`. **Touches:** new
`packages/uikit/src/multichain/import/` directory (Tailwind from day one), the
BIP39-vs-TON-standard-vs-MAM disambiguation logic in `mnemonicService.ts`. Reused legacy components
from `packages/uikit/src/pages/import/` get the same fork-or-port treatment as Track M.

### Goal

A user with `multichainEnabled = true` can paste a BIP39 phrase and end up with an
`AccountMultichain` (instead of an `AccountTonMnemonic` with `mnemonicType: 'bip39'`, which is how
Phase 1 and earlier route BIP39).

### Tasks

- [ ] **N1.** Detection: the existing `validateMnemonicTonOrMAM` / `validateBip39Mnemonic` helpers
      already disambiguate. Phase 2 adds a routing layer: TON-standard → `AccountTonMnemonic`
      (legacy, unchanged); MAM → `AccountMAM` (legacy, unchanged); BIP39 → branching choice:
    - `multichainEnabled === false`: BIP39 routes to `AccountTonMnemonic` with
      `mnemonicType: 'bip39'` (Phase 1 behavior, byte-identical).
    - `multichainEnabled === true`: BIP39 routes to `AccountMultichain` by default. Show an advanced
      option "Import as TON-only (legacy BIP39 wallet)" for users with paper-backup wallets that
      were created as TON-only BIP39 outside our app.
- [ ] **N2.** Chain-selection step on import: same UI as Track M, defaulted to all chains supported
      by chain-kit. User can opt chains out (e.g., privacy-conscious users who don't want a TRON
      address derived for their seed).
- [ ] **N3.** Optional derivation-path override per chain — advanced UI. Defaults to
      `DEFAULT_BIP44_PATH[chain]`. Letting users specify a non-canonical path is the only way a
      legacy hardware-wallet-derived BIP39 seed lands in our app with the expected addresses. Phase
      2 ships the _plumbing_ for the override; the UI can be a single textbox per chain behind an
      "Advanced" expander, no fancy validation beyond the regex `/^m(\/\d+'?)+$/`.
- [ ] **N4.** Save: same path as Track M6.

### Risk callouts

- **Ambiguous BIP39.** A BIP39 phrase could equally be a legacy `mnemonic-bip39` TON-only wallet or
  a multichain wallet — the seed itself doesn't tell you. The "Import as TON-only" escape hatch in
  N1 must be discoverable for users with legacy backups. `MULTICHAIN_PLAN.md` open-question #7
  settles on multichain-default with the escape hatch visible; honour that until product overrides
  it.
- **Non-canonical TRON path.** A user importing a BIP39 seed they originally created in another
  wallet that used the _non-canonical_ TRON path (`m/44'/195'/0'/0` — our legacy bolt-on uses this)
  will get a different TRON address by default. Surface this in the address-preview step's "Wrong
  TRON address?" copy with a link to the path override.
- **Tailwind / styled-components hybrid screens.** The import disambiguation step renders the
  "Import as TON-only (legacy BIP39)" escape hatch, which routes back into the _legacy_
  styled-components import flow. The wrapper screen is new (Tailwind); the destination screen is
  legacy (styled). Verify visual continuity at the handoff so the transition doesn't look like a
  different app.

### Done when

- Dev build with flag on routes BIP39 import to `AccountMultichain` by default.
- "Import as TON-only" path produces `AccountTonMnemonic` (legacy) byte-identically.
- Non-canonical derivation-path overrides accepted per chain.

---

## Track P — Address display + dev demo screen

**Depends on:** M, N. Behind `multichainEnabled`. **Touches:** new
`packages/uikit/src/multichain/wallet/` directory (Tailwind from day one) for the multichain header
and address-list components; minimal taps into `packages/uikit/src/pages/wallet/` to gate legacy
sub-screens behind the multichain check (gate-only edits, no full rewrites — those gated screens
stay styled-components until Phase 3 redesigns them).

### Goal

This track is the Phase 2 exit demo. After M / N, a developer can see their multichain account and
switch between chains to see addresses. UI sophistication is deliberately minimal — full multichain
UX is Phase 3 (read paths) and Phase 4 (write paths). Phase 2 just needs proof of life.

### Tasks

- [ ] **P1.** Minimal "Multichain wallet" header on the existing wallet page when
      `account.type === 'multichain'`. Shows the active chain's address. Switching chains is a
      dropdown / segmented control. No balances, no history (those are Phase 3).
- [ ] **P2.** "Show all addresses" debug action: lists every chain in `enabledChains` with its
      address. Copy-to-clipboard via the existing `useAppSdk().copyToClipboard()`.
- [ ] **P3.** Receive flow integration (read-only): the existing `ReceiveContent` already accepts
      `chain?: BLOCKCHAIN_NAME`. Wire the chain selector to use `useActiveWalletForChain(chain)` for
      multichain accounts. **Do not** rewrite Receive from scratch — that's Phase 3's job
      (`MULTICHAIN_PLAN.md` line 137: "Replace the TRON tab — TRON now flows through the same
      chain-kit path"). For Phase 2 we only need the new multichain account to show a correct
      address in Receive's existing TON / TRON tabs; EVM / BTC / SOL tabs land in Phase 3.
- [ ] **P4.** Hide / no-op every other wallet feature for multichain accounts in Phase 2. Sending,
      swapping, history, dashboards, etc. should either render an empty/coming-soon state or hide
      entirely. The fastest pattern is a top-level
      `if (account.type === 'multichain') { return <MultichainComingSoon /> }` near the root of each
      unaffected screen. Phase 3 lights them up one by one.

### Risk callouts

- **Scope creep.** P is the Phase 2 demo, not a polished UX. Resist the temptation to add balances
  or QR-codes-per-chain. Every minute spent on Phase 2 polish delays Phase 3, which is where the
  real read-path UX lives.
- **Empty-state coverage.** Step P4 must triage every wallet page — not just the ones a developer
  remembers. `grep` for `useActiveAccount` and `useActiveWallet` to find every consumer, then triage
  one at a time. Missing pages will crash or show wrong data when a multichain account is active.
- **Gate-only edits stay styled-components.** P4 wraps a lot of existing screens in
  `if (account.type === 'multichain') return <ComingSoon/>`. The wrapped legacy screens are _not_
  touched-for-redesign — they only get a gate. Per invariant #6 they stay styled-components.
  `<ComingSoon/>` itself is new and Tailwind.

### Done when

- Dev build (flag on) can: create a multichain account, see its TON + EVM + BTC + TRON (+ optionally
  SOL) addresses, copy each to clipboard, switch between chains in the wallet header.
- No transactions, no balances, no history — that's Phase 3.
- Snapshot harness still green; 9/9 typechecks green; no production-build behaviour change (flag is
  `false` in prod).

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
7. **M13 — Create flow.** Track M complete: dev build with flag on creates a multichain account
   end-to-end; addresses preview correctly. All new files Tailwind; reused legacy components either
   ported or forked.
8. **M14 — Import flow.** Track N complete: dev build with flag on imports a BIP39 seed into a
   multichain account, with escape hatch to legacy TON-only.
9. **M15 — Demo proof.** Track P complete: dev build can display the new account's per-chain
   addresses on the wallet page; all other wallet features no-op safely for multichain accounts.
10. **M16 — Phase 2 exit review.** Full app suite green on all 4 target apps with flag on _and_ with
    flag off; legacy TRON code path verified intact (manual smoke: a legacy `AccountTonMnemonic`
    account still shows its TRON tab in Receive with the same address as Phase 1 end-state); legacy
    onboarding (`CreateStandardWallet`, `CreateMAMWallet`, etc.) renders pixel-equivalent to Phase 1
    — confirms shared-component migrations didn't regress the legacy flows; bundle-size delta
    documented and within the Phase 0 budget. Sign-off before Phase 3.

---

## Phase 2 exit checklist

- [ ] All 4 target apps (web, desktop, extension, mobile) build green with flag on and with flag
      off.
- [ ] All existing unit tests pass.
- [ ] 62-BOC snapshot harness still byte-identical for every legacy combo. New `multichain-ton__*`
      BOCs pinned and green.
- [ ] `AccountMultichain` round-trips through `IStorage` without loss; legacy accounts round-trip
      byte-identical to Phase 1.
- [ ] `useActiveWalletForChain(chain)` returns multichain wallets for `AccountMultichain` and keeps
      legacy parity for everything else.
- [ ] `IKeychainService` exposes prefixed-key API on all 4 platforms; round-trip tests green.
- [ ] `getAdapter(chain).deriveAddress(...)` returns canonical addresses for TON / EVM / BTC / TRON
      (and SOL if Phase 0 included it).
- [ ] Dev build with flag on: create + import + display flows reach end-to-end.
- [ ] Production build with flag off: zero user-visible changes — every multichain entry point is
      hidden; legacy onboarding paths are byte-identical to Phase 1.
- [ ] **Legacy TRON path verified intact.** Manual smoke: log in with an `AccountTonMnemonic` that
      has a legacy `tronWallet`, confirm the TRON tab in Receive shows the same address as Phase 1;
      confirm no Phase 2 code path is reachable for the legacy account.
- [ ] Bundle-size delta per app documented and within Phase 0 budget. Extension and mobile
      (WASM-heavy) are highest-risk. CSS-side delta from Tailwind under 20KB gzipped per app
      (separate line item — WASM and CSS measured separately).
- [ ] Localization keys added to `packages/locales` for every new screen (~30–40 keys).
- [ ] Tailwind foundation in place: PostCSS configured per app, design-token bridge covers every
      token in the styled-components theme, lint rule rejects `styled-components` imports under
      `packages/uikit/src/multichain/**`.
- [ ] **Legacy onboarding pixel-parity check.** Manual smoke of `CreateStandardWallet`,
      `CreateMAMWallet`, `ImportExistingWallet`, `ImportTestnetWallet`, `CreateLedgerWallet`,
      `CreateKeystoneWallet`, `CreateSignerWallet`, `CreateWatchOnlyWallet`, `ImportBySKWallet`,
      `Subscribe`, `Password` — every legacy onboarding screen renders pixel-equivalent to Phase 1.
      This is the gate against shared-component edits leaking into legacy flows.
- [ ] All Phase 2 new UI lives under `packages/uikit/src/multichain/` and is 100% Tailwind. No new
      styled-components in this directory.

---

## Out of scope for Phase 2

These are tempting but explicitly **deferred** to keep Phase 2 mechanical:

- **Sending / swapping / signing transactions on non-TON chains.** Phase 4.
- **Balances, history, portfolio aggregation across chains.** Phase 3.
- **Receive UI rewrite (EVM/BTC/SOL tabs).** Phase 3 — Phase 2 only wires the existing TON + legacy
  TRON tabs through the new account's address resolver.
- **Migration of legacy TON / MAM accounts to multichain.** Phase 4. Per invariant #1, no Phase 2
  code path modifies a legacy account.
- **Replacing the legacy `tronWalletByTonMnemonic` bolt-on.** Phase 3 replaces TRON wholesale _only
  for multichain accounts_; legacy accounts continue using the bolt-on indefinitely.
- **Public-facing UX polish.** Phase 5.
- **Chain-kit Solana support if it's not yet shipped.** Track K5 leaves a clear opt-in path for
  whenever it lands.
- **Hardware-wallet support for multichain accounts.** Ledger / Keystone for non-TON chains is Phase
  4 at earliest.
- **Codebase-wide Tailwind migration.** Track Q sets up Tailwind and Tracks M/N/P port what they
  touch. Everything Phase 2 doesn't touch — settings pages, browser tab, send/receive history,
  dashboards, dapp connection screens, the activity feed, etc. — stays styled-components. Bulk
  migration of unrelated components is a future redesign phase, not Phase 2.
- **TWA.** Permanent — not coming back per memory `project_twa_unsupported`.

---

## Open question — chain-kit Solana availability at Phase 2 start

**Question:** Will chain-kit ship a working Solana module before Track K finishes?

**Context:**

- `MULTICHAIN_PLAN.md` Phase 0 decision-needed item (line 49, "Descope from initial release, ship in
  Phase 5").
- Phase 1 Track A registered SOL in the adapter registry but `validateAddress` returns false and
  `deriveAddress` throws `NotImplementedError`.
- Track K5 above describes the contingent path — if SOL isn't ready, exclude `'sol'` from
  `enabledChains` defaults and leave the throw in place. Cost: low. Re-enabling is a single track in
  Phase 3 or Phase 5.

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

- Legacy TON-standard mnemonic is 24 words. Users familiar with our app expect 24.
- BIP39 standard for new wallets in the broader ecosystem is increasingly 12 words (less entropy
  than 24 but still 128-bit security, which is industry-standard).
- Either is technically fine — chain-kit accepts both, and `bip39.generateMnemonic()` takes
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

- Track I3 above proposes yes. Rationale: `BaseAccount.activeTonWallet` returns `TonContract`, not
  `TonContract | undefined`. Hundreds of call sites assume it's defined. A multichain account
  without TON breaks the contract.
- Alternative: change `BaseAccount.activeTonWallet` to `TonContract | undefined` and audit every
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
