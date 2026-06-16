import { FC } from 'react';

import { CatalogAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ChainBadgeOverlay, ChainChip } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';
import { isNativeRow, networkIcon, networkLabel, parseAssetIdHead } from '../multichain-utils';

function diffClass(raw: string | undefined): string {
    if (!raw) return 'text-textSecondary';
    if (raw.startsWith('-')) return 'text-accentRed';
    if (raw.startsWith('+')) return 'text-accentGreen';
    return 'text-textSecondary';
}

/**
 * Backend returns the market-cap amount as a decimal string in the
 * requested currency (no sign, no abbreviation). For the mockup-style
 * "$15.9B mcap" / "$185.5M mcap" line we abbreviate locally.
 */
function formatMarketCap(raw: string | undefined): string | null {
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B mcap`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M mcap`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K mcap`;
    return `$${n.toFixed(2)} mcap`;
}

export const CryptoCatalogRow: FC<{ asset: CatalogAsset; onSelect?: () => void }> = ({
    asset,
    onSelect
}) => {
    const { fiat } = useAppContext();
    const navigate = useNavigate();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);

    const handleClick = () => {
        if (onSelect) onSelect();
        navigate(`${MultichainRoute.asset}/${encodeURIComponent(asset.assetId)}`);
    };

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

    const priceNum = asset.price ? asset.price.toNumber() : undefined;
    const diff = asset.diff24h;
    const secondary = formatMarketCap(asset.marketCap);

    return (
        <button
            type="button"
            onClick={handleClick}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
            <ChainBadgeOverlay icon={native ? undefined : networkIcon(network)}>
                {tokenIcon}
            </ChainBadgeOverlay>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-label1 text-textPrimary">{asset.symbol}</span>
                    {!native && <ChainChip label={networkLabel(network)} />}
                </div>
                {secondary && <div className="text-body2 text-textSecondary">{secondary}</div>}
            </div>
            <div className="flex flex-col items-end">
                {priceNum !== undefined && !Number.isNaN(priceNum) && (
                    <div className="text-label1 text-textPrimary">
                        {formatFiatCurrency(fiat, priceNum)}
                    </div>
                )}
                {diff && <div className={`text-body2 ${diffClass(diff)}`}>{diff}</div>}
            </div>
        </button>
    );
};
