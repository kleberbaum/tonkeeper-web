import {
    FC,
    PointerEvent as ReactPointerEvent,
    ReactNode,
    useEffect,
    useRef,
    useState
} from 'react';
import { cn } from '../libs/css';
import { Loader } from './Loader';
import IcArrowRightOutline28 from '../icons/components/IcArrowRightOutline28';
import IcDonemarkOutline28 from '../icons/components/IcDonemarkOutline28';

export type SwipeToConfirmStatus = 'idle' | 'loading' | 'done';

export interface SwipeToConfirmProps {
    onConfirm: () => void;
    /** `idle` (default) draggable, `loading` shows a spinner, `done` shows the success state. */
    status?: SwipeToConfirmStatus;
    disabled?: boolean;
    /** Primary action caption, e.g. "Confirm". */
    label?: ReactNode;
    /** Sub-caption, e.g. "Swipe right". */
    hint?: ReactNode;
    /** Success caption shown when `status === 'done'`, e.g. "Done". */
    doneLabel?: ReactNode;
    className?: string;
}

const HANDLE_WIDTH = 92;
const COMPLETE_RATIO = 0.85;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Swipe-to-confirm slider (multichain send confirm action). Drag the
 * handle to the right edge to fire `onConfirm`; releasing short of the
 * threshold snaps back. Pointer events drive it, so it works with both
 * touch and mouse-drag on web/desktop.
 */
export const SwipeToConfirm: FC<SwipeToConfirmProps> = ({
    onConfirm,
    status = 'idle',
    disabled,
    label,
    hint,
    doneLabel,
    className
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const pointerStart = useRef(0);
    const maxX = useRef(0);
    const [dragX, setDragX] = useState(0);

    const measure = () => {
        const width = trackRef.current?.offsetWidth ?? 0;
        maxX.current = Math.max(0, width - HANDLE_WIDTH);
    };

    useEffect(() => {
        measure();
        const ro = new ResizeObserver(measure);
        if (trackRef.current) ro.observe(trackRef.current);
        return () => ro.disconnect();
    }, []);

    // Pin the handle at the far edge while the parent processes the
    // confirmed action; reset it once we're idle again.
    useEffect(() => {
        if (status === 'loading') setDragX(maxX.current);
        else if (status === 'idle') setDragX(0);
    }, [status]);

    const interactive = status === 'idle' && !disabled;

    const onPointerDown = (e: ReactPointerEvent) => {
        if (!interactive) return;
        measure();
        dragging.current = true;
        pointerStart.current = e.clientX - dragX;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: ReactPointerEvent) => {
        if (!dragging.current) return;
        setDragX(clamp(e.clientX - pointerStart.current, 0, maxX.current));
    };

    const onPointerUp = () => {
        if (!dragging.current) return;
        dragging.current = false;
        if (dragX >= maxX.current * COMPLETE_RATIO && maxX.current > 0) {
            setDragX(maxX.current);
            onConfirm();
        } else {
            setDragX(0);
        }
    };

    if (status === 'done') {
        return (
            <div
                className={cn(
                    'flex h-14 items-center justify-center gap-2 text-accentGreen',
                    className
                )}
            >
                <IcDonemarkOutline28 className="h-7 w-7" />
                <span className="text-label1">{doneLabel}</span>
            </div>
        );
    }

    const progress = maxX.current > 0 ? dragX / maxX.current : 0;

    return (
        <div
            ref={trackRef}
            className={cn(
                'relative h-14 w-full select-none overflow-hidden rounded-medium bg-backgroundContent',
                !interactive && status === 'idle' && 'opacity-50',
                className
            )}
        >
            <div
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity"
                style={{ opacity: 1 - progress }}
            >
                <span className="text-label2 text-textSecondary">{label}</span>
                <span className="text-body3 text-textTertiary">{hint}</span>
            </div>
            <div
                role="button"
                aria-label={typeof label === 'string' ? label : 'Confirm'}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={cn(
                    'absolute left-0 top-0 flex h-14 w-[92px] items-center justify-center rounded-medium bg-buttonPrimaryBackground text-buttonPrimaryForeground',
                    interactive
                        ? 'cursor-grab touch-none active:cursor-grabbing'
                        : 'cursor-default',
                    !dragging.current && 'transition-transform'
                )}
                style={{ transform: `translateX(${dragX}px)` }}
            >
                {status === 'loading' ? (
                    <Loader size="medium" />
                ) : (
                    <IcArrowRightOutline28 className="h-7 w-7" />
                )}
            </div>
        </div>
    );
};
