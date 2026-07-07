import { MultichainActivity } from '@tonkeeper/core/dist/service/multichainActivityService';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainHistoryRow } from './MultichainHistoryRow';

const SHIB = {
    assetId: 'eth/mainnet/erc20/0xshib',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    decimals: 18,
    image: ''
};
const USDT_TRON = {
    assetId: 'tron/mainnet/trc20/0xusdt',
    name: 'Tether',
    symbol: 'USD₮',
    decimals: 6,
    image: ''
};
const DAI_BASE = {
    assetId: 'base/mainnet/erc20/0xdai',
    name: 'Dai',
    symbol: 'DAI',
    decimals: 18,
    image: ''
};
const DAI_BSC = {
    assetId: 'bsc/mainnet/bep20/0xdai',
    name: 'Dai',
    symbol: 'DAI',
    decimals: 18,
    image: ''
};

const AT = Date.parse('2024-09-04T17:32:00Z');

const sent: MultichainActivity = {
    activityType: 'send',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'eth',
    toChain: 'eth',
    direction: 'out',
    txIds: ['eth:0xa'],
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    outToken: SHIB,
    outAmount: '1016000000000000000000'
};

const received: MultichainActivity = {
    activityType: 'receive',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'tron',
    toChain: 'tron',
    direction: 'in',
    txIds: ['tron:0xb'],
    fromAddress: 'TJ1234567890abcdefghijklmnopqrstuv',
    inToken: USDT_TRON,
    inAmount: '735310000'
};

const swap: MultichainActivity = {
    activityType: 'swap',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'base',
    toChain: 'bsc',
    direction: 'self',
    txIds: ['base:0xc', 'bsc:0xd'],
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    outToken: DAI_BASE,
    outAmount: '1017000000000000000000',
    inToken: DAI_BSC,
    inAmount: '1017000000000000000000'
};

const failed: MultichainActivity = { ...sent, status: 'failed' };
const pending: MultichainActivity = { ...sent, status: 'pending' };

const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundPage';

screenshot('MultichainHistoryRow sent', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={sent} />
    </div>
));

screenshot('MultichainHistoryRow received', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={received} />
    </div>
));

screenshot('MultichainHistoryRow swap two amounts', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={swap} />
    </div>
));

screenshot('MultichainHistoryRow failed shows status', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={failed} />
    </div>
));

screenshot('MultichainHistoryRow pending shows spinner', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={pending} />
    </div>
));

test('renders the amount, symbol and chain badge', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={sent} />
        </div>
    );
    await expect(c).toContainText('016');
    await expect(c).toContainText('SHIB');
    await expect(c).toContainText('ETH');
});

test('swap renders both the incoming and outgoing amounts', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={swap} />
        </div>
    );
    await expect(c).toContainText('BSC');
    await expect(c).toContainText('BASE');
});

test('fires onClick when tapped', async ({ mount }) => {
    let clicked = 0;
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={sent} onClick={() => (clicked += 1)} />
        </div>
    );
    await c.getByRole('button').click();
    expect(clicked).toBe(1);
});
