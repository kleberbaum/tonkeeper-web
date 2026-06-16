import { useQuery } from '@tanstack/react-query';

import { ChartPoint, getAssetCharts } from '@tonkeeper/core/dist/service/tradingService';

import { QueryKey } from '../../libs/queryKey';
import { useUserFiat } from '../fiat';

export type ChartPeriod = 'H' | 'D' | 'W' | 'M' | '6M' | 'Y';

interface PeriodConfig {
    /** Window length in seconds. */
    durationSec: number;
    /** Default points-count to ask for; matches iOS/Android defaults. */
    pointsCount: number;
}

const PERIOD_CONFIG: Record<ChartPeriod, PeriodConfig> = {
    H: { durationSec: 60 * 60, pointsCount: 60 },
    D: { durationSec: 24 * 60 * 60, pointsCount: 96 },
    W: { durationSec: 7 * 24 * 60 * 60, pointsCount: 168 },
    M: { durationSec: 30 * 24 * 60 * 60, pointsCount: 180 },
    '6M': { durationSec: 6 * 30 * 24 * 60 * 60, pointsCount: 180 },
    Y: { durationSec: 365 * 24 * 60 * 60, pointsCount: 365 }
};

export interface AssetChartsData {
    points: ChartPoint[];
    /** Min price in the window — useful for axis-label rendering. */
    minPrice?: number;
    /** Max price in the window. */
    maxPrice?: number;
}

export const useAssetCharts = (assetId: string, period: ChartPeriod) => {
    const fiat = useUserFiat();

    return useQuery<AssetChartsData | null, Error>(
        [QueryKey.tradingAssetCharts, assetId, period, fiat],
        async () => {
            const { durationSec, pointsCount } = PERIOD_CONFIG[period];
            const endDate = Math.floor(Date.now() / 1000);
            const startDate = endDate - durationSec;
            try {
                const raw = await getAssetCharts({
                    assetId,
                    currency: fiat,
                    startDate,
                    endDate,
                    pointsCount
                });
                if (raw.length === 0) {
                    return { points: [] };
                }
                // The trading endpoint returns points in descending order
                // with duplicated boundary timestamps. Dedupe + sort
                // ascending so the area chart draws left-to-right in time.
                const seen = new Set<number>();
                const points: ChartPoint[] = [];
                for (const p of raw) {
                    if (seen.has(p.timestamp)) continue;
                    seen.add(p.timestamp);
                    points.push(p);
                }
                points.sort((a, b) => a.timestamp - b.timestamp);

                let minPrice = points[0].price;
                let maxPrice = points[0].price;
                for (const p of points) {
                    if (p.price < minPrice) minPrice = p.price;
                    if (p.price > maxPrice) maxPrice = p.price;
                }
                return { points, minPrice, maxPrice };
            } catch (e) {
                return null;
            }
        },
        {
            enabled: !!assetId,
            refetchOnWindowFocus: false,
            keepPreviousData: true,
            retry: false
        }
    );
};
