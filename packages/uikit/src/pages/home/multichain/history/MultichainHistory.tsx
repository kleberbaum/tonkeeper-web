import { FC, useMemo, useState } from 'react';

import {
    MultichainActivity,
    MultichainActivityType,
    MultichainChain
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { useFetchNext } from '../../../../hooks/useFetchNext';
import { MultichainRoute } from '../../../../libs/routes';
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

    const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useMultichainActivity({ chain, activityType });

    const activities = useMemo(() => (data?.pages ?? []).flatMap(page => page.activities), [data]);
    const groups = useMemo(() => groupMultichainActivities(activities), [activities]);

    const setSentinelRef = useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage);

    const hasFilter = chain !== undefined || activityType !== undefined;
    const isEmpty = !isLoading && activities.length === 0;
    // First-run empty (nothing ever, no filter) is the only state without the
    // type-filter pill — it shows the Add Funds prompt instead (per the mockup).
    const pureEmpty = isEmpty && !hasFilter;
    const showTypeFilter = !isLoading && !pureEmpty;

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
                hasFilter={hasFilter}
                showTypeFilter={showTypeFilter}
                isFetchingNextPage={isFetchingNextPage}
                sentinelRef={setSentinelRef}
                onBack={() => navigate(-1)}
                onAddFunds={() => navigate(MultichainRoute.home)}
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
