import React, { forwardRef, useState } from 'react';
import { cn } from '../../libs/css';

/**
 * Design-system "Field Word" (Figma node `16:4610`). A single-line input
 * with a right-aligned numeric prefix used by the seed-phrase entry flow.
 *
 * Presentational: focus state drives the active border internally, `error`
 * forces the error styling. The 1.5px border is always present but
 * transparent so toggling state doesn't shift the inner content.
 *
 * Wrapped by `WordInput` (`components/create/WordInput.tsx`); the
 * `MnemonicInputForm` and `CheckMnemonic` screens layer on paste
 * handling, BIP-39 validation and focus auto-advance.
 */
export interface FieldWordProps {
    value: string;
    onChange: (value: string) => void;
    number: number | string;

    /** Show the error border + error background tint. */
    error?: boolean;

    /** Forwarded to the underlying input. */
    id?: string;
    tabIndex?: number;
    autoComplete?: string;
    autoCorrect?: string;
    spellCheck?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    onPaste?: React.ClipboardEventHandler<HTMLInputElement>;

    className?: string;
}

export const FieldWord = forwardRef<HTMLInputElement, FieldWordProps>(
    ({ value, onChange, number, error, className, onFocus, onBlur, ...rest }, ref) => {
        const [focused, setFocused] = useState(false);

        // Emit exactly one border-color and one bg utility so Tailwind's source
        // order between overlapping classes never decides the result.
        const borderClass = error
            ? 'border-fieldErrorBorder'
            : focused
            ? 'border-fieldActiveBorder'
            : 'border-transparent';
        const bgClass = error ? 'bg-fieldErrorBackground' : 'bg-fieldBackground';

        return (
            <label
                className={cn(
                    'relative flex h-14 w-full items-center gap-3 rounded-medium border-[1.5px] px-3 transition-colors',
                    borderClass,
                    bgClass,
                    className
                )}
            >
                <span
                    aria-hidden
                    className="w-7 select-none text-right text-body1 text-textSecondary"
                >
                    {number}:
                </span>
                <input
                    ref={ref}
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={e => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={e => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    className="min-w-0 grow border-0 bg-transparent text-body1 text-textPrimary outline-none placeholder:text-textSecondary"
                    {...rest}
                />
            </label>
        );
    }
);
FieldWord.displayName = 'FieldWord';
