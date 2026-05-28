import { FC, ReactNode } from 'react';
import { cn } from '../libs/css';
import { Loader } from './Loader';

/**
 * Design-system toast bubble (Figma "Toasts"). A content-tint pill with a
 * centred Label2 message and the "Floating Small" drop shadow.
 *
 * Sizes match the design: `small` (12px corners, 16/12 padding) and `medium`
 * (24px corners, 24/14 padding). `loading` renders the medium pill with a
 * leading `Loader` (the "Medium + Loader" variant).
 *
 * Presentational only — positioning, animation and the SDK event wiring live
 * in `CopyNotification`, which mounts this as the on-screen toast.
 */
export type ToastSize = 'small' | 'medium';

export interface ToastProps {
    text: ReactNode;
    size?: ToastSize;
    loading?: boolean;
    className?: string;
}

// Static literal classes so Tailwind's scanner emits them. Figma has no 24px
// corner token, so the medium pill uses an arbitrary radius.
const SIZE: Record<ToastSize, string> = {
    small: 'rounded-small px-4 py-3',
    medium: 'rounded-[24px] px-6 py-3.5'
};

export const Toast: FC<ToastProps> = ({ text, size = 'small', loading, className }) => (
    <div
        role="status"
        className={cn(
            'inline-flex max-w-[358px] items-center justify-center bg-backgroundContentTint text-center shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)]',
            loading ? 'gap-2 rounded-[24px] py-3.5 pl-4 pr-6' : SIZE[size],
            className
        )}
    >
        {loading && <Loader size="small" className="text-iconSecondary" />}
        <span className="break-words text-label2 text-textPrimary">{text}</span>
    </div>
);
