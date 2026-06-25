import { useQuery } from '@tanstack/react-query';
import { fetchExchangeLayout } from '@tonkeeper/core/dist/onrampApi';
import type { OnrampLayoutCards } from '@tonkeeper/core/dist/onrampApi';
import { QueryKey } from '../../libs/queryKey';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

// The app-wide fiat is for *displaying balances*; the deposit flow's fiat
// is a separate idea. We deliberately omit `currency` so the backend picks
// a region-appropriate default from `device_country_code` (e.g. RSD for
// RS), and surface it back through `card.preferredCurrency`.
export const useExchangeLayout = (flow: 'deposit' | 'withdraw' = 'deposit') => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useQuery<OnrampLayoutCards, Error>(
        [
            QueryKey.exchangeLayout,
            baseUrl,
            flow,
            ctx.deviceCountryCode,
            ctx.timezone,
            ctx.platform,
            ctx.build,
            ctx.lang
        ],
        () =>
            fetchExchangeLayout(baseUrl, {
                flow,
                deviceCountryCode: ctx.deviceCountryCode,
                timezone: ctx.timezone,
                platform: ctx.platform,
                build: ctx.build,
                lang: ctx.lang
            }),
        {
            enabled: !!baseUrl,
            staleTime: 5 * 60 * 1000
        }
    );
};
