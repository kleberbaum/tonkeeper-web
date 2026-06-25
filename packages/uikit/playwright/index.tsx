import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import resources from '../../locales/dist/i18n/default.json';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import { TranslationContext, tReplace } from '../src/hooks/translation';
import { defaultTheme } from '../src/styles/defaultTheme';
import { GlobalStyle } from '../src/styles/globalStyle';
// Tailwind preflight + utilities + design-token :root vars, same stylesheet the
// apps load. Required so Tailwind-styled components render like production (and
// so preflight's resets apply). Compiled by the Tailwind PostCSS plugin wired
// in playwright-ct.config.ts. The :root vars here are the default dark theme,
// which matches the `defaultTheme` used below; UserThemeProvider's runtime var
// sync isn't needed because there's only one theme.
import '../src/styles/tailwind.css';

/**
 * Component-test "mode". Every component should look right on a desktop-sized
 * viewport and on a phone-sized one, so screenshots are taken in both.
 *
 * The mode is forwarded from each test via `mount(..., { hooksConfig: { mode } })`
 * and selects the styled-components theme variant here; the matching viewport is
 * set test-side (see playwright/test.tsx).
 */
export type TestMode = 'desktop' | 'mobile';

export type HooksConfig = {
    mode?: TestMode;
};

const themeForMode = (mode: TestMode): DefaultTheme => ({
    ...defaultTheme,
    displayType: 'full-width',
    proDisplayType: mode === 'mobile' ? 'mobile' : 'desktop',
    os: mode === 'mobile' ? 'ios' : 'mac'
});

const enTranslations = resources.en.translation as Record<string, string>;

const translate = (key: string, replaces?: Record<string, string | number>) => {
    const count = typeof replaces?.count === 'number' ? replaces.count : undefined;
    const pluralKey = count === undefined ? undefined : `${key}_${count === 1 ? 'one' : 'other'}`;
    const template = (pluralKey && enTranslations[pluralKey]) ?? enTranslations[key] ?? key;
    return tReplace(template, replaces);
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
        mutations: { retry: false }
    }
});

// Wraps every mounted component in the app's real theme + global styles so
// screenshots match production rendering. Add new global providers (i18n,
// query client) here as components start to need them. `MemoryRouter` is
// loaded unconditionally because react-router-dom's `useHistory` /
// `useLocation` throw if mounted outside a router — the multichain
// portfolio rows call `useNavigate`, which transitively touches both.
beforeMount<HooksConfig>(async ({ App, hooksConfig }) => {
    const mode = hooksConfig?.mode ?? 'desktop';
    const testTranslationContext = {
        t: translate,
        i18n: {
            enable: true,
            reloadResources: async () => {},
            changeLanguage: async () => {},
            language: 'en',
            languages: ['en']
        }
    };
    (
        globalThis as typeof globalThis & {
            __TONKEEPER_TEST_I18N_CONTEXT?: typeof testTranslationContext;
        }
    ).__TONKEEPER_TEST_I18N_CONTEXT = testTranslationContext;
    return (
        <TranslationContext.Provider value={testTranslationContext}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={themeForMode(mode)}>
                    <GlobalStyle />
                    <MemoryRouter>
                        <App />
                    </MemoryRouter>
                </ThemeProvider>
            </QueryClientProvider>
        </TranslationContext.Provider>
    );
});
