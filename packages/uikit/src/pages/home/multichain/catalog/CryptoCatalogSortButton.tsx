import { FC, useEffect, useRef, useState } from 'react';

import { CatalogSort } from '@tonkeeper/core/dist/service/multichainWalletService';

const ArrowsUpDown = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
            d="M4 1V11M4 1L1 4M4 1L7 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M8 11V1M8 11L5 8M8 11L11 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const Check16 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
            d="M3 8L7 12L13 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

interface Option {
    value: CatalogSort;
    label: string;
}

const OPTIONS: Option[] = [
    { value: 'market_cap', label: 'Market Cap' },
    { value: 'volume', label: 'Volume' }
];

export const CryptoCatalogSortButton: FC<{
    value: CatalogSort;
    onChange: (sort: CatalogSort) => void;
}> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const activeLabel = OPTIONS.find(o => o.value === value)?.label ?? 'Sort';

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    return (
        <div ref={wrapperRef} className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
            {open && (
                <div className="absolute bottom-full left-1/2 mb-2 w-[180px] -translate-x-1/2 overflow-hidden rounded-2xl bg-backgroundContentTint shadow-[0_4px_16px_rgba(0,0,0,0.1),0_16px_64px_rgba(0,0,0,0.08)]">
                    {OPTIONS.map((opt, idx) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            className={
                                'flex w-full items-center justify-between px-4 py-3 text-left text-label1 text-textPrimary ' +
                                (idx > 0 ? 'border-t border-separatorCommon' : '')
                            }
                        >
                            <span>{opt.label}</span>
                            {opt.value === value && (
                                <span className="text-textAccent">
                                    <Check16 />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 rounded-2xl bg-buttonTertiaryBackground px-4 py-2 text-label2 text-buttonTertiaryForeground shadow-lg"
            >
                <span>{activeLabel}</span>
                <ArrowsUpDown />
            </button>
        </div>
    );
};
