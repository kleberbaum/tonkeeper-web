import { FC, useState } from 'react';

import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { Network } from '@tonkeeper/core/dist/entries/network';

import { AddRemoveButton, Button } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import IcChevronLeft16 from '../../../../icons/components/IcChevronLeft16';
import IcChevronRight16 from '../../../../icons/components/IcChevronRight16';
import { CollectiblesSettingsGroup } from './collectibles-settings-utils';

const GroupImage: FC<{ group: CollectiblesSettingsGroup; className?: string }> = ({
    group,
    className
}) => (
    <div className={cn('shrink-0 overflow-hidden rounded-lg bg-backgroundContentTint', className)}>
        {group.image && <img src={group.image} alt="" className="h-full w-full object-cover" />}
    </div>
);

const GroupRow: FC<{
    group: CollectiblesSettingsGroup;
    action: 'remove' | 'add' | 'details';
    onAction: () => void;
    last: boolean;
}> = ({ group, action, onAction, last }) => {
    const { t } = useTranslation();
    const subtitle = group.isSingle
        ? t('nft_single_nft')
        : t(group.count === 1 ? 'multichain_nft_count_one' : 'multichain_nft_count_other', {
              count: group.count
          });

    const content = (
        <>
            {action !== 'details' && (
                <AddRemoveButton type={action} onClick={onAction} className="shrink-0" />
            )}
            <GroupImage group={group} className="size-11" />
            <div className="min-w-0 flex-1">
                <div className="truncate text-label1 text-textPrimary">
                    {group.name || toShortValue(group.address)}
                </div>
                <div className="text-body2 text-textSecondary">{subtitle}</div>
            </div>
            {action === 'details' && (
                <IcChevronRight16 className="size-4 shrink-0 text-iconTertiary" />
            )}
        </>
    );

    const rowClass = cn(
        'flex w-full items-center gap-4 bg-backgroundContent px-4 py-4 text-left',
        !last && 'border-b border-separatorCommon'
    );

    if (action === 'details') {
        return (
            <button type="button" onClick={onAction} className={rowClass}>
                {content}
            </button>
        );
    }
    return <div className={rowClass}>{content}</div>;
};

const Section: FC<{
    title: string;
    groups: CollectiblesSettingsGroup[];
    action: 'remove' | 'add' | 'details';
    onAction: (group: CollectiblesSettingsGroup) => void;
}> = ({ title, groups, action, onAction }) => {
    if (groups.length === 0) {
        return null;
    }
    return (
        <section className="flex flex-col">
            <div className="px-4 py-3.5 text-h3 text-textPrimary">{title}</div>
            <div className="mx-4 mb-4 overflow-hidden rounded-medium">
                {groups.map((group, i) => (
                    <GroupRow
                        key={group.address}
                        group={group}
                        action={action}
                        onAction={() => onAction(group)}
                        last={i === groups.length - 1}
                    />
                ))}
            </div>
        </section>
    );
};

const TokenDetailsSheet: FC<{
    group?: CollectiblesSettingsGroup;
    network: Network;
    onNotSpam: () => void;
    onClose: () => void;
}> = ({ group, network, onNotSpam, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const address = group ? formatAddress(group.address, network, true) : '';

    return (
        <Modal isOpen={!!group} onClose={onClose} heading={t('multichain_nft_token_details')}>
            {/* The Modal body already carries the sheet's 16px side/bottom padding. */}
            {group && (
                <div className="flex flex-col gap-4">
                    <div className="overflow-hidden rounded-medium bg-backgroundContent">
                        <div className="flex h-14 items-center justify-between gap-4 border-b border-separatorCommon px-4">
                            <div className="min-w-0">
                                <div className="text-body3 text-textSecondary">
                                    {t('multichain_nft_name')}
                                </div>
                                <div className="truncate text-label2 text-textPrimary">
                                    {group.name || toShortValue(group.address)}
                                </div>
                            </div>
                            <GroupImage group={group} className="size-10" />
                        </div>
                        <button
                            type="button"
                            onClick={() => sdk.copyToClipboard(address, t('copied'))}
                            className="flex h-14 w-full flex-col justify-center px-4 text-left"
                        >
                            <span className="text-body3 text-textSecondary">
                                {group.isSingle
                                    ? t('multichain_nft_id_token')
                                    : t('multichain_nft_id_collection')}
                            </span>
                            <span className="truncate text-label2 text-textPrimary">
                                {toShortValue(address)}
                            </span>
                        </button>
                    </div>
                    <Button variant="secondary" size="large" fullWidth onClick={onNotSpam}>
                        {t('multichain_nft_not_spam')}
                    </Button>
                </div>
            )}
        </Modal>
    );
};

export interface MultichainCollectiblesSettingsViewProps {
    compact?: boolean;
    network: Network;
    visible: CollectiblesSettingsGroup[];
    hidden: CollectiblesSettingsGroup[];
    spam: CollectiblesSettingsGroup[];
    onBack: () => void;
    onHide: (group: CollectiblesSettingsGroup) => void;
    onShow: (group: CollectiblesSettingsGroup) => void;
    onNotSpam: (group: CollectiblesSettingsGroup) => void;
}

/**
 * Collectibles visibility management: Visible rows carry a remove (hide)
 * button, Hidden rows an add (show) button, and Spam rows open a token
 * details sheet whose only action is Not Spam.
 */
export const MultichainCollectiblesSettingsView: FC<MultichainCollectiblesSettingsViewProps> = ({
    compact = false,
    network,
    visible,
    hidden,
    spam,
    onBack,
    onHide,
    onShow,
    onNotSpam
}) => {
    const { t } = useTranslation();
    const [selectedSpam, setSelectedSpam] = useState<CollectiblesSettingsGroup | undefined>();

    return (
        <div
            className={cn(
                'flex flex-col bg-backgroundPage',
                compact ? 'min-h-full' : 'min-h-screen'
            )}
        >
            <header className="relative flex h-16 shrink-0 items-center justify-center px-16">
                <button
                    type="button"
                    aria-label={t('wallet_asset_back')}
                    onClick={onBack}
                    className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground"
                >
                    <IcChevronLeft16 className="size-4" />
                </button>
                <div className="text-h3 text-textPrimary">{t('settings_collectibles_list')}</div>
            </header>

            <Section
                title={t('multichain_collectibles_settings_visible')}
                groups={visible}
                action="remove"
                onAction={onHide}
            />
            <Section
                title={t('multichain_collectibles_settings_hidden')}
                groups={hidden}
                action="add"
                onAction={onShow}
            />
            <Section
                title={t('multichain_collectibles_settings_spam')}
                groups={spam}
                action="details"
                onAction={setSelectedSpam}
            />

            <TokenDetailsSheet
                group={selectedSpam}
                network={network}
                onNotSpam={() => {
                    if (selectedSpam) {
                        onNotSpam(selectedSpam);
                    }
                    setSelectedSpam(undefined);
                }}
                onClose={() => setSelectedSpam(undefined)}
            />
        </div>
    );
};
