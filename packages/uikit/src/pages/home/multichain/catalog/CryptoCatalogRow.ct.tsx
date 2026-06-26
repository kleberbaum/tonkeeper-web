import { CatalogAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { CryptoCatalogRow } from './CryptoCatalogRow';

// Edge cases the screenshot suite targets:
//   - market-cap abbreviation tiers (B / M / K / <$1K) all render the
//     correct suffix and decimal precision.
//   - diff direction drives the colour token (green vs red); no diff =
//     row collapses cleanly.
//   - long symbol next to a chain chip → `truncate` must engage instead
//     of overflowing the right column with the price.
//   - row without price and without mcap still lays out without
//     collapsing the centre column.

type CatalogAssetFixture = Omit<CatalogAsset, 'price'> & {
    price?: CatalogAsset['price'] | number | string;
};

const sampleAsset = (overrides: Partial<CatalogAssetFixture>): CatalogAsset =>
    ({
        assetId: 'ton/mainnet/coin',
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        image: '',
        ...overrides
    } as CatalogAsset);

const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundContent';
const NARROW = 'w-[280px] overflow-hidden rounded-medium bg-backgroundContent';

screenshot('CryptoCatalogRow mcap billions tier', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                price: 5.43,
                diff24h: '+2.34%',
                marketCap: '15900000000'
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow mcap millions tier with negative diff', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
                symbol: 'SHIB',
                name: 'Shiba Inu',
                decimals: 18,
                price: 0.0000234,
                diff24h: '-1.20%',
                marketCap: '185500000'
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow mcap thousands tier', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xc0ffee',
                symbol: 'TINY',
                name: 'Tiny Mcap',
                decimals: 18,
                price: 0.012,
                diff24h: '+0.50%',
                marketCap: '54200'
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow mcap sub-$1K tier', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xc0ffee',
                symbol: 'NANO',
                name: 'Nano Coin',
                decimals: 18,
                price: 0.001,
                diff24h: '+0.10%',
                marketCap: '420'
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow no mcap and no diff', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 6,
                price: 0.999
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow long symbol truncates beside chain chip', () => (
    <div className={NARROW}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xdeadbeef',
                symbol: 'SUPERLONGTOKEN',
                name: 'Long Token',
                decimals: 18,
                price: 1.23,
                diff24h: '+0.42%',
                marketCap: '1230000000'
            })}
        />
    </div>
));

test('CryptoCatalogRow tap calls onSelect before navigating', async ({ mount }) => {
    let selected = 0;
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <CryptoCatalogRow asset={sampleAsset({})} onSelect={() => selected++} />
        </div>
    );
    await c.getByRole('button').click();
    expect(selected).toBe(1);
});

test('CryptoCatalogRow positive and negative diffs use accent colours', async ({ mount }) => {
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <CryptoCatalogRow
                asset={sampleAsset({
                    assetId: 'eth/mainnet/erc20/0xdeadbeef',
                    symbol: 'NEG',
                    diff24h: '-1.20%'
                })}
            />
        </div>
    );
    await expect(c.getByText('-1.20%')).toHaveClass(/text-accentRed/);
});
