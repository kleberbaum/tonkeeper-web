import { FC, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ChainBadgeOverlay, ChainChip } from '../../../primitives';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { formatter } from '../../../hooks/balance';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../libs/routes';
import { isNativeRow, networkIcon, networkLabel, parseAssetIdHead } from './multichain-utils';

const diffClass = (raw: string | undefined): string => {
    if (!raw) return 'text-textSecondary';
    if (raw.startsWith('-')) return 'text-accentRed';
    if (raw.startsWith('+')) return 'text-accentGreen';
    return 'text-textSecondary';
};

export const HomeMultichainAssetRow: FC<{ asset: MultichainWalletAsset }> = ({ asset }) => {
    const { fiat } = useAppContext();
    const navigate = useNavigate();
    const native = isNativeRow(asset.assetId);
    const { network } = parseAssetIdHead(asset.assetId);

    const human = useMemo(
        () => new BigNumber(asset.balance).shiftedBy(-asset.decimals),
        [asset.balance, asset.decimals]
    );
    const fiatBalance = useMemo(
        () => (asset.price ? human.multipliedBy(asset.price) : undefined),
        [human, asset.price]
    );

    const chip = native ? null : <ChainChip label={networkLabel(network)} />;
    const badgeIcon = native ? undefined : networkIcon(network);

    // Native coins (BTC/ETH/TRX/TON) come back from the multichain
    // backend with `image: ""` — they're meant to be rendered using the
    // local chain icon. For jettons/tokens the `image` is a tonapi URL.
    const tokenIcon =
        asset.image && asset.image.length > 0 ? (
            <img
                src={asset.image}
                alt=""
                className="h-11 w-11 rounded-full bg-backgroundContent object-cover"
            />
        ) : (
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-backgroundContent [&>svg]:h-11 [&>svg]:w-11">
                {networkIcon(network) ?? null}
            </div>
        );

    return (
        <button
            type="button"
            onClick={() =>
                navigate(`${MultichainRoute.asset}/${encodeURIComponent(asset.assetId)}`)
            }
            className="flex w-full items-center gap-3 px-4 py-2 text-left"
        >
            <ChainBadgeOverlay icon={badgeIcon}>{tokenIcon}</ChainBadgeOverlay>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-label2 text-textPrimary">{asset.symbol}</span>
                    {chip}
                </div>
                <div className="flex items-center gap-1.5 text-body3 text-textSecondary">
                    {asset.price !== undefined && (
                        <span>{formatFiatCurrency(fiat, asset.price)}</span>
                    )}
                    {asset.diff24h && (
                        <span className={diffClass(asset.diff24h)}>{asset.diff24h}</span>
                    )}
                </div>
            </div>
            <div className="text-right">
                <div className="text-label2 text-textPrimary">{formatter.formatDisplay(human)}</div>
                {fiatBalance && (
                    <div className="text-body3 text-textSecondary">
                        {formatFiatCurrency(fiat, fiatBalance)}
                    </div>
                )}
            </div>
        </button>
    );
};
