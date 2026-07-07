import { FC, useMemo, useState } from 'react';

import {
    MultichainActivity,
    MultichainActivityType,
    MultichainChain
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { useFetchNext } from '../../../../hooks/useFetchNext';
import {
    MULTICHAIN_ACTION_ADD_FUNDS,
    MULTICHAIN_ACTION_PARAM,
    MultichainRoute
} from '../../../../libs/routes';
import { useMultichainActivity } from '../../../../state/multichain/useMultichainActivity';
import { MultichainHistoryDetail } from './MultichainHistoryDetail';
import { MultichainHistoryView } from './MultichainHistoryView';
import { groupMultichainActivities } from './multichain-history-utils';

export const MultichainHistory: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const {
        i18n: { language }
    } = useTranslation();
    const navigate = useNavigate();
    const [chain, setChain] = useState<MultichainChain | undefined>(undefined);
    const [activityType, setActivityType] = useState<MultichainActivityType | undefined>(undefined);
    const [selected, setSelected] = useState<MultichainActivity | undefined>(undefined);

    const { data, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useMultichainActivity({ chain, activityType });

    const activities = useMemo(() => (data?.pages ?? []).flatMap(page => page.activities), [data]);
    const groups = useMemo(() => groupMultichainActivities(activities), [activities]);

    const setSentinelRef = useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage);

    const hasFilter = chain !== undefined || activityType !== undefined;
    // The feed retries are disabled, so a failed fetch is terminal: surface it
    // as an error rather than letting a zero-activity result masquerade as an
    // empty wallet.
    const showError = !isLoading && isError;
    const isEmpty = !isLoading && !isError && activities.length === 0;
    // First-run empty (nothing ever, no filter) is the only state without the
    // type-filter pill — it shows the Add Funds prompt instead (per the mockup).
    const pureEmpty = isEmpty && !hasFilter;
    const showTypeFilter = !isLoading && !showError && !pureEmpty;

    return (
        <>
            <MultichainHistoryView
                compact={compact}
                language={language}
                chain={chain}
                onSelectChain={setChain}
                activityType={activityType}
                onSelectType={setActivityType}
                groups={groups}
                isLoading={isLoading}
                isEmpty={isEmpty}
                isError={showError}
                onRetry={() => refetch()}
                hasFilter={hasFilter}
                showTypeFilter={showTypeFilter}
                isFetchingNextPage={isFetchingNextPage}
                sentinelRef={setSentinelRef}
                onBack={() => navigate(-1)}
                onAddFunds={() =>
                    navigate(
                        `${MultichainRoute.home}?${MULTICHAIN_ACTION_PARAM}=${MULTICHAIN_ACTION_ADD_FUNDS}`
                    )
                }
                onSelectActivity={setSelected}
            />

            <MultichainHistoryDetail
                activity={selected}
                isOpen={selected !== undefined}
                onClose={() => setSelected(undefined)}
            />
        </>
    );
};
