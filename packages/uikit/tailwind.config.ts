import { join } from 'path';
import type { Config } from 'tailwindcss';

/**
 * Single source of truth for Tailwind across every Tonkeeper app. Sits in
 * uikit so the design-token bridge is defined once; each consumer app wires
 * PostCSS to pick up this config.
 *
 * Tokens are exposed as CSS custom properties on `:root` (see
 * `src/styles/tailwind.css`) and mirrored by `UserThemeProvider` from the
 * active styled-components theme. That keeps a Tailwind `bg-textPrimary`
 * rule rendering the same color as an adjacent
 * `styled.div``color: ${theme.textPrimary}`` ` rule. There is one dark
 * theme; the sync mainly exists so the `isInsideTonkeeper` corner
 * overrides reach Tailwind utilities too.
 *
 * No `darkMode` config: there is no light theme, so Tailwind's `dark:`
 * variant would be a no-op. There is no theme switching.
 */
// Tailwind resolves content globs against the build-tool's CWD by default, not
// the config file. Anchoring to __dirname keeps the same uikit + apps scan
// regardless of whether Vite (web/mobile/extension) or webpack (desktop) is
// the caller.
const REPO_ROOT = join(__dirname, '..', '..');
const config: Config = {
    content: [
        join(__dirname, 'src/**/*.{ts,tsx}'),
        join(REPO_ROOT, 'apps/web/src/**/*.{ts,tsx}'),
        join(REPO_ROOT, 'apps/mobile/src/**/*.{ts,tsx}'),
        join(REPO_ROOT, 'apps/desktop/src/**/*.{ts,tsx}'),
        join(REPO_ROOT, 'apps/extension/src/**/*.{ts,tsx}')
    ],
    theme: {
        extend: {
            colors: {
                textPrimary: 'var(--tk-text-primary)',
                textSecondary: 'var(--tk-text-secondary)',
                textTertiary: 'var(--tk-text-tertiary)',
                textAccent: 'var(--tk-text-accent)',
                textPrimaryAlternate: 'var(--tk-text-primary-alternate)',

                backgroundPage: 'var(--tk-background-page)',
                backgroundTransparent: 'var(--tk-background-transparent)',
                backgroundContent: 'var(--tk-background-content)',
                backgroundContentTint: 'var(--tk-background-content-tint)',
                backgroundContentAttention: 'var(--tk-background-content-attention)',
                backgroundOverlayStrong: 'var(--tk-background-overlay-strong)',
                backgroundOverlayLight: 'var(--tk-background-overlay-light)',
                backgroundOverlayExtraLight: 'var(--tk-background-overlay-extra-light)',
                backgroundHighlighted: 'var(--tk-background-highlighted)',

                iconPrimary: 'var(--tk-icon-primary)',
                iconSecondary: 'var(--tk-icon-secondary)',
                iconTertiary: 'var(--tk-icon-tertiary)',
                iconPrimaryAlternate: 'var(--tk-icon-primary-alternate)',

                buttonPrimaryBackground: 'var(--tk-button-primary-background)',
                buttonPrimaryForeground: 'var(--tk-button-primary-foreground)',
                buttonSecondaryBackground: 'var(--tk-button-secondary-background)',
                buttonSecondaryForeground: 'var(--tk-button-secondary-foreground)',
                buttonTertiaryBackground: 'var(--tk-button-tertiary-background)',
                buttonTertiaryForeground: 'var(--tk-button-tertiary-foreground)',
                buttonWarnBackground: 'var(--tk-button-warn-background)',
                buttonWarnForeground: 'var(--tk-button-warn-foreground)',
                buttonPrimaryBackgroundDisabled: 'var(--tk-button-primary-background-disabled)',
                buttonSecondaryBackgroundDisabled: 'var(--tk-button-secondary-background-disabled)',
                buttonTertiaryBackgroundDisabled: 'var(--tk-button-tertiary-background-disabled)',
                buttonWarnBackgroundDisabled: 'var(--tk-button-warn-background-disabled)',
                buttonPrimaryForegroundDisabled: 'var(--tk-button-primary-foreground-disabled)',
                buttonSecondaryForegroundDisabled: 'var(--tk-button-secondary-foreground-disabled)',
                buttonTertiaryForegroundDisabled: 'var(--tk-button-tertiary-foreground-disabled)',
                buttonWarnForegroundDisabled: 'var(--tk-button-warn-foreground-disabled)',
                buttonPrimaryBackgroundHighlighted:
                    'var(--tk-button-primary-background-highlighted)',
                buttonSecondaryBackgroundHighlighted:
                    'var(--tk-button-secondary-background-highlighted)',
                buttonTertiaryBackgroundHighlighted:
                    'var(--tk-button-tertiary-background-highlighted)',
                buttonWarnBackgroundHighlighted: 'var(--tk-button-warn-background-highlighted)',

                fieldBackground: 'var(--tk-field-background)',
                fieldActiveBorder: 'var(--tk-field-active-border)',
                fieldErrorBorder: 'var(--tk-field-error-border)',
                fieldErrorBackground: 'var(--tk-field-error-background)',

                accentBlue: 'var(--tk-accent-blue)',
                accentBlueConstant: 'var(--tk-accent-blue-constant)',
                accentGreen: 'var(--tk-accent-green)',
                accentRed: 'var(--tk-accent-red)',
                accentOrange: 'var(--tk-accent-orange)',
                accentPurple: 'var(--tk-accent-purple)',

                tabBarActiveIcon: 'var(--tk-tabbar-active-icon)',
                tabBarInactiveIcon: 'var(--tk-tabbar-inactive-icon)',

                separatorCommon: 'var(--tk-separator-common)',
                separatorAlternate: 'var(--tk-separator-alternate)',

                constantBlack: 'var(--tk-constant-black)',
                constantWhite: 'var(--tk-constant-white)',
                // `blue` and `red` are the legacy plain accents kept for parity
                // with `defaultTheme.blue` / `defaultTheme.red` — distinct from
                // `accentBlue`/`accentRed`.
                blue: 'var(--tk-blue)',
                red: 'var(--tk-red)'
            },
            borderRadius: {
                // Mirror the `corner*` scale on the styled-components theme.
                // Naming matches the source keys so a reader can grep both.
                corner3xSmall: 'var(--tk-corner-3xsmall)',
                corner2xSmall: 'var(--tk-corner-2xsmall)',
                cornerExtraSmall: 'var(--tk-corner-extra-small)',
                cornerSmall: 'var(--tk-corner-small)',
                cornerMedium: 'var(--tk-corner-medium)',
                cornerLarge: 'var(--tk-corner-large)',
                cornerFull: 'var(--tk-corner-full)'
            },
            fontFamily: {
                // Body font is set in `globalStyle.ts`; mono mirrors
                // `defaultTheme.fontMono` so future `font-mono` utilities pick
                // up the same stack.
                sans: ['Montserrat', 'sans-serif'],
                mono: [
                    'ui-monospace',
                    'SF Mono',
                    'monospace',
                    'Roboto Mono',
                    'Menlo',
                    'Consolas',
                    'Courier'
                ]
            },
            fontSize: {
                // Body1/Body2 sizes — referenced by Q6's WalletName migration
                // and any future port of a `Body*` consumer.
                body1: ['16px', '24px'],
                body2: ['14px', '20px']
            }
        }
    },
    // No corePlugins disabled; new-code surface is small enough that the full
    // utility set is fine. Re-evaluate in Q8 if the bundle delta exceeds 20KB.
    plugins: []
};

export default config;
