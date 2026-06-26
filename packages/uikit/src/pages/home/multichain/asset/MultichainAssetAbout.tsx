import { FC, useState } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { AssetDetailsAbout } from '@tonkeeper/core/dist/service/tradingService';

import { cn } from '../../../../libs/css';

export const MultichainAssetAbout: FC<{ about: AssetDetailsAbout }> = ({ about }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    if (!about.enabled || !about.text) {
        return null;
    }

    return (
        <section className="flex flex-col px-4 pb-4">
            <div className="py-3 text-label1 text-textPrimary">{t('wallet_asset_about')}</div>
            <div className="overflow-hidden rounded-medium bg-backgroundContent px-4 pb-3 pt-4">
                <p className={cn('text-body2 text-textPrimary', !expanded && 'line-clamp-3')}>
                    {about.text}
                </p>
                {!expanded && (
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="mt-1 text-body2 text-textAccent"
                    >
                        {t('wallet_asset_more')}
                    </button>
                )}
            </div>
        </section>
    );
};
