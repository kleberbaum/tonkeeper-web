import { FC } from 'react';

import {
    MultichainActivity,
    MultichainActivityType,
    MultichainChain
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { Loader } from '../../../../primitives';
import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainChainChips } from '../MultichainChainChips';
import { MultichainHistoryEmptyState } from './MultichainHistoryEmptyState';
import { MultichainHistoryRow } from './MultichainHistoryRow';
import { MultichainHistoryTypeFilter } from './MultichainHistoryTypeFilter';
import { historyGroupTitle } from './multichain-history-utils';

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

const MultichainHistoryHeader: FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation();
    return (
        <header className="relative flex h-16 shrink-0 items-center justify-center px-16">
            <button
                type="button"
                aria-label={t('wallet_asset_back')}
                onClick={onBack}
                className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground"
            >
                <ChevronLeft16 />
            </button>
            <div className="text-h3 text-textPrimary">{t('page_header_history')}</div>
        </header>
    );
};

export type MultichainHistoryGroup = [string, MultichainActivity[]];

export interface MultichainHistoryViewProps {
    /** Rendered inside the desktop shell's 520px column: no in-page header, sticky filter. */
    compact?: boolean;
    language: string;
    chain?: MultichainChain;
    onSelectChain: (chain?: MultichainChain) => void;
    activityType?: MultichainActivityType;
    onSelectType: (type?: MultichainActivityType) => void;
    groups: MultichainHistoryGroup[];
    isLoading: boolean;
    isEmpty: boolean;
    hasFilter: boolean;
    showTypeFilter: boolean;
    isFetchingNextPage: boolean;
    sentinelRef?: (el: HTMLDivElement | null) => void;
    onBack: () => void;
    onAddFunds: () => void;
    onSelectActivity: (activity: MultichainActivity) => void;
}

export const MultichainHistoryView: FC<MultichainHistoryViewProps> = ({
    compact = false,
    language,
    chain,
    onSelectChain,
    activityType,
    onSelectType,
    groups,
    isLoading,
    isEmpty,
    hasFilter,
    showTypeFilter,
    isFetchingNextPage,
    sentinelRef,
    onBack,
    onAddFunds,
    onSelectActivity
}) => {
    const rootClass = cn(
        'flex flex-col bg-backgroundPage',
        compact ? 'min-h-full' : 'min-h-screen',
        // Clear the fixed pill on mobile; the sticky pill takes flow space on desktop.
        showTypeFilter && !compact && 'pb-[88px]'
    );

    return (
        <div className={rootClass}>
            {!compact && <MultichainHistoryHeader onBack={onBack} />}

            <div className="relative px-4 py-2">
                <MultichainChainChips
                    value={chain}
                    onChange={next => onSelectChain(next as MultichainChain | undefined)}
                />
                {compact && (
                    <div className="pointer-events-none absolute inset-y-2 right-0 w-12 bg-gradient-to-l from-backgroundPage to-transparent" />
                )}
            </div>

            {isLoading && (
                <div className="flex flex-1 items-center justify-center py-16">
                    <Loader />
                </div>
            )}

            {isEmpty && (
                <div className="flex flex-1 items-center justify-center py-16">
                    <MultichainHistoryEmptyState
                        showAddFunds={!hasFilter}
                        onAddFunds={onAddFunds}
                    />
                </div>
            )}

            {!isEmpty &&
                groups.map(([key, items]) => (
                    <section key={key} className="flex flex-col">
                        <div className="px-4 pb-2 pt-4 text-label1 text-textPrimary">
                            {historyGroupTitle(language, key, items[0].blockTimeMs)}
                        </div>
                        <div className="flex flex-col gap-2 px-4">
                            {items.map((activity, i) => (
                                <MultichainHistoryRow
                                    key={`${activity.txIds[0] ?? activity.blockTimeMs}-${i}`}
                                    activity={activity}
                                    onClick={() => onSelectActivity(activity)}
                                />
                            ))}
                        </div>
                    </section>
                ))}

            {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                    <Loader />
                </div>
            )}
            <div ref={sentinelRef} />

            {showTypeFilter && (
                <MultichainHistoryTypeFilter
                    value={activityType}
                    onChange={onSelectType}
                    compact={compact}
                />
            )}
        </div>
    );
};
