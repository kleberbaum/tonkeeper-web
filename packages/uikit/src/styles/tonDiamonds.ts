import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { DefaultTheme } from 'styled-components';

export type TonDiamondsAccentKey =
    | 'sky'
    | 'arctic'
    | 'azure'
    | 'iris'
    | 'flamingo'
    | 'coral'
    | 'marine'
    | 'ocean'
    | 'fluid'
    | 'galaxy'
    | 'cosmos'
    | 'andromeda';

export interface TonDiamondsAccent {
    primary: string;
    light: string;
    dark: string;
    metadataHex: string;
}

export const TonDiamondsCollectionAddress =
    '0:06d811f426598591b32b2c49f29f66c821368e4acb1de16762b04e0174532465';
export const TonDiamondsCollectionAddressUserFriendly =
    'EQAG2BH0JlmFkbMrLEnyn2bIITaOSssd4WdisE4BdFMkZbir';

// metadataHex is the value of nft.metadata.theme.main marking an accent; for marine and
// fluid the on-chain metadata deliberately differs from the displayed accent colors.
export const TonDiamondsAccents: Record<TonDiamondsAccentKey, TonDiamondsAccent> = {
    sky: { primary: '#509FFA', light: '#69ADFA', dark: '#407FC7', metadataHex: '#509FFA' },
    arctic: { primary: '#5089FA', light: '#6999FA', dark: '#406DC7', metadataHex: '#5089FA' },
    azure: { primary: '#7380FA', light: '#8C97FA', dark: '#5B66C7', metadataHex: '#7380FA' },
    iris: { primary: '#9B78FA', light: '#AD91FA', dark: '#7B5FC7', metadataHex: '#9B78FA' },
    flamingo: { primary: '#FA5AAF', light: '#FA73BB', dark: '#C7488B', metadataHex: '#FA5AAF' },
    coral: { primary: '#FA5A60', light: '#FA7378', dark: '#C7484C', metadataHex: '#FA5A60' },
    marine: { primary: '#50D1EB', light: '#67D5EB', dark: '#42ACC2', metadataHex: '#53DAF5' },
    ocean: { primary: '#8978FA', light: '#9F91FA', dark: '#6D5FC7', metadataHex: '#8978FA' },
    fluid: { primary: '#53E5B9', light: '#6EE5C1', dark: '#44BD98', metadataHex: '#5AFACA' },
    galaxy: { primary: '#F450FA', light: '#F569FA', dark: '#C240C7', metadataHex: '#F450FA' },
    cosmos: { primary: '#567FF0', light: '#6E91F0', dark: '#4464BD', metadataHex: '#567FF0' },
    andromeda: { primary: '#F0AF65', light: '#F0BA7D', dark: '#BD8A4F', metadataHex: '#F0AF65' }
};

export const tonDiamondsAccentKeys = Object.keys(TonDiamondsAccents) as TonDiamondsAccentKey[];

export const isTonDiamondsAccentKey = (value: unknown): value is TonDiamondsAccentKey =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(TonDiamondsAccents, value);

const nftThemeMain = (nft: NFT): string | undefined => {
    const theme = (nft.metadata as { theme?: { main?: unknown } } | undefined)?.theme;
    return typeof theme?.main === 'string' ? theme.main : undefined;
};

export const isTonDiamondsNft = (nft: NFT): boolean =>
    nft.collection?.address === TonDiamondsCollectionAddress && !!nftThemeMain(nft);

export const tonDiamondsNftImage = (nft: NFT | undefined): string | undefined => {
    if (!nft) {
        return undefined;
    }
    const image = (nft.metadata as { image_diamond?: unknown } | undefined)?.image_diamond;
    return typeof image === 'string' ? image : undefined;
};

export const tonDiamondsAccentKeyByNft = (nft: NFT): TonDiamondsAccentKey | undefined => {
    if (nft.collection?.address !== TonDiamondsCollectionAddress) {
        return undefined;
    }
    const main = nftThemeMain(nft)?.toUpperCase();
    if (!main) {
        return undefined;
    }
    return tonDiamondsAccentKeys.find(
        key => TonDiamondsAccents[key].metadataHex.toUpperCase() === main
    );
};

const hexToRgb = (hex: string): string => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
};

const gradientStops = [
    [0, 1],
    [6.67, 0.991353],
    [13.33, 0.96449],
    [20, 0.91834],
    [26.67, 0.852589],
    [33.33, 0.768225],
    [40, 0.668116],
    [46.67, 0.557309],
    [53.33, 0.442691],
    [60, 0.331884],
    [66.67, 0.231775],
    [73.33, 0.147411],
    [80, 0.0816599],
    [86.67, 0.03551],
    [93.33, 0.0086472],
    [100, 0]
];

const accentGradient = (deg: number, hex: string): string => {
    const rgb = hexToRgb(hex);
    const stops = gradientStops
        .map(([position, alpha]) =>
            alpha === 1 ? `${hex} ${position}%` : `rgba(${rgb}, ${alpha}) ${position}%`
        )
        .join(', ');
    return `linear-gradient(${deg}deg, ${stops})`;
};

export const applyTonDiamondsAccent = (
    theme: DefaultTheme,
    key: TonDiamondsAccentKey
): DefaultTheme => {
    const accent = TonDiamondsAccents[key];
    return {
        ...theme,
        textAccent: accent.primary,
        accentBlue: accent.primary,
        buttonPrimaryBackground: accent.primary,
        buttonPrimaryBackgroundDisabled: accent.dark,
        buttonPrimaryBackgroundHighlighted: accent.light,
        fieldActiveBorder: accent.primary,
        tabBarActiveIcon: accent.primary,
        gradientBlueTop: accentGradient(180, accent.primary),
        gradientBlueBottom: accentGradient(0, accent.primary)
    };
};

export const tonDiamondsMarketplaceUrl = (key: TonDiamondsAccentKey): string => {
    const colorName = key.charAt(0).toUpperCase() + key.slice(1);
    const filter = encodeURIComponent(JSON.stringify({ attributes: { Color: [colorName] } }));
    return `https://getgems.io/collection/${TonDiamondsCollectionAddressUserFriendly}/?filter=${filter}`;
};
