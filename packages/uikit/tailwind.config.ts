import { join } from 'path';
import type { Config } from 'tailwindcss';

/**
 * Single source of truth for Tailwind across every Tonkeeper app. Sits in
 * uikit so the design-token bridge is defined once; each consumer app wires
 * PostCSS to pick up this config.
 *
 * Tokens are exposed as CSS custom properties on `:root` (see
 * `src/styles/tailwind.css`) and rewritten by `UserThemeProvider` whenever
 * the active styled-components theme changes. That keeps a Tailwind
 * `bg-textPrimary` rule rendering the same color as an adjacent
 * `styled.div``color: ${theme.textPrimary}`` ` rule under any active theme
 * (dark / pro — both are dark variants; there is no light theme).
 *
 * No `darkMode` config: both available themes are dark, so Tailwind's
 * `dark:` variant would be a no-op. Theme switching happens via the CSS
 * custom properties, not via a class on the root.
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
                backgroundContentPlaceholder: 'var(--tk-background-content-placeholder)',
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
                // Primary button green & red variants — static (single blue theme),
                // not synced through tailwindBridge.
                buttonPrimaryBackgroundGreen: 'var(--tk-button-primary-background-green)',
                buttonPrimaryBackgroundGreenHighlighted:
                    'var(--tk-button-primary-background-green-highlighted)',
                buttonPrimaryBackgroundGreenDisabled:
                    'var(--tk-button-primary-background-green-disabled)',
                buttonPrimaryBackgroundRed: 'var(--tk-button-primary-background-red)',
                buttonPrimaryBackgroundRedHighlighted:
                    'var(--tk-button-primary-background-red-highlighted)',
                buttonPrimaryBackgroundRedDisabled:
                    'var(--tk-button-primary-background-red-disabled)',

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
                // Canonical design-system "Corners" scale (Figma). Static —
                // backed by the `--tk-rounding-*` vars in tailwind.css, not the
                // legacy `--tk-corner-*` mirror (which stays for styled-components
                // and the isInsideTonkeeper shrink). Figma has no 24px tier.
                extraExtraSmall: 'var(--tk-rounding-extra-extra-small)',
                extraSmall: 'var(--tk-rounding-extra-small)',
                small: 'var(--tk-rounding-small)',
                medium: 'var(--tk-rounding-medium)',
                large: 'var(--tk-rounding-large)',
                full: 'var(--tk-rounding-full)',

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
                // Canonical design-system "Type" scale (Figma). Each entry is a
                // complete text style: size + line-height + weight. `text-body4Caps`
                // is rendered uppercase — add the `uppercase` utility at the call
                // site (transform isn't part of a font-size token).
                num1: ['32px', { lineHeight: '40px', fontWeight: '600' }],
                h1: ['32px', { lineHeight: '40px', fontWeight: '700' }],
                num2: ['28px', { lineHeight: '36px', fontWeight: '600' }],
                h2: ['24px', { lineHeight: '32px', fontWeight: '700' }],
                h3: ['20px', { lineHeight: '28px', fontWeight: '700' }],
                label1: ['16px', { lineHeight: '24px', fontWeight: '600' }],
                label2: ['14px', { lineHeight: '20px', fontWeight: '600' }],
                label3: ['12px', { lineHeight: '16px', fontWeight: '600' }],
                body1: ['16px', { lineHeight: '24px', fontWeight: '500' }],
                body2: ['14px', { lineHeight: '20px', fontWeight: '500' }],
                body3Alt: ['13px', { lineHeight: '16px', fontWeight: '500' }],
                body3: ['12px', { lineHeight: '16px', fontWeight: '500' }],
                body4Caps: ['10px', { lineHeight: '14px', fontWeight: '600' }]
            }
        }
    },
    // No corePlugins disabled; new-code surface is small enough that the full
    // utility set is fine. Re-evaluate in Q8 if the bundle delta exceeds 20KB.
    plugins: []
};

export default config;
