import { FC } from 'react';

import { Button } from '../../../../primitives';
import { useTranslation } from '../../../../hooks/translation';
import IcClock56 from '../../../../icons/components/IcClock56';

/**
 * First-run empty state: no activity yet. Shows the "Add Funds" prompt.
 * When a filter is active but yields nothing, pass `showAddFunds={false}`
 * — the filtered no-results state drops the deposit CTA (per the mockup).
 */
export const MultichainHistoryEmptyState: FC<{
    onAddFunds?: () => void;
    showAddFunds?: boolean;
}> = ({ onAddFunds, showAddFunds = true }) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center px-8 text-center">
            <IcClock56 className="mb-4 size-14 text-accentBlue" />
            <h3 className="text-h3 text-textPrimary">{t('multichain_history_empty_title')}</h3>
            <p className="mt-1 text-body1 text-textSecondary">
                {t('multichain_history_empty_subtitle')}
            </p>
            {showAddFunds && (
                <Button variant="secondary" size="small" className="mt-6" onClick={onAddFunds}>
                    {t('wallet_add_funds')}
                </Button>
            )}
        </div>
    );
};
