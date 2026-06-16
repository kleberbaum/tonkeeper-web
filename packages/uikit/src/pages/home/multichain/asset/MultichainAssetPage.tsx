import { FC, useState } from 'react';
import BigNumber from 'bignumber.js';

import { useMultichainWalletAsset } from '../../../../state/multichain/useMultichainWalletAsset';
import { useAssetDetails } from '../../../../state/trading/useAssetDetails';
import { ChartPeriod } from '../../../../state/trading/useAssetCharts';
import { MultichainAssetHeader } from './MultichainAssetHeader';
import { MultichainAssetHero } from './MultichainAssetHero';
import { MultichainAssetChart } from './MultichainAssetChart';
import { MultichainAssetPeriodSelector } from './MultichainAssetPeriodSelector';
import { MultichainAssetBalanceCard } from './MultichainAssetBalanceCard';
import { MultichainAssetAbout } from './MultichainAssetAbout';
import { MultichainAssetOverview } from './MultichainAssetOverview';
import { MultichainAssetTradingActivity } from './MultichainAssetTradingActivity';
import { MultichainAssetLinks } from './MultichainAssetLinks';
import { MultichainAssetActionBar } from './MultichainAssetActionBar';

export const MultichainAssetPage: FC<{ assetId: string; compact?: boolean }> = ({
    assetId,
    compact = false
}) => {
    const { asset, isFetching } = useMultichainWalletAsset(assetId);
    const { data: details } = useAssetDetails(assetId);
    const [period, setPeriod] = useState<ChartPeriod>('M');

    if (!asset) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-backgroundPage text-textSecondary">
                {isFetching ? 'Loading…' : 'Asset not found'}
            </div>
        );
    }

    const human = new BigNumber(asset.balance).shiftedBy(-asset.decimals);
    const hasBalance = human.isGreaterThan(0);

    // Compact (desktop): the page is a direct child of the 520px scroll
    // column, so it fills the column and the action bar sticks to the
    // column's bottom edge (sticky takes flow space — no extra padding).
    // Full (mobile): the page owns the viewport, so min-h-screen +
    // pb-[120px] keep content from sitting under the fixed action bar.
    const rootClass = compact
        ? 'flex min-h-full flex-col bg-backgroundPage'
        : 'flex min-h-screen flex-col bg-backgroundPage pb-[120px]';

    return (
        <div className={rootClass}>
            <MultichainAssetHeader asset={asset} />
            <MultichainAssetHero asset={asset} />
            <MultichainAssetChart assetId={assetId} period={period} />
            <MultichainAssetPeriodSelector value={period} onChange={setPeriod} />
            {hasBalance && <MultichainAssetBalanceCard asset={asset} human={human} />}
            {details?.about && <MultichainAssetAbout about={details.about} />}
            {details?.overview && <MultichainAssetOverview overview={details.overview} />}
            {details?.tradingActivity && (
                <MultichainAssetTradingActivity activity={details.tradingActivity} />
            )}
            {details?.links && <MultichainAssetLinks links={details.links} />}
            <MultichainAssetActionBar hasBalance={hasBalance} compact={compact} />
        </div>
    );
};
