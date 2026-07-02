import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { Button, SwipeToConfirm } from '../../../primitives';
import { expect, screenshot, test } from '../../../../playwright/test';
import { SendConfirmScreen } from './SendConfirmScreen';
import { SendConfirmView } from './SendConfirmView';
import { NetworkFeeValue } from './NetworkFeeValue';
import { MultichainSendState } from './multichainSendShared';

const noop = () => {};

const TON: MultichainWalletAsset = {
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '33510000000',
    isHidden: false,
    price: new BigNumber('1.57')
};

const STATE: MultichainSendState = {
    asset: TON,
    toAddress: 'EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo',
    amount: 1_500_000_000n,
    amountDisplay: '1.5',
    isMax: false,
    comment: 'Thanks!'
};

const FRAME = 'w-[390px] bg-backgroundPage p-4';

// The confirm screen is screenshotted via its pure body (`SendConfirmView`):
// the container's network fee is an async chain-kit estimate that can't resolve
// deterministically in a component test, so the view lets us pin a resolved fee
// and a stable action. One screenshot per state (no breakpoint-dependent layout
// of its own — the action slot, not a media query, drives the swipe-vs-button
// difference).
screenshot('SendConfirm full', () => (
    <div className={FRAME}>
        <SendConfirmView
            asset={TON}
            accountName="Account 1"
            toAddress={STATE.toAddress}
            amountDisplay="1.5"
            amountFiat="$2.36"
            comment="Thanks!"
            fee={<NetworkFeeValue fiatText="$0.000262" symbol="TON" cryptoText="0.000262 TON" />}
            action={<SwipeToConfirm onConfirm={noop} label="Confirm" hint="Swipe right" />}
        />
    </div>
));

screenshot('SendConfirm fee error', () => (
    <div className={FRAME}>
        <SendConfirmView
            asset={TON}
            accountName="Account 1"
            toAddress={STATE.toAddress}
            amountDisplay="1.5"
            amountFiat="$2.36"
            fee={<NetworkFeeValue error onRetry={noop} />}
            feeError
            action={<SwipeToConfirm onConfirm={noop} disabled label="Confirm" hint="Swipe right" />}
        />
    </div>
));

screenshot('SendConfirm desktop button', () => (
    <div className={FRAME}>
        <SendConfirmView
            asset={TON}
            accountName="Account 1"
            toAddress={STATE.toAddress}
            amountDisplay="1.5"
            amountFiat="$2.36"
            comment="Thanks!"
            fee={<NetworkFeeValue fiatText="$0.000262" symbol="TON" cryptoText="0.000262 TON" />}
            action={
                <Button variant="primaryBlue" size="large" fullWidth>
                    Confirm
                </Button>
            }
        />
    </div>
));

// The screenshots above cover the visuals via the pure `SendConfirmView`. These
// mount the full `SendConfirmScreen` container (hooks + Modal) and assert only
// the summary built synchronously from `state` — the network fee is an async
// estimate that isn't resolvable in a component test.
test('SendConfirm renders the transfer summary from the send state', async ({ mount, page }) => {
    await mount(<SendConfirmScreen isOpen state={STATE} onClose={noop} onBack={noop} />);
    await expect(page.getByText('Confirm Action')).toBeVisible();
    await expect(page.getByText('1.5 TON')).toBeVisible();
    await expect(page.getByText('Thanks!')).toBeVisible();
    // Recipient is shown truncated (head 6 … tail 4).
    await expect(page.getByText('EQDtR_…Owzo')).toBeVisible();
});

test('SendConfirm omits the comment row when there is no comment', async ({ mount, page }) => {
    await mount(
        <SendConfirmScreen
            isOpen
            state={{ ...STATE, comment: undefined }}
            onClose={noop}
            onBack={noop}
        />
    );
    await expect(page.getByText('1.5 TON')).toBeVisible();
    await expect(page.getByText('Thanks!')).toHaveCount(0);
});
