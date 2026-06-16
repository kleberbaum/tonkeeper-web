import { FC, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ChainBadgeOverlay, ChainChip } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency, formatter } from '../../../../hooks/balance';
import { isNativeRow, networkIcon, networkLabel, parseAssetIdHead } from '../multichain-utils';

const EyeVisible = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-textAccent">
        <path
            d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const EyeHidden = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-textTertiary">
        <path
            d="M2 12C2 12 5.5 5 12 5C13.7 5 15.2 5.5 16.5 6.2M22 12C22 12 18.5 19 12 19C10.3 19 8.8 18.5 7.5 17.8M14.5 9.5C15.5 10.4 15.5 13.6 14.5 14.5M9.5 14.5C8.5 13.6 8.5 10.4 9.5 9.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path d="M3 21L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const ManageCryptoRow: FC<{
    asset: MultichainWalletAsset;
    visible: boolean;
    onToggle: () => void;
}> = ({ asset, visible, onToggle }) => {
    const { fiat } = useAppContext();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);

    const human = useMemo(
        () => new BigNumber(asset.balance).shiftedBy(-asset.decimals),
        [asset.balance, asset.decimals]
    );
    const fiatBalance = useMemo(
        () => (asset.price ? human.multipliedBy(asset.price) : undefined),
        [human, asset.price]
    );

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

    const balanceLine = `${formatter.formatDisplay(human)} ${asset.symbol}`;
    const subtitle = fiatBalance
        ? `${balanceLine} · ${formatFiatCurrency(fiat, fiatBalance)}`
        : balanceLine;

    return (
        <button
            type="button"
            onClick={onToggle}
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
                <div className="text-body2 text-textSecondary">{subtitle}</div>
            </div>
            <div className="flex h-6 w-6 items-center justify-center">
                {visible ? <EyeVisible /> : <EyeHidden />}
            </div>
        </button>
    );
};
