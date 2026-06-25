import { useQuery } from '@tanstack/react-query';
import { fetchOnrampConfiguration } from '@tonkeeper/core/dist/onrampApi';
import type {
    ExchangePaymentMethodType,
    OnrampConfiguration
} from '@tonkeeper/core/dist/onrampApi';
import { QueryKey } from '../../libs/queryKey';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

export interface UseOnrampConfigurationParams {
    destinationChain?: string;
    fiat?: string;
    paymentMethod?: ExchangePaymentMethodType;
}

export const useOnrampConfiguration = (params: UseOnrampConfigurationParams = {}) => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useQuery<OnrampConfiguration, Error>(
        [
            QueryKey.onrampConfiguration,
            baseUrl,
            ctx.deviceCountryCode,
            ctx.timezone,
            ctx.platform,
            ctx.build,
            ctx.lang,
            params.destinationChain,
            params.fiat,
            params.paymentMethod
        ],
        () =>
            fetchOnrampConfiguration(baseUrl, {
                destinationChain: params.destinationChain,
                fiat: params.fiat,
                paymentMethod: params.paymentMethod,
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
