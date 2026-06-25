import { useMutation } from '@tanstack/react-query';
import { createOnrampOrder } from '@tonkeeper/core/dist/onrampApi';
import type { CreateOnrampOrderBody, OnrampOrderResult } from '@tonkeeper/core/dist/onrampApi';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

export const useCreateOnrampOrder = () => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useMutation<OnrampOrderResult, Error, CreateOnrampOrderBody>(body =>
        createOnrampOrder(baseUrl, {
            body,
            deviceCountryCode: ctx.deviceCountryCode,
            timezone: ctx.timezone,
            platform: ctx.platform,
            build: ctx.build
        })
    );
};
