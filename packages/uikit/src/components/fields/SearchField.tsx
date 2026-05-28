import React, { forwardRef, useEffect, useRef } from 'react';
import { cn } from '../../libs/css';
import { mergeRefs } from '../../libs/common';
import { MagnifyingGlassIcon, XMarkCircleIcon } from '../Icon';

/**
 * Design-system "Search Field" (Figma node `117:8622`). A search input with a
 * leading magnifying-glass icon and an inline clear button.
 *
 * Two layouts driven by whether `onCancel` is provided:
 *   - **Standalone** (default): a single padded row containing the box.
 *   - **Header**: compact layout with a trailing accent-blue "Cancel" button,
 *     used at the top of modal sheets where the field is the primary action.
 *
 * Presentational — value is fully controlled by the caller.
 */
export interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    /**
     * Delay (ms) before applying autoFocus — useful when the field appears
     * inside a notification/sheet that animates in, so the focus call doesn't
     * compete with the animation. Ignored unless `autoFocus` is true.
     */
    autoFocusDelay?: number;

    /** When provided, renders the header layout with a trailing Cancel button. */
    onCancel?: () => void;
    cancelLabel?: string;

    id?: string;
    className?: string;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
    (
        {
            value,
            onChange,
            placeholder = 'Search',
            disabled,
            autoFocus,
            autoFocusDelay,
            onCancel,
            cancelLabel = 'Cancel',
            id,
            className,
            onFocus,
            onBlur
        },
        ref
    ) => {
        const isHeader = !!onCancel;
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
            if (!autoFocus || autoFocusDelay == null) return;
            const timer = window.setTimeout(() => inputRef.current?.focus(), autoFocusDelay);
            return () => window.clearTimeout(timer);
        }, [autoFocus, autoFocusDelay]);

        const box = (
            <div
                className={cn(
                    'flex h-12 items-center rounded-medium bg-backgroundContent',
                    isHeader ? 'min-w-0 flex-1' : 'w-full'
                )}
            >
                <span
                    aria-hidden
                    className="flex h-full shrink-0 items-center pl-4 pr-3 text-iconSecondary"
                >
                    <MagnifyingGlassIcon />
                </span>
                <input
                    ref={mergeRefs(ref, inputRef)}
                    id={id}
                    type="search"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    disabled={disabled}
                    // Native autoFocus is used when no delay is requested; the
                    // delayed branch focuses imperatively from the effect above.
                    autoFocus={autoFocus && autoFocusDelay == null}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={placeholder}
                    className={cn(
                        'min-w-0 grow border-0 bg-transparent text-body1 text-textPrimary outline-none placeholder:text-textSecondary',
                        // Reserve trailing space when there's no clear button.
                        !value && 'pr-4'
                    )}
                />
                {!!value && (
                    <button
                        type="button"
                        aria-label="Clear"
                        onClick={() => onChange('')}
                        className="flex h-full shrink-0 items-center border-0 bg-transparent p-4 text-iconSecondary"
                    >
                        <XMarkCircleIcon />
                    </button>
                )}
            </div>
        );

        if (!isHeader) {
            return <div className={cn('w-full p-4', className)}>{box}</div>;
        }

        return (
            <div className={cn('flex w-full items-center py-2 pl-4', className)}>
                {box}
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex shrink-0 items-center border-0 bg-transparent py-3 pl-4 pr-5 text-label1 text-textAccent"
                >
                    {cancelLabel}
                </button>
            </div>
        );
    }
);
SearchField.displayName = 'SearchField';
