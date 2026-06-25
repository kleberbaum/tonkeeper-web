import { ProviderDisclaimerModal } from './ProviderDisclaimerModal';
import { screenshotEachMode } from '../../../playwright/test';

const noop = () => {};

screenshotEachMode(
    'ProviderDisclaimerModal default',
    () => (
        <ProviderDisclaimerModal isOpen onClose={noop} onConfirm={noop} providerName="Mercuryo" />
    ),
    undefined,
    { target: 'dialog' }
);

screenshotEachMode(
    'ProviderDisclaimerModal loading',
    () => (
        <ProviderDisclaimerModal
            isOpen
            onClose={noop}
            onConfirm={noop}
            providerName="Mercuryo"
            isLoading
        />
    ),
    undefined,
    { target: 'dialog' }
);
