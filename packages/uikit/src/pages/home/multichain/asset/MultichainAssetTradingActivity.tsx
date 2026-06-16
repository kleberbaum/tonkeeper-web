import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BigNumber from 'bignumber.js';

import { AssetDetailsTradingActivity } from '@tonkeeper/core/dist/service/tradingService';

function diffClass(raw: string | undefined): string {
    if (!raw) return 'text-textSecondary';
    if (raw.startsWith('-')) return 'text-accentRed';
    return 'text-accentGreen';
}

function buyShare(buy: string | undefined, sell: string | undefined): number {
    if (!buy || !sell) return 0.5;
    const b = new BigNumber(buy);
    const s = new BigNumber(sell);
    const total = b.plus(s);
    if (total.isZero()) return 0.5;
    return b.dividedBy(total).toNumber();
}

export const MultichainAssetTradingActivity: FC<{
    activity: AssetDetailsTradingActivity;
}> = ({ activity }) => {
    const { t } = useTranslation();
    const share = useMemo(
        () => buyShare(activity.buy24h, activity.sell24h),
        [activity.buy24h, activity.sell24h]
    );

    if (!activity.enabled) return null;
    if (!activity.volume24h && !activity.buy24h && !activity.sell24h) return null;

    return (
        <section className="flex flex-col px-4 pb-2">
            <div className="py-3 text-label1 text-textPrimary">
                {t('wallet_asset_trading_activity_24h')}
            </div>
            <div className="flex flex-col overflow-hidden rounded-2xl bg-backgroundContent">
                {activity.volume24h && (
                    <div className="flex items-center justify-between px-4 pb-2 pt-4">
                        <div className="text-body1 text-textSecondary">
                            {t('wallet_asset_volume')}
                        </div>
                        <div className="text-label1 text-textPrimary">
                            {activity.volume24h}
                            {activity.volumeChange24h && (
                                <span
                                    className={
                                        ' ml-2 text-body2 ' + diffClass(activity.volumeChange24h)
                                    }
                                >
                                    {activity.volumeChange24h}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                {(activity.buy24h || activity.sell24h) && (
                    <div className="mx-4 my-2 flex h-1.5 items-center gap-1 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-accentGreen"
                            style={{ width: `${share * 100}%` }}
                        />
                        <div
                            className="h-full flex-1 rounded-full bg-accentRed"
                            style={{ width: `${(1 - share) * 100}%` }}
                        />
                    </div>
                )}
                {(activity.buy24h || activity.sell24h) && (
                    <div className="flex items-center justify-between px-4 pb-4 pt-2 text-body2">
                        {activity.buy24h && (
                            <span className="text-accentGreen">
                                {t('wallet_buy')} · {activity.buy24h}
                            </span>
                        )}
                        {activity.sell24h && (
                            <span className="text-accentRed">
                                {t('wallet_sell')} · {activity.sell24h}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className="px-4 pb-2 pt-3 text-body3 text-textTertiary">
                {t('wallet_asset_data_provider_note')}
            </div>
        </section>
    );
};
