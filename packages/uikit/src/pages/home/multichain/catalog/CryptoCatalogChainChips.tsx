import { FC, ReactNode } from 'react';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { NETWORK_INFO } from '../multichain-utils';

export interface ChainOption {
    /** `undefined` means "All" — no chain filter. */
    code?: string;
    label: string;
    icon?: ReactNode;
}

const CHAIN_FILTERS: ChainOption[] = [
    { code: undefined, label: 'All' },
    { code: 'btc', label: 'Bitcoin', icon: NETWORK_INFO.btc.icon },
    { code: 'eth', label: 'Ethereum', icon: NETWORK_INFO.eth.icon },
    { code: 'ton', label: 'Ton', icon: NETWORK_INFO.ton.icon },
    { code: 'tron', label: 'Tron', icon: NETWORK_INFO.tron.icon },
    { code: 'bsc', label: 'BSC', icon: NETWORK_INFO.bsc.icon },
    { code: 'base', label: 'Base', icon: NETWORK_INFO.base.icon },
    { code: 'arb', label: 'Arbitrum', icon: NETWORK_INFO.arb.icon }
];

export const CryptoCatalogChainChips: FC<{
    value?: string;
    onChange: (chain?: string) => void;
}> = ({ value, onChange }) => {
    const { t } = useTranslation();
    return (
        <div className="flex w-full gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CHAIN_FILTERS.map(opt => {
                const active = opt.code === value;
                const label = opt.code === undefined ? t('add_funds_chain_filter_all') : opt.label;
                return (
                    <button
                        key={opt.label}
                        type="button"
                        onClick={() => onChange(opt.code)}
                        className={cn(
                            'flex shrink-0 items-center gap-1.5 rounded-[18px] px-4 py-2 text-label2 transition-colors',
                            active
                                ? 'bg-buttonSecondaryBackground text-buttonSecondaryForeground'
                                : 'bg-buttonTertiaryBackground text-buttonTertiaryForeground'
                        )}
                    >
                        {opt.icon && (
                            <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                                {opt.icon}
                            </span>
                        )}
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
};
