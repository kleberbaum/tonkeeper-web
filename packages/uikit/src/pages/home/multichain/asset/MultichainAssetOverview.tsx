import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { AssetDetailsOverview } from '@tonkeeper/core/dist/service/tradingService';

const InfoIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-40">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="4" r="0.75" fill="currentColor" />
        <path d="M7 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

interface RowProps {
    label: string;
    value?: string;
    isFirst?: boolean;
}

const Row: FC<RowProps> = ({ label, value, isFirst }) => {
    if (!value) return null;
    return (
        <div
            className={
                'flex items-center justify-between p-4 ' +
                (!isFirst ? 'border-t border-separatorCommon' : '')
            }
        >
            <div className="flex items-center gap-1 text-body1 text-textSecondary">
                <span>{label}</span>
                <InfoIcon />
            </div>
            <div className="text-label1 text-textPrimary">{value}</div>
        </div>
    );
};

export const MultichainAssetOverview: FC<{ overview: AssetDetailsOverview }> = ({ overview }) => {
    const { t } = useTranslation();
    if (!overview.enabled) return null;
    if (!overview.marketCap && !overview.totalSupply && !overview.circulatingSupply) return null;

    return (
        <section className="flex flex-col px-4 pb-4">
            <div className="py-3 text-label1 text-textPrimary">{t('wallet_asset_overview')}</div>
            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                <Row label={t('wallet_asset_market_cap')} value={overview.marketCap} isFirst />
                <Row label={t('wallet_asset_total_supply')} value={overview.totalSupply} />
                <Row
                    label={t('wallet_asset_circulating_supply')}
                    value={overview.circulatingSupply}
                />
            </div>
        </section>
    );
};
