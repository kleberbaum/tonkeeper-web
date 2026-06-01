# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Repository overview

Yarn 4 monorepo with Turborepo for a non-custodial TON blockchain wallet. Two shared packages feed
six platform apps:

-   **`packages/core`** — business logic, API clients, crypto services, account model (no React)
-   **`packages/uikit`** — all React components, state hooks, pages (depends on core)
-   **`packages/locales`** — i18n translation files
-   **`apps/web`** — Vite SPA
-   **`apps/extension`** — Chrome/Firefox browser extension (MV2 for Firefox, MV3 for Chrome)
-   **`apps/desktop`** — Electron app via `electron-forge`
-   **`apps/twa`** — Telegram Mini App (Vite)
-   **`apps/mobile`** — Capacitor iPad app (Vite)

## Common commands

```sh
# Install dependencies
yarn

# Development (web only)
yarn dev:web

# Build a specific app
yarn build:web
yarn build:extension
yarn build:desktop
yarn build:twa

# Build shared packages only (required before building apps manually)
npx turbo build:pkg

# Unit tests (run from packages/core)
yarn workspace @tonkeeper/core test

# Run a single test file
yarn workspace @tonkeeper/core test src/utils/__tests__/AmountFormatter.test.ts

# UI component tests (Playwright CT, run from packages/uikit)
yarn workspace @tonkeeper/uikit test:ct            # all component tests
yarn workspace @tonkeeper/uikit test:ct:changed    # only tests affected by the diff

# Playwright E2E tests (run from tests/playwright)
yarn workspace @tonkeeper/playwrite test

# Lint
yarn eslint --ext .ts,.tsx .
```

**Build outputs:**

-   `apps/web/dist` — web app
-   `apps/extension/dist/chrome` and `dist/firefox` — extensions
-   `apps/desktop/out` — desktop application
-   `packages/*/dist` — compiled package artifacts

## Architecture: platform abstraction via `AppSdk`

Every platform app creates its own class that extends `BaseApp` and implements `IAppSdk` (defined in
`packages/core/src/AppSdk.ts`). This is the central abstraction: it holds the `IStorage` instance,
emits `UIEvents` (unlock, transfer, scan, toast, etc.), and provides platform-specific methods
(clipboard, open URL, biometry, keychain, cookie cleanup, etc.).

`uikit` hooks access the SDK via `useAppSdk()` — never import platform-specific implementations from
apps into `uikit`.

**Desktop:** `DesktopAppSdk` proxies all storage and system calls over Electron IPC to the main
process (`apps/desktop/src/electron/background.ts`), using a `sendBackground()` bridge.
Mnemonic/keys are stored in the OS keychain via `keytar`.

**Extension:** The extension has three contexts — popup (React UI), background service worker, and
content script. The background handles DApp connections and message routing between contexts using
`webextension-polyfill`.

## Architecture: storage

`IStorage` (defined in `packages/core/src/Storage.ts`) is a simple async key/value interface:

```ts
get<R>(key: string): Promise<R | null>
set<R>(key: string, value: R): Promise<R | null>
delete<R>(key: string): Promise<R | null>
clear(): Promise<void>
```

All storage keys are centralized in `packages/core/src/Keys.ts` under the `AppKey` enum. Never use
raw string keys.

## Architecture: state management

-   **Server/async state** — `@tanstack/react-query` (pinned to `4.3.4`). All cache keys are defined
    in `packages/uikit/src/libs/queryKey.ts` as the `QueryKey` enum. Use `anyOfKeysParts(...keys)`
    for broad invalidations.
-   **Reactive SDK state** — custom `Atom`, `Subject`, and `ReplaySubject` classes in
    `packages/core/src/entries/atom.ts`. The `AppSdk` holds atoms for active wallet, active account,
    lock state, etc.
-   **UI context** — `AppContext` (from `packages/uikit/src/hooks/appContext.ts`) provides API
    config, feature flags (`standalone`, `extension`, `ios`, `proFeatures`, `hideLedger`, etc.), and
    the analytics tracker. Populated by each app's root component.

## Architecture: account model

Defined in `packages/core/src/entries/account.ts`. The union type `Account` covers:

| Class                 | Description                            |
| --------------------- | -------------------------------------- |
| `AccountTonMnemonic`  | Standard mnemonic wallet (mainnet)     |
| `AccountTonTestnet`   | Testnet mnemonic wallet                |
| `AccountTonSK`        | Secret-key based wallet                |
| `AccountMAM`          | Multi-account mnemonic (HD derivation) |
| `AccountLedger`       | Ledger hardware wallet                 |
| `AccountKeystone`     | Keystone hardware wallet               |
| `AccountTonWatchOnly` | Watch-only, no signing                 |
| `AccountTonOnly`      | Address-only, no mnemonic              |
| `AccountTonMultisig`  | Multisig contract account              |

Each account has one or more `TonWalletStandard` entries (wallet versions V3R1–V5R1). The
`activeAccountId` and per-account `activeTonWalletId` are stored under `AppKey.ACTIVE_ACCOUNT_ID`
and `AppKey.ACCOUNT_CONFIG`.

`AccountMultichain` is the Phase 2 BIP39 multichain account (TON + EVM + BTC + TRON wallets behind
one seed). It is gated behind the `MULTICHAIN_ENABLED` flag — see below.

## Styling

Two styling systems live side-by-side during the multichain redesign:

-   **Tailwind** — `packages/uikit/tailwind.config.ts`, entry at
    `packages/uikit/src/styles/tailwind.css`. Design tokens (`backgroundPage`, `textPrimary`,
    `separatorCommon`, the `corner*` / `rounding*` scale, the button colors, etc.) are exposed as
    Tailwind colors that resolve to CSS custom properties (`var(--tk-…)`). Use the `cn(...)` helper
    from `packages/uikit/src/libs/css.ts` for conditional class lists.
-   **styled-components** — the legacy system. Still in use for everything that hasn't been touched
    by the redesign.

### Rules for new code

1.  **New components ship in Tailwind only.** Do not introduce `styled.div` / `createGlobalStyle` /
    template-literal CSS in any component created during or after the multichain-redesign work. This
    includes layout primitives, page chrome, form controls, and one-off page wrappers.
2.  **Touched legacy components port to Tailwind in the same PR.** If a new task lands changes in an
    existing styled-components component, convert it to Tailwind as part of the same PR rather than
    leaving a hybrid. Tokens map 1:1 to the Tailwind color names — there's no design-tradeoff cost.
3.  **Untouched legacy components stay as they are.** Don't open mass drive-by conversions; the
    migration is opportunistic, page by page.
4.  **The `theme` object remains canonical at runtime** — `UserThemeProvider` keeps writing into the
    styled-components theme and `syncThemeToTailwindVars` mirrors it into the CSS custom properties
    Tailwind reads, so the two systems share one source of truth.

If you find yourself reaching for `styled.something` in a new file, stop and use a `className` with
Tailwind utilities instead. Conditional styling goes through
`cn(base, condition && 'class', other && 'class')`; the local `cn` accepts
`string | undefined | boolean` (no arrays — pass each condition as its own argument).

## Multichain feature gate

Single source of truth: **`packages/core/src/multichain.ts`** exports `MULTICHAIN_ENABLED`. Every
app shell reads it once at boot and feeds the value to `AppContext.multichainEnabled`. No env vars,
no per-app copies, no runtime override.

The flag is a hard split between two well-defined product states. Code that branches on it should
honor this split exactly:

-   **`false` (default, ship-safe)** — Production parity. Behaves exactly as `main` does today:
    legacy TON-only accounts only, BIP39 imports land as `AccountTonMnemonic`, hardware-wallet
    pairings unchanged. The **only** differences from production are pure visual / design changes
    (the multichain-design redesign of touched screens). No data-model, account-type, or on-chain
    behaviour changes.
-   **`true`** — Full multichain functionality. BIP39 imports create `AccountMultichain` with TON +
    EVM + BTC + TRON wallets; per-chain selectors and chain-aware UI light up; multichain create
    flow is reachable.

Flip the constant locally for development / QA. A build-time replacement (Vite `define` / webpack
`DefinePlugin`) can be wired later if we need per-environment flips without a recompile.

### Forking style: copy-paste over conditionals

Because both flows ship from the same tree, components that diverge meaningfully between the
multichain and legacy paths should be **forked** — guard with an early return on `multichainEnabled`
and copy-paste the body into a sibling component, rather than threading `if (multichainEnabled) …`
through every section. The legacy branch then stays byte-identical to `main` (preserving production
parity in the ship-safe `false` build), and the multichain branch can evolve without one set of
edits silently breaking the other.

A trivial branch — a uniform flag applied per row, a string swap, an icon flip — is fine to inline.
Example: `packages/uikit/src/components/create/AddWalletPicker.tsx` keeps a single picker that
renders every entry, and uses `multichainEnabled` as a single `disableNonImport` flag passed to each
non-import row. (We deliberately do **not** hide the disabled rows or fork the picker into two
components — users should still see what's coming, and the divergence is shallow enough that the
flag-per-row pattern is the lighter touch.)

Reach for a full fork when the divergence spans more than a few lines or when the two versions touch
independent surfaces that could drift over time.

## Architecture: page layout

Every app shell renders its routes inside a single shared primitive:
**`packages/uikit/src/components/layout/AppLayout.tsx`**.

```tsx
<AppLayout
    sidebar={<AsideMenu />} // desktop only
    topBar={<Header />} // mobile only — optional
    bottomBar={<Footer standalone={standalone} />} // mobile only
    bare={!activeAccount || location.startsWith(AppRoute.import)}
    standalone={standalone}
>
    <Switch>…</Switch>
</AppLayout>
```

`AppLayout` branches once on `useIsFullWidthMode()` (`theme.displayType === 'full-width'`) and picks
one of three layouts:

-   **Desktop** (`full-width`) — two-column: `sidebar` slot on the left, content fills the rest.
    Figma `199:265572`.
-   **Mobile** (`compact`) — single column with the bars (`Header` / `Footer`) self-positioning via
    `position: fixed`. AppLayout reserves matching `padding-top: 64` / `padding-bottom: 80` (or `96`
    when `standalone`) on the content. Figma `4156:155023`.
-   **Bare** (`bare={true}`) — strips the chrome entirely. Used for onboarding (StartScreen),
    unlock, and the Ledger pairing screen. No sidebar, no bars, viewport-bound centered content.

Slots that don't apply to the current mode are ignored — every shell passes the same set of slots
once and the primitive picks. The `bare` predicate is the **single** place each shell decides "this
route has no chrome"; before AppLayout the same predicate was duplicated in five wrappers with
slightly different geometry.

**Migration status (May 2026):** web, extension, desktop-electron, twa, and the mobile-capacitor
`WideContent` tablet path all use AppLayout. The mobile-capacitor `NarrowContent` (Ionic `IonApp` +
`IonReactRouter` + `IonMenu`) is out of scope — Ionic owns the page lifecycle and the AppLayout
abstraction doesn't map. Ionic-mode pages render `IonPage` / `IonContent` directly.

**Adding a new page:** declare your page as pure content. Do not wrap it in `Container`,
`FullSizeWrapper`, `min-h-[var(--app-height)]`, or similar — `AppLayout` owns sizing, centering, and
the viewport-bound height. If your page needs no chrome, route it through a `bare` branch in the
shell rather than building a one-off wrapper.

**Extension popup geometry:** the extension wraps `AppLayout` in a small `ExtensionPopupRoot` styled
div (`apps/extension/src/App.tsx`) that constrains the popup window to its `385px` min-width /
`600px` height. That outer constraint is genuinely browser-popup-specific and stays outside
`AppLayout`.

## Architecture: packages build pipeline

`packages/core` and `packages/uikit` compile via `tsc` only — no bundler. Imports between packages
use the compiled `dist/` output (e.g., `@tonkeeper/core/dist/entries/account`). When changing core
or uikit, run `yarn workspace @tonkeeper/core build` (or `build:pkg` via Turbo) before the consuming
app picks up the changes.

Turbo's task graph: `build:pkg` runs first, then all `build:*` app tasks depend on it.

## Testing

-   **Unit tests** — Vitest in `packages/core` (`*.test.ts`), run via
    `yarn workspace @tonkeeper/core test`.
-   **UI component tests** — Playwright Component Testing (`@playwright/experimental-ct-react`) in
    `packages/uikit`, colocated as `*.ct.tsx`. We are rolling these out **alongside the unit
    tests**, targeting **small-to-medium components** (buttons, fields, list rows, badges…);
    page-level flows stay in the E2E suite. Each test can render in **desktop and mobile modes** via
    the `screenshotEachMode` decorator (sets viewport + theme variant), so both behaviour and
    screenshots are checked per breakpoint. New small/medium components should ship with a
    `*.ct.tsx`. Mount providers live in `packages/uikit/playwright/index.tsx`. Screenshot baselines
    are platform-specific and **only the `-linux` baselines are committed** (CI is Linux);
    regenerate them with the "Component Tests → Update screenshot baselines" workflow. Full guide:
    `packages/uikit/UI_TESTING.md`. The CI `component-tests` job runs only diff-affected tests on
    PRs and the full suite on `main`.
-   **E2E tests** — Playwright in `tests/playwright` (being phased out).

## Adding translation keys

Translations live in Tolgee; the local `packages/locales/src/<namespace>/en.json` files are the
English source committed to the repo, and `task/build.ts` either pulls fresh translations from
Tolgee (when `TOLGEE_TOKEN` is set) or builds the dist from the committed source. Other locales fall
back to English via `fillMissingLocales` so the runtime never throws on a missing key.

When you add a `t('new_key')` call:

1. Add the English entry to `packages/locales/src/tonkeeper-web/en.json` (or `tonkeeper/en.json` for
   keys shared with the mobile/iOS app). Keep the existing **2-space JSON indent** — the file
   pre-dates the repo-wide `prettier: { tabWidth: 4 }` config, and the lint-staged prettier hook
   will otherwise rewrite the whole 800-line file. If you need to touch it via a pre-commit-hooked
   commit, use `git commit --no-verify`.
2. Record the key in `I18N_PENDING.md` (root of the repo) with its English copy, the commit / PR it
   landed in, and a one-line note on where it shows up. That file is the reminder to upload the key
   to Tolgee before the next translation cut; remove the row once Tolgee has it.

Skipping the source-file write is fine **only** if the key already exists in Tolgee (e.g.,
`start_screen_create_wallet_button` was already present from a prior import) — but you still owe
`I18N_PENDING.md` an entry, because Tolgee state isn't visible from the repo.

## Regenerating API clients

`packages/core` ships auto-generated clients for several Tonkeeper backends. Regeneration requires a
`GITHUB_TOKEN` with `Contents: Read` on the relevant private repo:

```sh
export GITHUB_TOKEN=<your-token>
yarn workspace @tonkeeper/core generate:tonkeeperApi   # tonendpoint_backend
yarn workspace @tonkeeper/core generate:2faApi          # tonkeeper_2fa_backend
yarn workspace @tonkeeper/core generate:batteryApi      # custodial-battery
yarn workspace @tonkeeper/core generate:pro             # pro_backend
yarn workspace @tonkeeper/core generate:tonConsoleApi   # tonconsole_backend
yarn workspace @tonkeeper/core generate:sdkV2           # public, no token needed
```

## Branch and commit conventions

From `CONTRIBUTING.md`:

**Branch names:** `feature/<description>`, `fix/<description>`, `hotfix/<description>`

**Commit format:** `<type>(<scope>): <description>` using Conventional Commits.

-   Types: `feat`, `fix`, `chore`, `refactor`, `docs`
-   Scopes: `desktop`, `extension`, `web`, `core`, `uikit`, `locales`, `mobile`, `twa`

## Key dependency notes

-   `@tanstack/react-query` is pinned to `4.3.4` **without** a range specifier across all apps —
    this is intentional in the lockfile but means it never auto-updates.
-   `react-router-dom` is v5 across all apps.
-   `typescript` is v4 in most packages; `apps/mobile` uses v5.
-   `prettier` is v2.
-   `@tma.js/sdk` uses `"latest"` — treat it as potentially unstable at install time.
-   `electron` is on v32; upgrade carefully as it requires matching `@electron-forge/*` versions.
