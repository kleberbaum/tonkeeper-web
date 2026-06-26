import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { expect, screenshot, test } from '../../../../playwright/test';
import { MoreAssetsButton } from './MoreAssetsButton';

// Edge cases the suite targets:
//   - avatar stack previews at most the first 2 of `previewAssets`; extra
//     entries are dropped, so the left stack never grows past two circles.
//   - empty `previewAssets` → the stack renders nothing, label + chevron
//     still sit on a single row.
//   - native asset (e.g. ton/mainnet/coin) falls back to the local chain
//     icon when `image` is empty; a remote `image` renders as an <img>.
//   - the whole row is one button → tapping anywhere fires `onClick`.

const sampleAsset = (overrides: Partial<MultichainWalletAsset>): MultichainWalletAsset => ({
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'TON',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '0',
    isHidden: false,
    ...overrides
});

// CT's static mount-loader can't resolve component wrappers defined in the
// test file — inline the sized card container.
const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundContent';

const PREVIEW_TWO = [
    sampleAsset({ assetId: 'eth/mainnet/coin', chain: 'evm', symbol: 'ETH' }),
    sampleAsset({ assetId: 'btc/mainnet/coin', chain: 'btc', symbol: 'BTC' })
];

screenshot('MoreAssetsButton with two preview avatars', () => (
    <div className={CARD}>
        <MoreAssetsButton previewAssets={PREVIEW_TWO} onClick={() => {}} />
    </div>
));

screenshot('MoreAssetsButton caps the preview stack at two', () => (
    <div className={CARD}>
        <MoreAssetsButton
            previewAssets={[
                ...PREVIEW_TWO,
                sampleAsset({ assetId: 'tron/mainnet/coin', chain: 'tron', symbol: 'TRX' })
            ]}
            onClick={() => {}}
        />
    </div>
));

screenshot('MoreAssetsButton with no preview assets', () => (
    <div className={CARD}>
        <MoreAssetsButton previewAssets={[]} onClick={() => {}} />
    </div>
));

test('MoreAssetsButton renders the label and fires onClick', async ({ mount }) => {
    let clicks = 0;
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <MoreAssetsButton previewAssets={PREVIEW_TWO} onClick={() => clicks++} />
        </div>
    );
    await expect(c).toContainText('More assets');
    await c.getByRole('button').click();
    expect(clicks).toBe(1);
});

test('MoreAssetsButton renders at most two preview avatars', async ({ mount }) => {
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <MoreAssetsButton
                previewAssets={[
                    ...PREVIEW_TWO,
                    sampleAsset({ assetId: 'tron/mainnet/coin', chain: 'tron', symbol: 'TRX' })
                ]}
                onClick={() => {}}
            />
        </div>
    );
    // Native rows with an empty image render their chain icon as an inline svg.
    await expect(c.locator('svg')).toHaveCount(3); // 2 avatars + the chevron
});
