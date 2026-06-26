import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration as ConfigurationV2 } from '@tonkeeper/core/dist/tonApiV2';
import { defaultTonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import resources from '../../locales/dist/i18n/default.json';
import tonkeeperEnSource from '../../locales/src/tonkeeper/en.json';
import tonkeeperWebEnSource from '../../locales/src/tonkeeper-web/en.json';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import { AppSdkContext } from '../src/hooks/appSdk';
import { AppContext, IAppContext } from '../src/hooks/appContext';
import { TranslationContext, tReplace } from '../src/hooks/translation';
import { QueryKey } from '../src/libs/queryKey';
import { defaultTheme } from '../src/styles/defaultTheme';
import { GlobalStyle } from '../src/styles/globalStyle';
import { buildActiveMultichainAccount } from './multichainAccountFixture';
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

// Flatten a namespace's `en.json` into the dotted-free, underscore-joined keys
// the app calls `t()` with. Mirrors `toDict` in locales' `task/build.ts` so the
// keys match what the real build emits; `tReplace` understands the `{{var}}` /
// `{var}` / `%{var}` placeholder forms left intact here, so no message rewrite
// is needed for rendering.
const flattenMessages = (
    obj: Record<string, unknown>,
    parentKey?: string
): Record<string, string> =>
    Object.entries(obj).reduce((acc, [rawKey, value]) => {
        const key = rawKey.replace(/\./g, '_').replace(/-/g, '_');
        const itemKey = parentKey ? `${parentKey}_${key}` : key;
        if (typeof value === 'string') {
            acc[itemKey] = value;
        } else if (value && typeof value === 'object') {
            Object.assign(acc, flattenMessages(value as Record<string, unknown>, itemKey));
        }
        return acc;
    }, {} as Record<string, string>);

// English source of truth = the committed `src/<namespace>/en.json` files. The
// dist `default.json` is a gitignored build artifact, and when built with
// `TOLGEE_TOKEN` set it reflects Tolgee — which lags the repo for keys still
// pending upload (see I18N_PENDING.md). Layering the flattened source UNDER the
// dist build means existing keys still resolve from dist while any brand-new
// source key falls through to its real copy instead of rendering as the raw
// key. New keys therefore need no harness edits — add the key to `en.json` and
// the screenshot renders it.
const enTranslations: Record<string, string> = {
    ...flattenMessages(tonkeeperEnSource as Record<string, unknown>),
    ...flattenMessages(tonkeeperWebEnSource as Record<string, unknown>),
    ...(resources.en.translation as Record<string, string>)
};

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

const testTonendpointConfig = {
    ...defaultTonendpointConfig,
    '2fa_public_key': '1',
    '2fa_api_url': 'https://example.com/2fa',
    '2fa_bot_url': 'https://t.me/tonkeeper_test_bot'
};

const testAppContext: IAppContext = {
    mainnetApi: {
        tonApiV2: new ConfigurationV2()
    },
    testnetApi: {
        tonApiV2: new ConfigurationV2()
    },
    fiat: FiatCurrencies.USD,
    mainnetConfig: testTonendpointConfig,
    testnetConfig: testTonendpointConfig,
    tonendpoint: null as unknown as IAppContext['tonendpoint'],
    standalone: false,
    extension: false,
    ios: false,
    proFeatures: false,
    hideQrScanner: false,
    defaultWalletVersion: WalletVersion.V5R1,
    multichainEnabled: true,
    tracker: undefined
};

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

    // Default active account: a fully-populated `AccountMultichain` (TON + EVM +
    // BTC + TRON) seeded into a `MockAppSdk`'s in-memory storage and exposed via
    // `AppSdkContext`. Components that read `useActiveAccount()` (the home header,
    // the receive sheet, the balance row) throw "No active account" without one;
    // `useActiveAccountQuery`'s queryFn reads this same storage, so the account
    // survives react-query refetches. Components that don't read it are
    // unaffected — the seeded sdk is otherwise an empty MockAppSdk.
    const sdk = new MockAppSdk();
    const account = buildActiveMultichainAccount();
    await sdk.storage.set(AppKey.ACCOUNTS, [account]);
    await sdk.storage.set(AppKey.ACTIVE_ACCOUNT_ID, account.id);
    queryClient.clear();
    queryClient.setQueryData([QueryKey.account, QueryKey.wallet], account);

    return (
        <TranslationContext.Provider value={testTranslationContext}>
            <AppSdkContext.Provider value={sdk}>
                <AppContext.Provider value={testAppContext}>
                    <QueryClientProvider client={queryClient}>
                        <ThemeProvider theme={themeForMode(mode)}>
                            <GlobalStyle />
                            <MemoryRouter>
                                <App />
                            </MemoryRouter>
                        </ThemeProvider>
                    </QueryClientProvider>
                </AppContext.Provider>
            </AppSdkContext.Provider>
        </TranslationContext.Provider>
    );
});
