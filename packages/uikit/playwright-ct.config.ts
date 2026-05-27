import { defineConfig, devices } from '@playwright/experimental-ct-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/**
 * Playwright Component Testing config for @tonkeeper/uikit.
 *
 * Tests are colocated next to components as `*.ct.tsx` files. They mount a real
 * React component in a real browser (via the Vite-backed CT runner) and assert
 * behaviour and/or pixel output (`toHaveScreenshot`).
 *
 * The CT runner uses its own Vite, which doesn't read the apps' postcss.config.
 * We wire Tailwind + autoprefixer here so the Tailwind stylesheet imported in
 * playwright/index.tsx (preflight, utilities, design-token :root vars) compiles
 * exactly as it does in the apps — otherwise Tailwind-styled components would
 * render unstyled in screenshots.
 *
 * Screenshots are platform-specific (the `{platform}` token below). Baselines
 * committed for CI are generated on Linux — see packages/uikit/UI_TESTING.md.
 */
export default defineConfig({
    testDir: './src',
    testMatch: /.*\.ct\.tsx$/,
    // Screenshots live next to the component they cover, in a `__screenshots__`
    // folder beside the test — e.g.
    //   src/components/fields/__screenshots__/Button.ct.tsx/button-primary.png
    // `{snapshotDir}` defaults to testDir (./src); `{testFileDir}` is relative to
    // it, so this resolves under src/ next to the test (without the prefix the
    // path drops `src/`). No platform suffix: baselines are generated and compared
    // on Linux only, so there is a single committed set. Other platforms skip
    // screenshot tests (see playwright/test.ts), so no per-OS baselines are written.
    snapshotPathTemplate: '{snapshotDir}/{testFileDir}/__screenshots__/{testFileName}/{arg}{ext}',

    timeout: 30_000,
    fullyParallel: true,
    // Never let a committed `test.only` pass silently on CI.
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : [['list']],

    use: {
        // Dedicated dev-server port so it doesn't clash with app dev servers.
        ctPort: 3100,
        trace: 'on-first-retry',
        ctViteConfig: {
            css: {
                postcss: {
                    plugins: [tailwindcss({ config: './tailwind.config.ts' }), autoprefixer()]
                }
            }
        }
    },

    expect: {
        toHaveScreenshot: {
            // Small tolerance to absorb sub-pixel antialiasing noise.
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
            scale: 'css'
        }
    },

    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
