import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ChainBadgeOverlay } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { isNativeRow, networkIcon, parseAssetIdHead } from '../multichain-utils';

function diffClass(raw: string | undefined): string {
    if (!raw) return 'text-textSecondary';
    if (raw.startsWith('-')) return 'text-accentRed';
    if (raw.startsWith('+')) return 'text-accentGreen';
    return 'text-textSecondary';
}

export const MultichainAssetHero: FC<{ asset: MultichainWalletAsset }> = ({ asset }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);

    const tokenIcon =
        asset.image && asset.image.length > 0 ? (
            <img
                src={asset.image}
                alt=""
                className="h-14 w-14 rounded-full bg-backgroundContent object-cover"
            />
        ) : (
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-backgroundContent [&>svg]:h-14 [&>svg]:w-14">
                {networkIcon(network) ?? null}
            </div>
        );

    return (
        <section className="flex flex-col gap-3 px-6 pb-1 pt-2">
            <ChainBadgeOverlay
                className="self-start"
                icon={native ? undefined : networkIcon(network)}
            >
                {tokenIcon}
            </ChainBadgeOverlay>
            <div className="flex flex-col gap-1">
                <div className="text-h2 text-textPrimary">
                    {asset.price ? formatFiatCurrency(fiat, asset.price) : '—'}
                </div>
                <div className="flex items-center gap-2 text-body2 text-textSecondary">
                    {asset.diff24h && (
                        <span className={diffClass(asset.diff24h)}>{asset.diff24h}</span>
                    )}
                    <span>{t('wallet_asset_24h')}</span>
                </div>
            </div>
        </section>
    );
};
