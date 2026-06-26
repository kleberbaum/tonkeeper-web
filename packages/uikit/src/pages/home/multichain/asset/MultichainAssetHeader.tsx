import { FC } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { networkLabel, parseAssetIdHead } from '../multichain-utils';

const ChevronLeft16 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
            d="M10 4L6 8L10 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const Ellipsis16 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="3" cy="8" r="1.5" />
        <circle cx="8" cy="8" r="1.5" />
        <circle cx="13" cy="8" r="1.5" />
    </svg>
);

function tokenStandard(network: string, type: string): string {
    if (type === 'coin') return networkLabel(network);
    if (type === 'jetton') return `${networkLabel(network)} (Jetton)`;
    if (type === 'trc20') return `${networkLabel(network)} (TRC20)`;
    if (type === 'erc20') return `${networkLabel(network)} (ERC20)`;
    if (type === 'bep20') return `${networkLabel(network)} (BEP20)`;
    return networkLabel(network);
}

export const MultichainAssetHeader: FC<{ asset: MultichainWalletAsset }> = ({ asset }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { network, type } = parseAssetIdHead(asset.assetId);

    return (
        <header className="relative flex h-[64px] shrink-0 items-center justify-center px-16">
            <button
                aria-label={t('wallet_asset_back')}
                onClick={() => navigate(-1)}
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground"
            >
                <ChevronLeft16 />
            </button>
            <div className="flex flex-col items-center">
                <div className="text-h3 text-textPrimary">{asset.name}</div>
                <div className="text-body2 text-textSecondary">{tokenStandard(network, type)}</div>
            </div>
            <button
                aria-label={t('wallet_asset_more')}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground"
            >
                <Ellipsis16 />
            </button>
        </header>
    );
};
