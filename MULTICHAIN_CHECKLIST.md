# Multichain feature checklist

Acceptance bar for every multichain feature step. Walk this list top-to-bottom against the diff
before marking a task done or opening a PR. If an item is genuinely out of scope for the slice, say
so explicitly — don't silently skip.

See also: `MULTICHAIN_PLAN.md` (roadmap), `CLAUDE.md` (architecture, styling rules, flag contract).

## Design

-   [ ] Matches the Figma mockup. The mockup wins over current code — do not propagate legacy
        visuals "because that's how the app does it today." See CLAUDE.md → "Project context:
        redesign rebuild".
-   [ ] Responsive: both mobile and desktop layouts are implemented, not just one.
-   [ ] Design tokens used wherever the mockup uses one (colors, radii, spacing, typography). No
        hardcoded hex or `px` values when a token exists.

## Behaviour

-   [ ] With `MULTICHAIN_ENABLED = true`: behaviour matches the iOS and Android native apps.
-   [ ] With `MULTICHAIN_ENABLED = false` (if the flag applies to this surface): behaviour is
        byte-identical to legacy production. The ship-safe build must not regress.
-   [ ] iOS and Android are **reference** implementations, not ground truth. Verify the logic before
        porting — they may carry bugs. Do not blind-copy.

## Code

-   [ ] All touched components use Tailwind. No `styled.X`, no template-literal CSS, no
        `createGlobalStyle` in touched files. Legacy components that the feature lands changes in
        get ported in the same PR. See CLAUDE.md → "Styling".
-   [ ] API clients are regenerated from spec — no hand-written request / response types that should
        come from the generator. See CLAUDE.md → "Regenerating API clients".
-   [ ] All chain interactions go through `chainKit`. No ad-hoc per-chain SDK calls.

## i18n

-   [ ] Every user-facing string uses `t('...')`.
-   [ ] New keys are added to the appropriate `packages/locales/src/<namespace>/en.json`, **or**
        recorded in `I18N_PENDING.md` if Tolgee already has them. See CLAUDE.md → "Adding
        translation keys".

## Tests

-   [ ] Small and medium UI components ship a `*.ct.tsx` screenshot test, mounted in both desktop
        and mobile mode (`screenshotEachMode`). See `packages/uikit/UI_TESTING.md`.
-   [ ] Logic is covered by unit tests — meaningful behaviour only. No tests of constants, no tests
        of JS language features, no tautological tests.
