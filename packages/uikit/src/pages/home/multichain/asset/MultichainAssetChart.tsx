import { FC, RefCallback, useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import { ChartPeriod, useAssetCharts } from '../../../../state/trading/useAssetCharts';

const CHART_HEIGHT = 240;

/**
 * Measure the parent div directly with ResizeObserver instead of
 * relying on Recharts' `ResponsiveContainer`. The latter routinely
 * misses the first stretch pass inside a flex column and leaves the
 * SVG sized 0×0 — labels still render but the line never paints. A
 * direct observer is fewer lines and reliably catches the layout.
 */
function useMeasuredWidth(): [RefCallback<HTMLDivElement>, number] {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    const ref = useCallback<RefCallback<HTMLDivElement>>(node => {
        setElement(node);
    }, []);

    useEffect(() => {
        if (!element) return;

        const el = element;
        const measure = () => setWidth(el.getBoundingClientRect().width);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [element]);

    return [ref, width];
}

export const MultichainAssetChart: FC<{ assetId: string; period: ChartPeriod }> = ({
    assetId,
    period
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data, isFetching } = useAssetCharts(assetId, period);
    const [ref, width] = useMeasuredWidth();

    const points = data?.points ?? [];
    const minPrice = data?.minPrice;
    const maxPrice = data?.maxPrice;

    // Lock the container's height with min/max so no flex/parent rule
    // can grow or shrink it. Belt-and-suspenders: arbitrary-px Tailwind
    // utilities have silently failed at least once in this layout.
    const heightStyle = {
        height: CHART_HEIGHT,
        minHeight: CHART_HEIGHT,
        maxHeight: CHART_HEIGHT
    } as const;

    if (!data || points.length === 0) {
        return (
            <section
                className="flex w-full shrink-0 items-center justify-center overflow-hidden px-8 text-body3 text-textTertiary"
                style={heightStyle}
            >
                {isFetching ? t('wallet_asset_chart_loading') : t('wallet_asset_chart_unavailable')}
            </section>
        );
    }

    return (
        <section
            ref={ref}
            className="relative block w-full shrink-0 overflow-hidden"
            style={heightStyle}
        >
            {maxPrice !== undefined && (
                <div className="absolute right-4 top-0 z-10 text-body3 text-textSecondary">
                    {formatFiatCurrency(fiat, maxPrice)}
                </div>
            )}
            {minPrice !== undefined && (
                <div className="absolute bottom-6 right-4 z-10 text-body3 text-textSecondary">
                    {formatFiatCurrency(fiat, minPrice)}
                </div>
            )}
            {width > 0 && (
                <AreaChart
                    width={width}
                    height={CHART_HEIGHT}
                    data={points}
                    margin={{ top: 24, right: 16, bottom: 24, left: 16 }}
                >
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#39CC83" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#39CC83" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        hide
                        dataKey="timestamp"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        padding={{ left: 0, right: 0 }}
                    />
                    <YAxis hide width={0} domain={['dataMin', 'dataMax']} />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#39CC83"
                        strokeWidth={1.5}
                        fill="url(#chartGradient)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            )}
        </section>
    );
};
