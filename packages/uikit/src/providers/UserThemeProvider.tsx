import { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { DefaultTheme, ThemeProvider } from 'styled-components';
import {
    useAvailableThemes,
    useMutateUserUIPreferences,
    useUserUIPreferences
} from '../state/theme';
import { usePrevious } from '../hooks/usePrevious';
import { getUserOS } from '../libs/web';
import { syncThemeToTailwindVars } from '../styles/tailwindBridge';
export const UserThemeProvider: FC<
    PropsWithChildren<{
        displayType?: 'compact' | 'full-width';
        isPro?: boolean;
        isProSupported?: boolean;
        isInsideTonkeeper?: boolean;
        proDisplayType?: 'mobile' | 'desktop';
    }>
> = ({ children, displayType, isPro, isProSupported, isInsideTonkeeper, proDisplayType }) => {
    const { data: uiPreferences, isFetched: isUIPreferencesLoaded } = useUserUIPreferences();
    const { mutateAsync } = useMutateUserUIPreferences();
    const isProPrev = usePrevious(isPro);
    const availableThemes = useAvailableThemes();

    const [currentTheme, currentThemeName] = useMemo(() => {
        let themeName = uiPreferences?.theme;

        if (themeName === 'pro' && isPro === false) {
            themeName = 'dark';
        }

        if (!themeName && isPro) {
            themeName = 'pro';
        }

        if (isProPrev === false && isPro) {
            themeName = 'pro';
        }

        themeName = themeName || 'dark';

        let theme = availableThemes[themeName];

        if (displayType) {
            theme.displayType = displayType;
        }

        if (displayType === 'full-width' && proDisplayType) {
            theme.proDisplayType = proDisplayType;
        }

        theme.os = getUserOS();

        window.document.body.style.background = theme.backgroundPage;

        if (isInsideTonkeeper) {
            theme = {
                ...theme,
                corner3xSmall: '2px',
                corner2xSmall: '4px',
                cornerExtraSmall: '6px',
                cornerSmall: '8px',
                cornerMedium: '12px',
                cornerLarge: '16px',
                cornerFull: '100%'
            };
        }

        return [theme, themeName];
    }, [
        uiPreferences?.theme,
        displayType,
        isPro,
        isProPrev,
        isInsideTonkeeper,
        proDisplayType,
        availableThemes
    ]);

    useEffect(() => {
        if (currentTheme && uiPreferences && currentThemeName !== uiPreferences.theme) {
            mutateAsync({ theme: currentThemeName as 'dark' | 'pro' });
        }
    }, [mutateAsync, currentThemeName, uiPreferences, currentTheme]);

    useEffect(() => {
        if (!currentTheme) return;
        // Mirror the active styled-components theme into the CSS custom
        // properties consumed by Tailwind utilities. `isInsideTonkeeper`
        // rewrites corner tokens, so the sync is not a no-op even when the
        // theme name stays the same.
        syncThemeToTailwindVars(currentTheme as DefaultTheme);
        document.documentElement.dataset.theme = currentThemeName;
    }, [currentTheme, currentThemeName]);

    useEffect(() => {
        if (!currentTheme) return;
        // Mirror the active styled-components theme into the CSS custom
        // properties consumed by Tailwind utilities. `data-theme` is a debug
        // aid — both dark and pro flip the same tokens, so the active theme
        // is otherwise invisible in DevTools.
        syncThemeToTailwindVars(currentTheme as DefaultTheme);
        document.documentElement.dataset.theme = currentThemeName;
    }, [currentTheme, currentThemeName]);

    if (!isUIPreferencesLoaded || (isPro === undefined && isProSupported)) {
        return <div></div>;
    }

    return <ThemeProvider theme={currentTheme as DefaultTheme}>{children}</ThemeProvider>;
};
