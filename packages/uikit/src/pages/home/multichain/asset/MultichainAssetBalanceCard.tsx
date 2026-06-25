import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';
import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ChainBadgeOverlay } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency, formatter } from '../../../../hooks/balance';
import { isNativeRow, networkIcon, parseAssetIdHead } from '../multichain-utils';

export const MultichainAssetBalanceCard: FC<{
    asset: MultichainWalletAsset;
    human: BigNumber;
}> = ({ asset, human }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);

    const fiatValue = asset.price ? human.multipliedBy(asset.price) : undefined;

    const tokenIcon =
        asset.image && asset.image.length > 0 ? (
            <img
                src={asset.image}
                alt=""
                className="h-11 w-11 rounded-full bg-backgroundContentTint object-cover"
            />
        ) : (
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-backgroundContentTint [&>svg]:h-11 [&>svg]:w-11">
                {networkIcon(network) ?? null}
            </div>
        );

    return (
        <section className="flex flex-col px-4 pb-4">
            <div className="py-3 text-label1 text-textPrimary">
                {t('wallet_asset_your_balance')}
            </div>
            <div className="overflow-hidden rounded-2xl bg-backgroundContent">
                <div className="flex items-center gap-2 px-4 py-4">
                    <ChainBadgeOverlay
                        className="shrink-0"
                        icon={native ? undefined : networkIcon(network)}
                    >
                        {tokenIcon}
                    </ChainBadgeOverlay>
                    <div className="flex flex-1 flex-col">
                        <div className="text-label1 text-textPrimary">
                            {formatter.formatDisplay(human)} {asset.symbol}
                        </div>
                        {fiatValue && (
                            <div className="text-body2 text-textSecondary">
                                {formatFiatCurrency(fiat, fiatValue)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
