import { ChooseAssetScreen } from './ChooseAssetScreen';
import { OnrampAsset, OnrampConfiguration } from '@tonkeeper/core/dist/onrampApi';
import { screenshotEachMode } from '../../../playwright/test';
import type { Route } from 'playwright-core';
import { readFile } from 'fs/promises';
import path from 'path';

const noop = () => {};
const testAssetsDir = path.resolve(process.cwd(), '../../tests/playwright/test-assets');

const imageUrls = {
    ton: 'https://assets.tonkeeper.test/onramp/asset-ton.jpg',
    btc: 'https://assets.tonkeeper.test/onramp/asset-btc.jpg',
    eth: 'https://assets.tonkeeper.test/onramp/asset-eth.jpeg',
    usdtTon: 'https://assets.tonkeeper.test/onramp/asset-usdt-ton.webp',
    usdtTron: 'https://assets.tonkeeper.test/onramp/asset-usdt-tron.jpg',
    usdcEth: 'https://assets.tonkeeper.test/onramp/asset-usdc-eth.jpeg',
    networkTon: 'https://assets.tonkeeper.test/onramp/network-ton.jpg',
    networkBtc: 'https://assets.tonkeeper.test/onramp/network-btc.jpg',
    networkEth: 'https://assets.tonkeeper.test/onramp/network-eth.jpeg',
    networkTron: 'https://assets.tonkeeper.test/onramp/network-tron.webp'
} as const;

const imageAssetByUrl: Record<string, { fileName: string; contentType: string }> = {
    [imageUrls.ton]: { fileName: 'duck1.jpg', contentType: 'image/jpeg' },
    [imageUrls.btc]: { fileName: 'duck2.jpg', contentType: 'image/jpeg' },
    [imageUrls.eth]: { fileName: 'duck3.jpeg', contentType: 'image/jpeg' },
    [imageUrls.usdtTon]: { fileName: 'duck4.webp', contentType: 'image/webp' },
    [imageUrls.usdtTron]: { fileName: 'duck1.jpg', contentType: 'image/jpeg' },
    [imageUrls.usdcEth]: { fileName: 'duck2.jpg', contentType: 'image/jpeg' },
    [imageUrls.networkTon]: { fileName: 'duck1.jpg', contentType: 'image/jpeg' },
    [imageUrls.networkBtc]: { fileName: 'duck2.jpg', contentType: 'image/jpeg' },
    [imageUrls.networkEth]: { fileName: 'duck3.jpeg', contentType: 'image/jpeg' },
    [imageUrls.networkTron]: { fileName: 'duck4.webp', contentType: 'image/webp' }
};

const asset = (overrides: {
    assetId: string;
    symbol: string;
    networkName?: string;
    networkImage?: string;
    image?: string;
}): OnrampAsset => ({
    assetId: overrides.assetId,
    symbol: overrides.symbol,
    networkName: overrides.networkName,
    networkImage: overrides.networkImage,
    image: overrides.image,
    decimals: 6,
    stablecoin: overrides.symbol === 'USDT' || overrides.symbol === 'USDC',
    extraIdRequired: false,
    availableMethods: ['card'],
    availableFiats: ['USD']
});

const fixtureConfiguration: OnrampConfiguration = {
    assets: [
        asset({
            assetId: 'ton/mainnet/coin',
            symbol: 'TON',
            networkName: 'TON',
            networkImage: imageUrls.networkTon,
            image: imageUrls.ton
        }),
        asset({
            assetId: 'btc/mainnet/coin',
            symbol: 'BTC',
            networkName: 'Bitcoin',
            networkImage: imageUrls.networkBtc,
            image: imageUrls.btc
        }),
        asset({
            assetId: 'eth/mainnet/coin',
            symbol: 'ETH',
            networkName: 'Ethereum',
            networkImage: imageUrls.networkEth,
            image: imageUrls.eth
        }),
        asset({
            assetId: 'ton/mainnet/jetton/usdt',
            symbol: 'USDT',
            networkName: 'TON',
            networkImage: imageUrls.networkTon,
            image: imageUrls.usdtTon
        }),
        asset({
            assetId: 'tron/mainnet/token/usdt',
            symbol: 'USDT',
            networkName: 'TRON',
            networkImage: imageUrls.networkTron,
            image: imageUrls.usdtTron
        }),
        asset({
            assetId: 'eth/mainnet/token/usdc',
            symbol: 'USDC',
            networkName: 'Ethereum',
            networkImage: imageUrls.networkEth,
            image: imageUrls.usdcEth
        })
    ]
};

type ScreenshotOptions = NonNullable<Parameters<typeof screenshotEachMode>[3]>;
type SetupPage = NonNullable<ScreenshotOptions['setupPage']>;

const setupImageMocks: SetupPage = async page => {
    const imageDataByUrl: Record<string, { body: Buffer; contentType: string }> = {};
    for (const [url, imageAsset] of Object.entries(imageAssetByUrl)) {
        imageDataByUrl[url] = {
            body: await readFile(path.join(testAssetsDir, imageAsset.fileName)),
            contentType: imageAsset.contentType
        };
    }

    await page.route('**/onramp/*.*', async (route: Route) => {
        const imageData = imageDataByUrl[route.request().url()];
        if (!imageData) {
            await route.fulfill({ status: 404 });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: imageData.contentType,
            body: imageData.body
        });
    });
};

screenshotEachMode(
    'ChooseAssetScreen with assets',
    () => (
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onBack={noop}
            configuration={fixtureConfiguration}
        />
    ),
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

screenshotEachMode(
    'ChooseAssetScreen loading',
    () => <ChooseAssetScreen isOpen onClose={noop} onSelect={noop} onBack={noop} isLoading />,
    undefined,
    { target: 'dialog' }
);

screenshotEachMode(
    'ChooseAssetScreen empty',
    () => (
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onBack={noop}
            configuration={{ assets: [] }}
        />
    ),
    undefined,
    { target: 'dialog' }
);
