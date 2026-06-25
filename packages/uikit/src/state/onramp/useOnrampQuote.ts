import { useMutation } from '@tanstack/react-query';
import { fetchOnrampQuote } from '@tonkeeper/core/dist/onrampApi';
import type { OnrampQuoteRequestBody, OnrampQuotes } from '@tonkeeper/core/dist/onrampApi';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

export const useOnrampQuote = () => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useMutation<OnrampQuotes, Error, OnrampQuoteRequestBody>(body =>
        fetchOnrampQuote(baseUrl, {
            body,
            deviceCountryCode: ctx.deviceCountryCode,
            timezone: ctx.timezone,
            platform: ctx.platform,
            build: ctx.build
        })
    );
};
