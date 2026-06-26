import { FC } from 'react';

import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { useTranslation } from '../../../hooks/translation';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { AppRoute } from '../../../libs/routes';

const NftCard: FC<{ nft: NFT; onClick: () => void }> = ({ nft, onClick }) => {
    const image =
        nft.previews?.find(p => p.resolution === '500x500')?.url ?? nft.previews?.[0]?.url;
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-[160px] shrink-0 flex-col overflow-hidden rounded-medium bg-backgroundContent text-left"
        >
            <div className="aspect-square w-full bg-backgroundContentTint">
                {image && (
                    <img
                        src={image}
                        alt={nft.metadata?.name ?? ''}
                        className="h-full w-full object-cover"
                    />
                )}
            </div>
            <div className="px-3 py-2">
                <div className="truncate text-label3 text-textPrimary">
                    {nft.metadata?.name ?? '—'}
                </div>
                <div className="truncate text-body3 text-textSecondary">
                    {nft.collection?.name ?? ''}
                </div>
            </div>
        </button>
    );
};

export const HomeMultichainCollectibles: FC<{ nfts: NFT[] }> = ({ nfts }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (nfts.length === 0) return null;

    return (
        <section className="pt-4">
            <header className="flex items-center px-4 pb-2">
                <button
                    type="button"
                    className="flex items-center gap-1 text-label1 text-textPrimary"
                    onClick={() => navigate(AppRoute.purchases)}
                >
                    {t('wallet_collectibles')}
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
            </header>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {nfts.map(nft => (
                    <NftCard
                        key={nft.address}
                        nft={nft}
                        onClick={() => navigate(`${AppRoute.purchases}/${nft.address}`)}
                    />
                ))}
            </div>
        </section>
    );
};
