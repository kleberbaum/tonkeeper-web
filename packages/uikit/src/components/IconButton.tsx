import React, { forwardRef } from 'react';
import { cn } from '../libs/css';

/**
 * Design-system **Icon Button** (Figma "Icon Button"): a round icon in a tertiary
 * circle with a Label3 caption below — Buy / Send / Receive / Sell / Swap. This
 * is the UI-kit primitive; app-level composition (e.g. `home/Actions`) wires it
 * to analytics / the SDK / i18n.
 *
 * Hover is normally CSS `:hover`; pass `hovered` to force the highlighted look on
 * iOS, where there is no `:hover` (the OS reports the pressed element instead).
 */
export interface IconButtonProps {
    icon: React.ReactNode;
    label: React.ReactNode;
    disabled?: boolean;
    /** Force the highlighted look (used on iOS, which has no CSS `:hover`). */
    hovered?: boolean;
    onClick?: () => void;
    className?: string;
}

export const IconButton = forwardRef<HTMLDivElement, IconButtonProps>(
    ({ icon, label, disabled, hovered, onClick, className }, ref) => (
        <div
            ref={ref}
            onClick={disabled ? undefined : onClick}
            className={cn(
                'group flex w-[72px] select-none flex-col items-center gap-2 px-1 py-2 text-center',
                disabled ? 'cursor-auto' : 'cursor-pointer',
                className
            )}
        >
            <div
                className={cn(
                    'flex h-[44px] w-[44px] items-center justify-center rounded-full transition-colors duration-100',
                    disabled
                        ? 'bg-buttonSecondaryBackgroundDisabled text-buttonSecondaryForegroundDisabled'
                        : hovered
                        ? 'bg-buttonTertiaryBackgroundHighlighted text-textPrimary'
                        : 'bg-buttonTertiaryBackground text-textPrimary group-hover:bg-buttonTertiaryBackgroundHighlighted'
                )}
            >
                {icon}
            </div>
            <span
                className={cn(
                    'text-label3 transition-colors duration-100',
                    disabled
                        ? 'text-buttonSecondaryForegroundDisabled'
                        : hovered
                        ? 'text-textPrimary'
                        : 'text-textSecondary group-hover:text-textPrimary'
                )}
            >
                {label}
            </span>
        </div>
    )
);
