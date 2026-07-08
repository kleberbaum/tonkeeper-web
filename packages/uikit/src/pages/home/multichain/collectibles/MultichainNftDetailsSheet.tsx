import { FC, ReactNode, useState } from 'react';

import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';

import { Button } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import { useIsUnverifiedNft, useMarkNftAsSpam } from '../../../../state/nft';
import { useActiveConfig, useActiveTonNetwork } from '../../../../state/wallet';
import IcVerification16 from '../../../../icons/components/IcVerification16';

/**
 * Two-line-clamped copy with a trailing accent "More" toggle, per the
 * mockup's Description block. Expansion is per-sheet-instance state; it
 * resets when the sheet remounts for another NFT.
 */
const ExpandableText: FC<{ text: string; className?: string }> = ({ text, className }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    // The "More" toggle is shown from a length heuristic rather than
    // measuring overflow — measuring needs a layout pass and the cost of a
    // false positive is just a toggle that expands nothing.
    const clamps = text.length > 100;
    return (
        <div className={className}>
            <span className={cn('whitespace-pre-line', !expanded && 'line-clamp-2')}>{text}</span>
            {clamps && !expanded && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="text-body2 text-textAccent"
                >
                    {t('wallet_asset_more')}
                </button>
            )}
        </div>
    );
};

const DetailsCell: FC<{
    label: string;
    value: ReactNode;
    onClick?: () => void;
    last?: boolean;
}> = ({ label, value, onClick, last }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex h-14 w-full items-center justify-between gap-4 px-4 text-left',
            !last && 'border-b border-separatorCommon'
        )}
    >
        <span className="shrink-0 text-body2 text-textSecondary">{label}</span>
        <span className="truncate text-label2 text-textPrimary">{value}</span>
    </button>
);

/**
 * NFT details sheet for multichain accounts. Informational: hero image,
 * name/collection/description, About collection, spam reporting for
 * unverified items, and on-chain details with an explorer link. Transfer
 * and DNS actions are deliberately absent — the multichain send flow has
 * no NFT support yet (the native multichain app stubs Transfer too).
 */
export const MultichainNftDetailsSheet: FC<{
    nft?: NFT;
    isOpen: boolean;
    onClose: () => void;
}> = ({ nft, isOpen, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const config = useActiveConfig();
    const network = useActiveTonNetwork();
    const isUnverified = useIsUnverifiedNft(nft);
    const { mutate: markAsSpam, isLoading: isMarkingSpam } = useMarkNftAsSpam();

    if (!nft) {
        return null;
    }

    const image =
        nft.previews?.find(p => p.resolution === '500x500')?.url ?? nft.previews?.[0]?.url;
    const name = nft.metadata?.name ?? toShortValue(formatAddress(nft.address, network, true));
    const description =
        typeof nft.metadata?.description === 'string' ? nft.metadata.description : undefined;
    const collectionDescription = nft.collection?.description;
    const attributes: { trait_type: string; value: string }[] = Array.isArray(
        nft.metadata?.attributes
    )
        ? nft.metadata.attributes.filter(
              (a: unknown): a is { trait_type: string; value: string } =>
                  !!a && typeof a === 'object' && 'trait_type' in a && 'value' in a
          )
        : [];

    const contractAddress = formatAddress(nft.address, network, true);
    const ownerAddress = nft.owner?.address ? formatAddress(nft.owner.address, network) : undefined;

    const onReportSpam = () =>
        markAsSpam(nft.collection ? { address: nft.address, collection: nft.collection } : nft, {
            onSuccess: onClose
        });

    return (
        <Modal isOpen={isOpen} onClose={onClose} topBarTitle={name}>
            {/* The Modal body already carries the sheet's 16px side/bottom padding. */}
            <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-medium bg-backgroundContent">
                    <div className="relative aspect-square w-full bg-backgroundContentTint">
                        {image && (
                            <img
                                src={image}
                                alt={name}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        )}
                    </div>
                    <div className="flex flex-col px-4 py-3.5">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-h2 text-textPrimary">{name}</span>
                            {nft.sale !== undefined && (
                                <span className="shrink-0 rounded-full bg-backgroundContentTint px-1.5 py-1 text-body4Caps uppercase text-textSecondary">
                                    {t('nft_on_sale')}
                                </span>
                            )}
                        </div>
                        {nft.collection?.name && (
                            <div className="flex items-center gap-1 text-body2 text-textSecondary">
                                <span className="truncate">{nft.collection.name}</span>
                                {nft.trust === 'whitelist' && (
                                    <IcVerification16 className="size-4 shrink-0" />
                                )}
                            </div>
                        )}
                        {description && (
                            <ExpandableText
                                text={description}
                                className="mt-2 text-body2 text-textSecondary"
                            />
                        )}
                    </div>
                    {collectionDescription && (
                        <div className="border-t border-separatorCommon px-4 py-3.5">
                            <div className="pb-2 text-label1 text-textPrimary">
                                {t('nft_about_collection')}
                            </div>
                            <ExpandableText
                                text={collectionDescription}
                                className="text-body2 text-textSecondary"
                            />
                        </div>
                    )}
                </div>

                {isUnverified && (
                    <Button
                        variant="secondary"
                        size="large"
                        fullWidth
                        loading={isMarkingSpam}
                        onClick={onReportSpam}
                    >
                        <span className="text-accentOrange">{t('multichain_nft_report_spam')}</span>
                    </Button>
                )}

                {attributes.length > 0 && (
                    <section>
                        <div className="py-3 text-h3 text-textPrimary">
                            {t('multichain_nft_properties')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {attributes.map(attr => (
                                <div
                                    key={`${attr.trait_type}-${attr.value}`}
                                    className="flex flex-col rounded-medium bg-backgroundContent px-3 py-2"
                                >
                                    <span className="text-body3 text-textSecondary">
                                        {attr.trait_type}
                                    </span>
                                    <span className="text-label2 text-textPrimary">
                                        {attr.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-h3 text-textPrimary">{t('nft_details')}</span>
                        <button
                            type="button"
                            onClick={() =>
                                sdk.openPage(config.NFTOnExplorerUrl.replace('%s', contractAddress))
                            }
                            className="text-label2 text-textAccent"
                        >
                            {t('nft_view_in_explorer')}
                        </button>
                    </div>
                    <div className="overflow-hidden rounded-medium bg-backgroundContent">
                        {ownerAddress && (
                            <DetailsCell
                                label={t('nft_owner_address')}
                                value={toShortValue(ownerAddress)}
                                onClick={() => sdk.copyToClipboard(ownerAddress, t('copied'))}
                            />
                        )}
                        <DetailsCell
                            label={t('nft_contract_address')}
                            value={toShortValue(contractAddress)}
                            onClick={() => sdk.copyToClipboard(contractAddress, t('copied'))}
                            last
                        />
                    </div>
                </section>
            </div>
        </Modal>
    );
};
