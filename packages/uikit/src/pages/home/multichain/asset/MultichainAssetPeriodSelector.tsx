import { FC } from 'react';

import { cn } from '../../../../libs/css';
import { ChartPeriod } from '../../../../state/trading/useAssetCharts';

const PERIODS: ChartPeriod[] = ['H', 'D', 'W', 'M', '6M', 'Y'];

export const MultichainAssetPeriodSelector: FC<{
    value: ChartPeriod;
    onChange: (period: ChartPeriod) => void;
}> = ({ value, onChange }) => {
    return (
        <div className="flex w-full items-center justify-center gap-1 p-4">
            {PERIODS.map(period => (
                <button
                    key={period}
                    type="button"
                    onClick={() => onChange(period)}
                    className={cn(
                        'flex flex-1 items-center justify-center rounded-[18px] px-4 py-2 text-label2 text-buttonSecondaryForeground',
                        value === period && 'bg-buttonSecondaryBackground'
                    )}
                >
                    {period}
                </button>
            ))}
        </div>
    );
};
