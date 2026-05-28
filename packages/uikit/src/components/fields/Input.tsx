import React, {
    InputHTMLAttributes,
    ReactNode,
    forwardRef,
    useEffect,
    useRef,
    useState
} from 'react';
import { useTheme } from 'styled-components';
import { mergeRefs } from '../../libs/common';
import { cn } from '../../libs/css';
import { XmarkIcon } from '../Icon';

/**
 * Design-system "Field Text" (Figma node `35:3678`). The standard floating-
 * label text input. Tailwind rewrite of the legacy styled-components Input —
 * `InputProps`, `Input`, `TextArea` and the sub-exports (`InputBlock`,
 * `InputField`, `Label`, `OuterBlock`, `HelpText`) keep the same prop shape
 * so existing consumers — including the `styled(InputBlock)` extensions in
 * multi-send and `TonRecipientInput` — compile unchanged.
 *
 * Visual deltas vs. the previous styled version:
 *   - corner is `rounded-medium` (16px, was 12px via `BorderSmallResponsive`)
 *   - border is 1.5px on active/error (matches Figma); single border-color
 *     class is emitted so Tailwind source order never collides
 *   - error variant collapses to h-56 with the field-error background tint
 *   - placeholder-only mode (`size='medium'` with no `label`) renders at h-56
 *     to match the Figma "Empty Without Title" variant.
 *
 * The `displayType === 'full-width'` legacy branch is preserved for label
 * positioning so this rewrite doesn't shift any existing screen.
 */

type InputBlockProps = {
    focus: boolean;
    valid: boolean;
    isSuccess?: boolean;
    scanner?: boolean;
    clearButton?: boolean;
    size?: 'small' | 'medium';
    /** Set internally when the field has no floating label — shrinks to h-14. */
    noLabel?: boolean;
    className?: string;
    children?: ReactNode;
};

export const InputBlock = forwardRef<HTMLDivElement, InputBlockProps>(
    (
        { focus, valid, isSuccess, scanner, clearButton, size, noLabel, className, children },
        ref
    ) => {
        // Emit exactly one border-color and one bg utility so overlapping
        // classes don't fight on Tailwind source order.
        const isError = !valid;
        const borderClass = isSuccess
            ? 'border-accentGreen'
            : isError
            ? 'border-fieldErrorBorder'
            : focus
            ? 'border-fieldActiveBorder'
            : 'border-transparent';
        const bgClass = isError ? 'bg-fieldErrorBackground' : 'bg-fieldBackground';

        const heightClass =
            size === 'small'
                ? 'min-h-9 px-3' //  36 / 12 (legacy small)
                : isError || noLabel
                ? 'min-h-14 px-4' //  56 / 16 (Figma "without title" / error)
                : 'min-h-16 px-4'; //  64 / 16 (Figma "with title")

        return (
            <div
                ref={ref}
                className={cn(
                    'relative box-border flex w-full items-center gap-2 rounded-medium border-[1.5px] transition-colors',
                    heightClass,
                    borderClass,
                    bgClass,
                    scanner && 'pr-14', //   reserve QR scanner button (~3.5rem)
                    clearButton && 'pr-8', // reserve inline clear button (~2rem)
                    className
                )}
            >
                {children}
            </div>
        );
    }
);
InputBlock.displayName = 'InputBlock';

type InputFieldProps = {
    marginRight?: string;
    size?: 'small' | 'medium';
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ marginRight, size, className, style, ...rest }, ref) => (
        <input
            ref={ref}
            {...rest}
            style={marginRight ? { ...style, marginRight } : style}
            className={cn(
                'min-w-0 grow border-0 bg-transparent text-body1 font-medium text-textPrimary outline-none placeholder:text-textSecondary',
                size === 'small' ? 'py-2' : 'pb-[10px] pt-[30px]',
                className
            )}
        />
    )
);
InputField.displayName = 'InputField';

type LabelProps = {
    active?: boolean;
    htmlFor?: string;
    className?: string;
    children?: ReactNode;
};

/**
 * Floating label. Resting position is the inputs's vertical centre; on
 * `active` it animates up and scales down. Position values mirror the legacy
 * styled-components Label so this rewrite doesn't shift screens that use it.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ active, htmlFor, className, children }, ref) => {
        const theme = useTheme();
        const isFullWidth = theme?.displayType === 'full-width';

        const resting = isFullWidth ? 'translate-y-[18px]' : 'translate-y-[23px]';
        const lifted = isFullWidth
            ? 'translate-y-[10px] scale-[0.7]'
            : 'translate-y-[12px] scale-[0.7]';

        return (
            <label
                ref={ref}
                htmlFor={htmlFor}
                className={cn(
                    'pointer-events-none absolute left-4 top-0 origin-top-left select-none whitespace-nowrap text-body1 leading-none text-textSecondary transition-transform duration-200 ease-out',
                    active ? lifted : resting,
                    className
                )}
            >
                {children}
            </label>
        );
    }
);
Label.displayName = 'Label';

export const OuterBlock = forwardRef<HTMLDivElement, { className?: string; children?: ReactNode }>(
    ({ className, children }, ref) => (
        <div ref={ref} className={cn('w-full', className)}>
            {children}
        </div>
    )
);
OuterBlock.displayName = 'OuterBlock';

type HelpTextProps = {
    valid: boolean;
    className?: string;
    children?: ReactNode;
};

export const HelpText = forwardRef<HTMLParagraphElement, HelpTextProps>(
    ({ valid, className, children }, ref) => (
        <p
            ref={ref}
            className={cn(
                'mt-3 inline-block w-full select-none text-left text-body3',
                valid ? 'text-textSecondary' : 'text-fieldErrorBorder',
                className
            )}
        >
            {children}
        </p>
    )
);
HelpText.displayName = 'HelpText';

const RightBlock: React.FC<{ children?: ReactNode; className?: string }> = ({
    children,
    className
}) => <div className={cn('absolute right-4 flex h-full items-center', className)}>{children}</div>;

export type InputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'autoFocus' | 'onChange' | 'size'
> & {
    value: string;
    onChange?: (value: string) => void;
    onFocusChange?: (isFocused: boolean) => void;
    onSubmit?: () => void;
    isValid?: boolean;
    isSuccess?: boolean;
    label?: string;
    disabled?: boolean;
    helpText?: string;
    tabIndex?: number;
    clearButton?: boolean;
    rightElement?: ReactNode;
    marginRight?: string;
    className?: string;
    size?: 'small' | 'medium';
    id: string;
    autoFocus?: number | boolean | 'notification';
    autoSelect?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            id,
            value,
            onChange,
            onFocusChange,
            isValid = true,
            isSuccess = false,
            label,
            disabled,
            helpText,
            tabIndex,
            clearButton,
            rightElement,
            marginRight,
            className,
            size,
            autoFocus,
            autoSelect,
            ...rest
        },
        ref
    ) => {
        const [focus, _setFocus] = useState(false);
        const focused = useRef(false);
        const setFocus = (v: boolean) => {
            _setFocus(v);
            onFocusChange?.(v);
        };

        const onClear: React.MouseEventHandler<HTMLButtonElement> = e => {
            e.stopPropagation();
            e.preventDefault();
            if (disabled) return;
            onChange?.('');
        };

        const el = useRef<HTMLInputElement>(null);

        useEffect(() => {
            if (el.current && !focused.current && autoFocus) {
                setTimeout(
                    () => {
                        el.current?.focus();
                        if (autoSelect) {
                            setTimeout(() => {
                                el.current?.select();
                            }, 0);
                        }
                    },
                    typeof autoFocus === 'number'
                        ? autoFocus
                        : autoFocus === 'notification'
                        ? 400
                        : 30
                );
                focused.current = true;
            }
        }, [autoFocus, autoSelect]);

        const showsFloatingLabel = !!label && size !== 'small';

        return (
            <OuterBlock className={className}>
                <InputBlock
                    focus={focus}
                    valid={isValid}
                    isSuccess={isSuccess}
                    clearButton={clearButton}
                    size={size}
                    noLabel={!showsFloatingLabel && size !== 'small'}
                >
                    <InputField
                        {...rest}
                        id={id}
                        ref={mergeRefs(ref, el)}
                        disabled={disabled}
                        value={value}
                        spellCheck={false}
                        autoCorrect="off"
                        autoComplete="off"
                        tabIndex={tabIndex}
                        marginRight={marginRight}
                        onChange={e => onChange && onChange(e.target.value)}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        size={size}
                        placeholder={size === 'small' || !showsFloatingLabel ? label : undefined}
                        autoFocus={!!autoFocus}
                    />
                    {showsFloatingLabel && (
                        <Label active={value !== ''} htmlFor={id}>
                            {label}
                        </Label>
                    )}
                    {rightElement && <RightBlock>{rightElement}</RightBlock>}
                    {!!value && clearButton && !rightElement && (
                        <button
                            type="button"
                            aria-label="Clear"
                            onClick={onClear}
                            className="absolute right-4 flex h-full cursor-pointer items-center border-0 bg-transparent p-0 text-textSecondary transition-colors hover:text-textTertiary"
                        >
                            <XmarkIcon />
                        </button>
                    )}
                </InputBlock>
                {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
            </OuterBlock>
        );
    }
);
Input.displayName = 'Input';

// `TextArea` lives in `./TextArea.tsx` so importing `Input` doesn't drag the
// @tonkeeper/core crypto chain (Buffer-using utilities) into every chunk.
// Two callers (`transfer/RecipientView`, `create/SKInput`) import it directly
// from there.
