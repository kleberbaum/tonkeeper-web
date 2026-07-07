import { FC } from 'react';

import { cn } from '../../../libs/css';
import { useTranslation } from '../../../hooks/translation';
import { networkIcon, networkLabel } from './multichain-utils';

/** The chains the multichain backend can filter by, in the mockup's chip order. */
const DEFAULT_CHAINS = ['btc', 'eth', 'ton', 'base', 'arb', 'bsc', 'tron'];

function chipLabel(code: string): string {
    return code === 'ton' ? 'TON' : networkLabel(code);
}

const chipBase =
    'flex h-8 shrink-0 items-center rounded-2xl text-label2 text-buttonSecondaryForeground transition-colors';

const chipBackground = (active: boolean) =>
    active
        ? 'bg-backgroundContentAttention'
        : 'bg-buttonSecondaryBackground hover:bg-buttonSecondaryBackgroundHighlighted';

export const MultichainChainChips: FC<{
    /** `undefined` = the "All" chip. */
    value?: string;
    onChange: (chain?: string) => void;
    /** Chains to offer; defaults to every backend-supported chain. */
    chains?: string[];
}> = ({ value, onChange, chains = DEFAULT_CHAINS }) => {
    const { t } = useTranslation();

    return (
        <div className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
                type="button"
                onClick={() => onChange(undefined)}
                className={cn(chipBase, 'px-3', chipBackground(value === undefined))}
            >
                {t('add_funds_chain_filter_all')}
            </button>
            {chains.map(code => (
                <button
                    key={code}
                    type="button"
                    onClick={() => onChange(code)}
                    className={cn(chipBase, 'gap-1.5 pl-1.5 pr-3', chipBackground(value === code))}
                >
                    <span className="flex size-5 items-center justify-center overflow-hidden rounded-full [&>svg]:size-5">
                        {networkIcon(code)}
                    </span>
                    {chipLabel(code)}
                </button>
            ))}
        </div>
    );
};
