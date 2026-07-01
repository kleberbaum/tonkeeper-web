import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { DarkThemeContext } from '@tonkeeper/uikit/dist/components/Icon';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import { AppContext, IAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import { AppSdkContext } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
    I18nContext,
    TranslationContext,
    useTWithReplaces
} from '@tonkeeper/uikit/dist/hooks/translation';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useUserLanguage } from '@tonkeeper/uikit/dist/state/language';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useAccountsStateQuery, useActiveTonNetwork } from '@tonkeeper/uikit/dist/state/wallet';
import { defaultTheme } from '@tonkeeper/uikit/dist/styles/defaultTheme';
import { GlobalStyle } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { lightTheme } from '@tonkeeper/uikit/dist/styles/lightTheme';

import { initViewport } from '@tma.js/sdk';
import { SDKProvider } from '@tma.js/sdk-react';
import { FC, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import StandardErrorBoundary from './components/ErrorBoundary';
import { TwaAppSdk } from './libs/appSdk';
import { useStubAnalytics, useTwaAppViewport, useTwaErrorReporting } from './libs/hooks';
import { MiniAppClosed } from './stub/MiniAppClosed';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

export const App = () => {
    return (
        <StandardErrorBoundary>
            <SDKProvider>
                <QueryClientProvider client={queryClient}>
                    <TwaLoader />
                </QueryClientProvider>
            </SDKProvider>
        </StandardErrorBoundary>
    );
};

const TwaLoader = () => {
    const { data: sdk, error } = useQuery(['sdk'], async () => {
        const [willViewport] = initViewport();
        return new TwaAppSdk(await willViewport);
    });

    useEffect(() => {
        if (!sdk) return;

        // Telegram opens mini apps at partial height on mobile (iOS especially);
        // expand to the full available height so the bottom button is reachable.
        // Bots launched via the menu button aren't always in fullscreen mode, so
        // we expand here rather than relying on the bot's Telegram configuration.
        if (!sdk.viewport.isExpanded) {
            sdk.viewport.expand();
        }

        const theme = sdk.miniApp.isDark ? defaultTheme : lightTheme;

        if (sdk.miniApp.supports('setBackgroundColor')) {
            sdk.miniApp.setBgColor(theme.backgroundPage);
        }
        if (sdk.miniApp.supports('setHeaderColor')) {
            sdk.miniApp.setHeaderColor(theme.backgroundPage);
        }

        document.body.style.backgroundColor = theme.backgroundPage;
    }, [sdk]);

    if (error instanceof Error) {
        return <div>{error.message}</div>;
    }

    if (!sdk) {
        return <div />;
    }

    return (
        <AppSdkContext.Provider value={sdk}>
            <ThemeProvider theme={sdk.miniApp.isDark ? defaultTheme : lightTheme}>
                <DarkThemeContext.Provider value={sdk.miniApp.isDark}>
                    <GlobalStyle />
                    <GlobalListStyle />
                    <StubApp sdk={sdk} />
                </DarkThemeContext.Provider>
            </ThemeProvider>
        </AppSdkContext.Provider>
    );
};

const StubApp: FC<{ sdk: TwaAppSdk }> = ({ sdk }) => {
    const { t: tSimple, i18n } = useTranslation();
    const t = useTWithReplaces(tSimple);

    const translation = useMemo<I18nContext>(
        () => ({
            t,
            i18n: {
                enable: false,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as any,
                language: i18n.language,
                languages: []
            }
        }),
        [t, i18n]
    );

    return (
        <BrowserRouter>
            <TranslationContext.Provider value={translation}>
                <StorageContext.Provider value={sdk.storage}>
                    <Loader sdk={sdk} />
                </StorageContext.Provider>
            </TranslationContext.Provider>
        </BrowserRouter>
    );
};

const Loader: FC<{ sdk: TwaAppSdk }> = ({ sdk }) => {
    const { data: lang, isLoading: isLangLoading } = useUserLanguage();
    const { data: fiat } = useUserFiatQuery();
    const { data: accounts } = useAccountsStateQuery();
    const network = useActiveTonNetwork();
    const { i18n } = useTranslation();

    const { data: tracker } = useStubAnalytics(accounts, network, sdk.version);
    useTwaErrorReporting();

    useTwaAppViewport(false, sdk);

    // Apply the user's stored language (set in the old app) to i18next so the
    // stub renders localized; falls back to English when unset/unsupported.
    useEffect(() => {
        if (lang && i18n.language !== localizationText(lang)) {
            i18n.reloadResources([localizationText(lang)]).then(() =>
                i18n.changeLanguage(localizationText(lang))
            );
        }
    }, [lang, i18n]);

    const tonendpoint = useTonendpoint({
        build: sdk.version,
        network,
        lang,
        platform: 'twa'
    });
    const { data: serverConfig } = useTonenpointConfig(tonendpoint);

    const context = useMemo<IAppContext | undefined>(() => {
        if (!serverConfig || !fiat) {
            return undefined;
        }
        return {
            mainnetApi: getApiConfig(serverConfig.mainnetConfig),
            testnetApi: getApiConfig(serverConfig.testnetConfig),
            fiat,
            mainnetConfig: serverConfig.mainnetConfig,
            testnetConfig: serverConfig.testnetConfig,
            tonendpoint,
            standalone: true,
            extension: false,
            ios: true,
            proFeatures: false,
            hideLedger: true,
            hideSigner: true,
            hideKeystone: true,
            hideQrScanner: true,
            hideMam: true,
            hideMultisig: true,
            hideFireblocks: true,
            defaultWalletVersion: WalletVersion.V5R1,
            browserLength: 4,
            tracker: tracker?.track
        };
    }, [serverConfig, fiat, tonendpoint, tracker]);

    if (isLangLoading || !context) {
        return <Loading />;
    }

    return (
        <AppContext.Provider value={context}>
            <MiniAppClosed sdk={sdk} />
            <CopyNotification />
        </AppContext.Provider>
    );
};
