import { FC, useState } from 'react';

import { MultichainActivityType } from '@tonkeeper/core/dist/service/multichainActivityService';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import IcSwitch16 from '../../../../icons/components/IcSwitch16';
import IcDoneBold16 from '../../../../icons/components/IcDoneBold16';

/** The type filter only exposes what the backend `activity_type` supports and
 *  both native apps show: All / Sent / Received. Swap is not a visible filter,
 *  and the mockup's "Spam" row is dropped (the multichain feed carries no spam
 *  flag). `undefined` = All Types. */
const OPTIONS: (MultichainActivityType | undefined)[] = [undefined, 'send', 'receive'];

function optionLabelKey(option: MultichainActivityType | undefined): string {
    if (option === 'send') return 'transaction_type_sent';
    if (option === 'receive') return 'transaction_type_receive';
    return 'multichain_history_type_all';
}

export interface MultichainHistoryTypeFilterProps {
    value?: MultichainActivityType;
    onChange: (value?: MultichainActivityType) => void;
    compact?: boolean;
}

export const MultichainHistoryTypeFilter: FC<MultichainHistoryTypeFilterProps> = ({
    value,
    onChange,
    compact = false
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const position = compact ? 'sticky bottom-0 mt-auto' : 'fixed inset-x-0 bottom-0';

    return (
        <div className={cn('z-10 flex justify-center px-4 pb-6 pt-2', position)}>
            <div className="relative">
                {open && (
                    <button
                        type="button"
                        aria-label={t('cancel')}
                        tabIndex={-1}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 z-40 cursor-default"
                    />
                )}
                {open && (
                    <div className="absolute bottom-full left-1/2 z-50 mb-2 w-[220px] -translate-x-1/2 overflow-hidden rounded-medium bg-backgroundContentTint shadow-[0_4px_16px_rgba(0,0,0,0.04),0_16px_64px_rgba(0,0,0,0.08)]">
                        {OPTIONS.map((option, i) => (
                            <button
                                key={option ?? 'all'}
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    onChange(option);
                                }}
                                className={cn(
                                    'flex w-full items-center gap-2 px-4 py-3 text-left',
                                    i > 0 && 'border-t border-separatorCommon'
                                )}
                            >
                                <span className="flex-1 text-label1 text-textPrimary">
                                    {t(optionLabelKey(option))}
                                </span>
                                {option === value && (
                                    <IcDoneBold16 className="size-4 text-accentBlue" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
                <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setOpen(v => !v)}
                    className="flex h-9 items-center gap-1.5 rounded-medium bg-buttonTertiaryBackground px-4 text-label2 text-buttonTertiaryForeground"
                >
                    {t(optionLabelKey(value))}
                    <IcSwitch16 className="size-4 text-iconSecondary" />
                </button>
            </div>
        </div>
    );
};
