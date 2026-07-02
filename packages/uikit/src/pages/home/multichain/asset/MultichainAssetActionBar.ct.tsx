import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { MultichainAssetActionBar } from './MultichainAssetActionBar';

const ASSET: MultichainWalletAsset = {
    assetId: 'eth/mainnet/coin',
    chain: 'evm',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    image: '',
    balance: '0',
    isHidden: false
};

// Edge cases the screenshot suite targets:
//   - hasBalance true → Buy + Sell + more (3 controls).
//   - hasBalance false → Sell button is absent, only Buy + more remain
//     and Buy still stretches to fill the freed space.
//   - compact (desktop, sticky) vs non-compact (mobile, fixed) only
//     differ in positioning; the visual chrome is identical, so a single
//     screenshot per balance state is enough.

const FRAME = 'relative w-[390px] bg-backgroundPage';

screenshot('MultichainAssetActionBar with balance shows buy sell and more', () => (
    <div className={FRAME}>
        <MultichainAssetActionBar asset={ASSET} hasBalance compact />
    </div>
));

screenshot('MultichainAssetActionBar without balance hides sell', () => (
    <div className={FRAME}>
        <MultichainAssetActionBar asset={ASSET} hasBalance={false} compact />
    </div>
));

test('MultichainAssetActionBar renders sell only when there is a balance', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetActionBar asset={ASSET} hasBalance compact />
        </div>
    );
    await expect(c.getByText('Sell')).toBeVisible();
    await expect(c.getByText('Buy')).toBeVisible();
});

test('MultichainAssetActionBar omits sell button without a balance', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetActionBar asset={ASSET} hasBalance={false} compact />
        </div>
    );
    await expect(c.getByText('Buy')).toBeVisible();
    await expect(c.getByText('Sell')).toHaveCount(0);
});
