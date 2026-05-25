import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration as ConfigurationV2 } from '@tonkeeper/core/dist/tonApiV2';
import {
    defaultTonendpointConfig,
    Tonendpoint,
    TonendpointConfig
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import React, { useContext } from 'react';
import { AnalyticsTracker } from './analytics/common';

export interface IAppContext {
    mainnetApi: APIConfig;
    testnetApi: APIConfig;

    fiat: FiatCurrencies;
    mainnetConfig: TonendpointConfig;
    testnetConfig: TonendpointConfig;
    tonendpoint: Tonendpoint;
    standalone: boolean;
    extension: boolean;
    ios: boolean;
    proFeatures: boolean;
    experimental?: boolean;
    hideQrScanner?: boolean;
    hideSigner?: boolean;
    hideKeystone?: boolean;
    hideLedger?: boolean;
    hideMam?: boolean;
    hideMultisig?: boolean;
    hideBrowser?: boolean;
    hideFireblocks?: boolean;
    browserLength?: number;
    defaultWalletVersion: WalletVersion;
    /**
     * Phase 1 multichain plumbing. Required so each app makes an explicit
     * choice; in production builds this is `false` everywhere. Toggling
     * does nothing user-visible in Phase 1 — Phase 2+ gates the BIP39
     * multichain create/import flow on this flag (legacy TON-standard and
     * MAM paths remain available regardless). See
     * `MULTICHAIN_PHASE_1_TASKS.md` Track F and `MULTICHAIN_PLAN.md` line
     * 47 for the flag's scope.
     */
    multichainEnabled: boolean;
    tracker: AnalyticsTracker | undefined;
}

export const AppContext = React.createContext<IAppContext>({
    mainnetApi: {
        tonApiV2: new ConfigurationV2()
    },
    testnetApi: {
        tonApiV2: new ConfigurationV2()
    },
    fiat: FiatCurrencies.USD,
    mainnetConfig: defaultTonendpointConfig,
    testnetConfig: defaultTonendpointConfig,
    tonendpoint: null as unknown as Tonendpoint,
    standalone: false,
    extension: false,
    ios: false,
    proFeatures: false,
    hideQrScanner: false,
    defaultWalletVersion: WalletVersion.V5R1,
    multichainEnabled: false,
    tracker: undefined
});

export const useAppContext = () => {
    return useContext(AppContext);
};

export const AppSelectionContext = React.createContext<EventTarget | null>(null);
