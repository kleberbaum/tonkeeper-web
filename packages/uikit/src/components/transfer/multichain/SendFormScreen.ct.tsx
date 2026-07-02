import { expect, screenshotEachMode, test } from '../../../../playwright/test';
import { SendFormHarnessAsset, SendFormScreenHarness } from './SendFormScreenHarness';

const noop = () => {};

const TON: SendFormHarnessAsset = {
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '33510000000',
    isHidden: false,
    priceStr: '1.57'
};

// An EVM ERC-20 — carries a chain badge on the token pill and, being non-TON,
// hides the comment field.
const USDT_ETH: SendFormHarnessAsset = {
    assetId: 'eth/mainnet/erc20/0xdac17f958d2ee523a2206206994597c13d831ec7',
    chain: 'evm',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    image: '',
    balance: '250000000',
    isHidden: false,
    priceStr: '1'
};

// Full-screen flow modal — the body is portaled, so screenshot the dialog and
// capture both breakpoints (the modal card sizes to the viewport).
screenshotEachMode(
    'SendForm TON coin',
    () => (
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'SendForm EVM token',
    () => (
        <SendFormScreenHarness
            isOpen
            asset={USDT_ETH}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'SendForm prefilled',
    () => (
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
            initial={{
                toAddress: 'EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo',
                amountDisplay: '1.5',
                comment: 'Thanks!'
            }}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('SendForm renders the address + amount fields and disables Continue until filled', async ({
    mount,
    page
}) => {
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await expect(page.getByPlaceholder('Address or name')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('SendForm shows the comment field for TON', async ({ mount, page }) => {
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await expect(page.getByText('Comment')).toBeVisible();
});

test('SendForm omits the comment field for a non-TON asset', async ({ mount, page }) => {
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={USDT_ETH}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await expect(page.getByPlaceholder('Address or name')).toBeVisible();
    await expect(page.getByText('Comment')).toHaveCount(0);
});

test('SendForm token pill opens the asset switcher', async ({ mount, page }) => {
    let changed = 0;
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={() => (changed += 1)}
            onContinue={noop}
        />
    );
    await page.getByRole('button', { name: 'TON' }).click();
    expect(changed).toBe(1);
});
