import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
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
 * set test-side (see playwright/test.ts).
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

// Wraps every mounted component in the app's real theme + global styles so
// screenshots match production rendering. Add new global providers (i18n,
// query client) here as components start to need them. `MemoryRouter` is
// loaded unconditionally because react-router-dom's `useHistory` /
// `useLocation` throw if mounted outside a router — the multichain
// portfolio rows call `useNavigate`, which transitively touches both.
beforeMount<HooksConfig>(async ({ App, hooksConfig }) => {
    const mode = hooksConfig?.mode ?? 'desktop';
    return (
        <ThemeProvider theme={themeForMode(mode)}>
            <GlobalStyle />
            <MemoryRouter>
                <App />
            </MemoryRouter>
        </ThemeProvider>
    );
});
