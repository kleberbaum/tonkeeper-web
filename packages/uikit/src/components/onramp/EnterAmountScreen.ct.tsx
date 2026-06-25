import { EnterAmountScreen } from './EnterAmountScreen';
import { screenshotEachMode } from '../../../playwright/test';

const noop = () => {};

screenshotEachMode(
    'EnterAmountScreen empty',
    () => (
        <EnterAmountScreen
            isOpen
            onClose={noop}
            onBack={noop}
            onContinue={noop}
            asset={{ assetId: 'ton/mainnet/coin', symbol: 'TON' }}
            fiat="USD"
            paymentMethod="card"
        />
    ),
    undefined,
    { target: 'dialog' }
);
