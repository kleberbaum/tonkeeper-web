# Phase 3 — UI-library refactor, then multichain account UI (task breakdown)

> **Status: PLANNING — not started (opened 2026-05-27).** Phase 3 opens with a **UI-library refactor
> (Track R)** that gates everything else. Until R is scoped and landed, no multichain UI is built —
> every screen is built on the refactored library, not layered on the current one and reworked
> later. The multichain UI tracks behind R are: **create flow (Track S)**, **import flow (Track
> T)**, and **address display (Track U)**.
>
> **Create flow was pulled back out of Phase 2 (2026-05-27).** Phase 2 originally shipped the
> create-flow UI (its old Track M), but per "refactor the component library before adding UI" that
> UI was reverted from the working tree — only its **non-UI foundation stayed** (the
> `multichainCreateService` core service, `generateBip39Mnemonic`, the adapter `derivePublicKey`
> extension, all tested). Track S below rebuilds the create _screens_ on the refactored library and
> wires them to the already-shipped service.
>
> **Read paths deferred.** Portfolio aggregation, Receive, Buy, per-asset History, and Manage tokens
> were **removed from Phase 3** and will be sequenced into a later phase (see "Deferred to a later
> phase" at the bottom). Phase 3 ends at: create + import a multichain account and view its
> per-chain addresses, on the refactored library.

Sibling document to `MULTICHAIN_PLAN.md` (Phase 3 section), `MULTICHAIN_PHASE_2_TASKS.md`, and
`MULTICHAIN_PHASE_1_TASKS.md`. Phase 2 landed the wallet shape and the non-UI key-derivation
foundation (`AccountMultichain` variant, per-chain derivation, the create service, Tailwind setup).
Phase 3 refactors the UI library, then builds the multichain account's **UI** on top of it: create,
import, and address display.

**Team:** one developer on web integration. Tracks are serial; Track R gates all of them. **Exit
criterion:** A dev build (`multichainEnabled = true`) on the refactored UI library can create a
multichain account from a fresh BIP39 seed, import an existing BIP39 seed into a multichain account,
and view per-chain addresses (TON / EVM / BTC / TRON). No balances, receive, buy, history, send,
swap, or migration. Existing TON-only accounts and the legacy TRON code path stay byte-identical to
Phase 2 end-state — the snapshot harness (Phase 1 Track G) still passes.

**Redesign scope:** Phase 2 stood up Tailwind as the styling system (Track Q). Phase 3's Track R
refactors the _existing_ uikit library on top of that Tailwind foundation; every Phase 3 screen
(S/T/U) is built on the refactored library. Legacy styled-components screens a track must touch get
ported in the same PR (opportunistic migration, per [[project_multichain_tailwind_migration]]) — not
a codebase-wide rewrite outside of R.

---

## Non-negotiable invariants

Carried forward from Phase 2 — these hold from the first commit of Phase 3 to the last. Violating
any is a Phase 3 regression by definition.

1. **Legacy TON / TRON stay byte-identical.** The `tronWalletByTonMnemonic` bolt-on and the
   `m/44'/195'/0'/0` legacy derivation keep serving every non-multichain account exactly as at Phase
   2 exit. The BIP39-rooted multichain paths remain additive and only used by `AccountMultichain`.
   Migration legacy → multichain is Phase 4, not Phase 3.
2. **62-BOC snapshot harness stays green.** Every track re-runs
   `yarn workspace @tonkeeper/core test` and confirms `src/__tests__/snapshots/sign/sign.test.ts` is
   byte-identical. Phase 3 adds no signing.
3. **Legacy `Account` union members are not touched on disk.** A user who never opts into multichain
   and downgrades to a Phase 2 (or Phase 1) build loses nothing.
4. **`multichainEnabled` gates every multichain UI surface.** Create, import, and address display
   are hidden in production (flag default `false`). Legacy create/import stay reachable regardless
   of flag state.
5. **TWA stays excluded.** The 4 target apps are web / desktop / extension / mobile. TWA is on the
   deprecation track ([[project_twa_unsupported]]); no Phase 3 work touches it.
6. **Track R is the only wholesale-migration track.** Outside Track R, Tailwind replaces
   styled-components only for (a) new files under `packages/uikit/src/multichain/**` and (b) legacy
   components a track must edit. A non-R PR whose diff is "migrate component X" with no accompanying
   multichain change is scope creep — fold that into Track R.

---

## Track summary & order

Serialized for a single developer. Track R gates the entire phase; nothing else starts until R
lands.

```
  R. UI-library refactor          ← GATES ALL OF PHASE 3; scope planned separately
            │
  S. Create-multichain flow (UI)  ← was Phase 2 Track M (UI reverted); service already shipped
            │
  T. Import-multichain flow (UI)  ← was Phase 2 Track N; needs S (reuses screens)
            │
  U. Address display / wallet hdr ← was Phase 2 Track P; needs S (+ T for import path)
  ─────────────────────────────── Phase 3 ends here ──────────────────────────────
  read paths (portfolio / receive / buy / history / manage tokens) → deferred, later phase
```

**R gates everything.** It is a planning-and-execution track in its own right — see the Track R
banner. S/T/U are the three multichain UI tracks, all built on the refactored library.

---

## Track R — UI-library refactor (gates all of Phase 3)

> **Scope to be planned separately (owner: TBD).** This track is intentionally under-specified — it
> needs its own scoping pass with the user before tasks are written. The decision that it comes
> _first_ is settled ([[project_ui_refactor_before_features]]); the _contents_ are not.

**Depends on:** Phase 2 Track Q (Tailwind setup + design-token bridge — already landed).
**Touches:** `packages/uikit/src/components/**`, `packages/uikit/src/pages/**` (extent TBD by the
scoping pass).

### Goal

Refactor the existing uikit component library so the Phase 3 multichain screens (S/T/U) build on a
clean foundation, rather than layering new components onto the current library and reworking them
after.

### Open scoping questions (resolve before writing R's tasks)

-   **What's wrong with the current library?** Concrete pain points — inconsistent primitives, the
    styled-components/Tailwind split, prop drilling, theming, duplicated layout shells — enumerated,
    not asserted.
-   **What's the target shape?** Component inventory, naming, and the relationship to the Tailwind
    design-token bridge from Phase 2 Track Q (the bridge mirrors styled-components theme vars onto
    `:root` CSS custom properties — does the refactor keep that bridge, or migrate off it?).
-   **Migration strategy.** Big-bang vs. incremental-by-surface; how to keep all 4 apps green
    throughout; whether legacy styled-components screens are ported in R or when a later track
    touches them.
-   **Exit criterion for R.** What "refactored" concretely means, and the regression bar (all 4 apps
    build; existing screens visually unchanged unless intentionally redesigned).

### Done when

-   (TBD by the scoping pass.) Provisionally: refactored library in place, all 4 target apps build
    and pass tests, snapshot harness green, and S/T/U can be built on the new primitives without
    further library churn.

---

## Track S — Create-multichain flow (UI) — was Phase 2 Track M

> **UI reverted from Phase 2, rebuilt here (2026-05-27).** Phase 2 shipped this flow's screens, then
> reverted them so the create UI builds on the refactored library instead. The **service layer
> already shipped and stays** — `createAccountMultichainByMnemonic`, `previewTonAddress`, and the
> per-chain `deriveNonTonMultichainWallets` in
> `packages/core/src/service/multichainCreateService.ts` (tested in
> `service/__tests__/multichainCreateService.test.ts`), plus `generateBip39Mnemonic` and the adapter
> `derivePublicKey` extension. Track S re-adds only the **UI**: the create screens, the
> `useCreateAccountMultichain` hook, and the add-wallet wiring + locale keys.

**Depends on:** R. Behind `multichainEnabled`. **Touches:** new
`packages/uikit/src/multichain/create/` (refactored library); `useCreateAccountMultichain` in
`packages/uikit/src/state/wallet.ts`; the `'create-multichain'` entry in `addWalletMethod`
(`packages/core/src/entries/wallet.ts`); `AddWallet.tsx` picker +
`AddWalletNotificationControlled.tsx` case; multichain locale keys in `packages/locales`.

### Goal

A user with `multichainEnabled = true` can: tap "Create multichain wallet" → see a BIP39 phrase
(12-word default, 24-word advanced) → confirm backup via the word-quiz → toggle chains (TON forced
on per Track I3) → see derived addresses per enabled chain → save the account.

### Tasks

-   [ ] **S1.** Create screens under `packages/uikit/src/multichain/create/` on the refactored
        library: state machine intro → words → check → chains → address preview → final.
-   [ ] **S2.** BIP39 generation via the shipped `generateBip39Mnemonic(12|24)` core helper (keeps
        `bip39` out of uikit's direct deps). 24-word default, one-tap 12-word toggle.
-   [ ] **S3.** Backup confirmation (word display + 3-position quiz) on the refactored library's
        primitives. Whether this shares one component with the legacy create flow or stays forked is
        a Track-R decision — the Phase 2 attempt forked to avoid mutating the 5-caller legacy
        `Words.tsx`.
-   [ ] **S4.** Chain-selection step: TON force-enabled with a "TON is always enabled" tooltip; SOL
        defaults off (chain-kit has no Solana module — derivation would throw); others default on.
-   [ ] **S5.** Address-preview step: `await ensureReady()` then per-chain
        `getAdapter(chain).deriveAddress({mnemonic})`; TON via the shipped `previewTonAddress()`.
        Show a loading state for WASM warm-up (~1s first load). A chain whose adapter throws drops
        out of `enabledChains` rather than failing the flow.
-   [ ] **S6.** Save: re-add `useCreateAccountMultichain` (keychain + password paths), calling the
        shipped `createAccountMultichainByMnemonic`. Re-add `'create-multichain'` to
        `addWalletMethod`, the `AddWallet.tsx` picker entry (Beta badge, behind
        `multichainEnabled`), and the `AddWalletNotificationControlled.tsx` case.
-   [ ] **S7.** Localization: re-add the multichain create keys to `packages/locales` source files
        (~18 keys: titles, captions, chain labels, save button, TON-required tooltip, "Not
        available" fallback). Required before flag flip, not before merge.

### Risk callouts

-   **TON forced-enabled UX.** The `'ton'` toggle must be visually disabled with a tooltip — silent
    auto-enable is worse than explicit (Track I3 makes this clean).
-   **Mnemonic exposure window.** BIP39 phrase shown in plaintext during backup; reuse the existing
    screenshot-blocking / blur-on-blur behaviour.
-   **WASM warm-up.** `deriveAddress` may require `await ensureReady()`; show a loading state.
-   **Shared-component migration.** If S3 reuses the legacy word-quiz, don't mutate it in place —
    the legacy create flow (CreateStandard/MAM/Import/Testnet/Recovery) shares it. Fork or refactor
    per the Track R decision.

### Done when

-   Dev build (flag on) reaches "Create multichain wallet" and produces an `AccountMultichain` with
    derived addresses for all enabled chains.
-   No production callers — flag `false` in prod hides the entry point.
-   Snapshot harness green (TON routes through `createStandardTonAccountByMnemonic`, registry
    untouched); 9/9 typechecks green; legacy create flow renders pixel-equivalent to Phase 2.

---

## Track T — Import-multichain flow (UI) — was Phase 2 Track N

> **Carried from the Phase 2 wrap (2026-05-27).** Two findings travel with this track:
>
> -   **Routing is multi-valued, not a single switch.** A 24-word phrase can be valid as MAM _and_
>     TON-standard _and_ BIP39 at once (MAM roots ⊂ TON-standard). The legacy flow disambiguates via
>     on-chain balance lookups + existing-account checks + a user choice (`SelectMnemonicType`). A
>     single-valued router would misroute every MAM root — build on the existing disambiguation,
>     don't replace it.
> -   **Per-chain path override is blocked on chain-kit.** `CryptoWallet.getAddress(chain)` takes no
>     derivation-path argument, so an override would be a no-op today. chain-kit has a
>     `Derivation.Path` type but no path-aware wallet-from-mnemonic surface. Ship T without the
>     override; revisit when chain-kit exposes the API.

**Depends on:** R + S (reuses create-flow screens). Behind `multichainEnabled`. **Touches:** new
`packages/uikit/src/multichain/import/` (refactored library); the BIP39-vs-TON-standard-vs-MAM
disambiguation in `packages/core/src/service/mnemonicService.ts`.

### Goal

A user with `multichainEnabled = true` can paste a BIP39 phrase and end up with an
`AccountMultichain` (instead of an `AccountTonMnemonic` with `mnemonicType: 'bip39'`, which is how
Phase 1/2 route BIP39).

### Tasks

-   [ ] **T1.** Routing layer on top of existing detection (`validateMnemonicTonOrMAM` /
        `validateBip39Mnemonic` + the on-chain/existing-account disambiguation): TON-standard →
        `AccountTonMnemonic` (legacy, unchanged); MAM → `AccountMAM` (legacy, unchanged); BIP39 →
        branching choice:
    -   `multichainEnabled === false`: BIP39 → `AccountTonMnemonic` with `mnemonicType: 'bip39'`
        (Phase 1/2 behaviour, byte-identical).
    -   `multichainEnabled === true`: BIP39 → `AccountMultichain` by default, with a discoverable
        advanced "Import as TON-only (legacy BIP39 wallet)" escape hatch.
-   [ ] **T2.** Chain-selection step on import — reuse Track S's chain-selection screen, defaulted
        to all chain-kit-supported chains, user can opt chains out.
-   [ ] **T3.** Save: same path as Track S6 (`createAccountMultichainByMnemonic`).
-   [ ] **T4.** _(Blocked — do not build yet.)_ Per-chain derivation-path override. Blocked on
        chain-kit exposing a path-aware `getAddress`. Tracked here so it isn't lost; not in T's
        done-bar.

### Risk callouts

-   **Ambiguous BIP39.** A BIP39 phrase could equally be a legacy `mnemonic-bip39` TON-only wallet
    or a multichain wallet — the seed doesn't say which. The escape hatch in T1 must be
    discoverable. `MULTICHAIN_PLAN.md` open-question #7 settles on multichain-default with the
    escape hatch visible; honour that until product overrides.
-   **Non-canonical TRON path.** A BIP39 seed created elsewhere on the non-canonical TRON path
    (`m/44'/195'/0'/0` — our legacy bolt-on) derives a different TRON address by default. Until the
    path override (T4) is unblocked, surface this clearly in the address-preview copy; there is no
    in-app remedy in Phase 3.
-   **Tailwind / legacy hybrid handoff.** The escape hatch routes into the _legacy_ import flow.
    Verify visual continuity at the handoff (new wrapper → legacy destination) post-Track-R.

### Done when

-   Dev build (flag on) routes BIP39 import to `AccountMultichain` by default.
-   "Import as TON-only" produces `AccountTonMnemonic` (legacy) byte-identically.
-   Snapshot harness green; 9/9 typechecks green; flag-off behaviour unchanged.

---

## Track U — Address display + multichain wallet header — was Phase 2 Track P

> **Carried from the Phase 2 wrap (2026-05-27).** This was the Phase 2 exit demo; it's entirely UI
> and lands here on the refactored library. The create flow (Track S) already previews per-chain
> addresses before save, so this becomes the real multichain wallet header.

**Depends on:** R + S (+ T for the import entry path). Behind `multichainEnabled`. **Touches:** new
`packages/uikit/src/multichain/wallet/` (header + address-list components); gate-only taps into
`packages/uikit/src/pages/wallet/` for not-yet-built features.

### Goal

A multichain account renders a wallet header with the active chain's address and a chain switcher;
every chain in `enabledChains` is viewable with its address. Features not yet built (balances, send,
swap, history — all deferred) render a coming-soon state rather than crashing.

### Tasks

-   [ ] **U1.** Multichain wallet header on the wallet page when `account.type === 'multichain'`:
        active chain's address + chain switcher (dropdown / segmented control).
-   [ ] **U2.** "All addresses" view: every chain in `enabledChains` with its address, copy-to-
        clipboard via `useAppSdk().copyToClipboard()`.
-   [ ] **U3.** Coming-soon gating for every wallet feature not yet built for multichain. Top-level
        `if (account.type === 'multichain') return <MultichainComingSoon />` near each unbuilt
        screen's root. **Triage every consumer** — `grep` for `useActiveAccount` /
        `useActiveWallet`, don't rely on memory; a missed page crashes or shows wrong data under a
        multichain account.

### Risk callouts

-   **Empty-state coverage.** U3 must cover every wallet page. Enumerate consumers, triage each.
-   **Gate-only edits.** Screens wrapped by U3 get _only_ a gate — not a redesign. Per invariant #6
    they stay as Track R left them; the `<MultichainComingSoon />` itself is new.

### Done when

-   Dev build (flag on): create/import a multichain account, see TON + EVM + BTC + TRON (+
    optionally SOL) addresses, copy each, switch chains in the header.
-   Every unbuilt feature shows coming-soon, none crash.
-   Snapshot harness green; 9/9 typechecks green; flag-off behaviour unchanged.

---

## Milestones (not calendar)

Track progress by milestone, not week. Each gates the next; don't skip.

1. **M-R — Library refactored.** Track R complete (scope + execution): refactored library in place,
   all 4 apps build, snapshot harness green. **Gates the rest of Phase 3.**
2. **M-S — Create lands.** Track S complete: create flow on the refactored library produces an
   `AccountMultichain`; the already-shipped service layer wired through.
3. **M-T — Import lands.** Track T complete: BIP39 → `AccountMultichain` by default behind the flag;
   legacy escape hatch byte-identical.
4. **M-U — Account is viewable.** Track U complete: multichain header + address list + coming-soon
   gates; nothing crashes under a multichain account.
5. **M-exit — Phase 3 exit review.** A multichain account can be created, imported, and have its
   per-chain addresses viewed across TON / EVM / BTC / TRON, on the refactored library. No read or
   write paths.

---

## Deferred to a later phase

Removed from Phase 3 (2026-05-27) — to be sequenced into a later phase after the account UI lands.
These are the read-path features that were the original Phase 3 read-path scope.

-   **Portfolio aggregation** — extend `useAssets()` across enabled chains; per-chain balance query
    keys; per-chain spam filtering.
-   **Receive flow** — extend the existing `ReceiveContent` (already accepts `chain?`); add
    EVM/BTC/SOL handlers + per-chain QR; replace the legacy TRON tab with the chain-kit path for
    multichain accounts.
-   **Buy flow** — `supportedChains` per provider; filter providers by selected chain+token.
-   **Per-asset history** — per-chain history screens via chain-kit `transaction.findTransaction` +
    per-chain indexers (**new BE dependency** — surface to BE team when this phase is scheduled).
-   **Manage tokens / hide spam** — extend the existing Manage-tokens UI to be per-chain.

Write paths (Send / cross-chain swap / migration) remain in Phase 4 per `MULTICHAIN_PLAN.md`.

---

## Per-task comment cleanup

Same rule as every phase: tracks seed phase-/track-pointer comments while work is in flight
(`Phase 4+: not wired`, `Track U designs this`, `multichainEnabled gates this`, etc.). These are
scaffolding for the PR reviewer, useless a year later. The final step of every track — before
marking it ✅ — is a cleanup sweep on the diff that track produced. Delete comments that reference
phases, tracks, or milestones. Keep only comments that explain a non-obvious **general** idea (a
hidden invariant, a surprising constraint, a bug workaround). Recipe:

```sh
rg -n 'Phase [0-9]|Track [A-U][0-9]?' $(git diff --name-only main... -- packages apps)
```

---

## Open questions

-   **Track R scope.** The whole of Track R — what's wrong with the current library, the target
    shape, the migration strategy vs. the Tailwind bridge, and R's exit bar. Must be settled with
    the user before R's tasks are written. (Owner / Decision / Date: TBD.)
-   **chain-kit path-aware derivation (Track T4).** When chain-kit exposes a path-aware
    wallet-from-mnemonic API, unblock the per-chain derivation-path override. Until then T ships
    without it. (Tracked in `MULTICHAIN_PLAN.md` Appendix B.)
-   **Create-flow default after launch.** `MULTICHAIN_PLAN.md` open-question #7 (multichain-default
    vs. legacy-visible) — affects T's escape-hatch prominence. Recommendation stands at Option A;
    product to confirm.
-   **When do the deferred read paths land?** They were pulled out of Phase 3; the phase/sequencing
    for portfolio / receive / buy / history / manage tokens is open. (Owner / Decision / Date: TBD.)
