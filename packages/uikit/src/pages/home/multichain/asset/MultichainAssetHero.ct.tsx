import { screenshot } from '../../../../../playwright/test';
import { HeroAsset, HeroHarness } from './MultichainAssetHeroHarness';

// Edge cases the screenshot suite targets:
//   - native coin → no chain badge overlay on the icon.
//   - non-native (ERC20/TRC20) → small chain badge sits bottom-right of
//     the icon, NOT floated to the row's right edge (a flex-column
//     `align-items: stretch` regression we just fixed).
//   - sub-cent price → formatter renders meaningful precision rather
//     than collapsing to "$ 0".
//   - large positive diff → green; negative diff → red; missing price
//     → em-dash placeholder, layout doesn't collapse.

const sampleAsset = (overrides: Partial<HeroAsset>): HeroAsset => ({
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

const FRAME = 'w-[390px] bg-backgroundPage';

screenshot('MultichainAssetHero TON native with positive diff', () => (
    <div className={FRAME}>
        <HeroHarness asset={sampleAsset({ priceStr: '5.43', diff24h: '+2.34%' })} />
    </div>
));

screenshot('MultichainAssetHero TRC20 USDT chain badge pinned to icon', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({
                assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                chain: 'tron',
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                priceStr: '0.999',
                diff24h: '-0.02%'
            })}
        />
    </div>
));

screenshot('MultichainAssetHero sub-cent price formatted with precision', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
                chain: 'evm',
                name: 'Shiba Inu',
                symbol: 'SHIB',
                decimals: 18,
                priceStr: '0.00000234',
                diff24h: '-1.20%'
            })}
        />
    </div>
));

screenshot('MultichainAssetHero multi-digit positive diff still fits', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xc0ffee',
                chain: 'evm',
                name: 'Moonshot',
                symbol: 'MOON',
                decimals: 18,
                priceStr: '1234.56',
                diff24h: '+9876.54%'
            })}
        />
    </div>
));

screenshot('MultichainAssetHero no price falls back to em-dash', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x6b175474e89094c44da98b954eedeac495271d0f',
                chain: 'evm',
                name: 'Dai',
                symbol: 'DAI',
                decimals: 18
            })}
        />
    </div>
));
