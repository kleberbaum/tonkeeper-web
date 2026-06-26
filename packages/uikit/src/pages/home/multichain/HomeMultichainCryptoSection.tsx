import { FC } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useTranslation } from '../../../hooks/translation';
import { HomeMultichainAssetRow } from './HomeMultichainAssetRow';

export const HomeMultichainCryptoSection: FC<{ assets: MultichainWalletAsset[] }> = ({
    assets
}) => {
    const { t } = useTranslation();
    return (
        <section className="pt-4">
            <header className="flex items-center justify-between px-4 pb-2">
                <button
                    type="button"
                    className="flex items-center gap-1 text-label1 text-textPrimary"
                >
                    {t('wallet_crypto_section')}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 3 3 3-3 3"
                        />
                    </svg>
                </button>
                <button
                    type="button"
                    className="flex items-center gap-1 text-label2 text-textSecondary transition-colors hover:text-textPrimary"
                    onClick={() => {
                        /* Manage sheet — phase 2 */
                    }}
                >
                    {t('wallet_manage_assets')}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            d="M2 4h8M5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1 6h8m-5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z"
                        />
                    </svg>
                </button>
            </header>
            <div className="overflow-hidden rounded-medium bg-backgroundContent mx-4">
                {assets.map((asset, index) => (
                    <div
                        key={asset.assetId}
                        className={index === 0 ? '' : 'border-t border-separatorCommon'}
                    >
                        <HomeMultichainAssetRow asset={asset} />
                    </div>
                ))}
            </div>
        </section>
    );
};
