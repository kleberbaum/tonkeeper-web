import {
    FC,
    KeyboardEvent as ReactKeyboardEvent,
    MouseEvent as ReactMouseEvent,
    PropsWithChildren,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import { createPortal } from 'react-dom';

import { ArrowLeftIcon, CloseIcon } from '../components/Icon';
import ReactPortal from '../components/ReactPortal';
import { cn } from '../libs/css';
import { useIsFullWidthMode } from '../hooks/useIsFullWidthMode';

/**
 * Tailwind-first modal primitive (multichain redesign).
 *
 * Standalone — owns its portal, transition, backdrop, scroll lock, top
 * bar, footer slot, back/close interceptor context, and tag-keyed close
 * registry. Has no dependency on the legacy `Notification` primitive
 * (`NotificationDesktopAndWeb`, `NotificationWrapper`, Ionic `IonModal`).
 *
 * Consumers of the Modal use `useSetModalOnBack`,
 * `useSetModalOnCloseInterceptor`, `ModalFooterPortal`, `ModalFooter`
 * exports below.
 *
 * No Ionic / native sheet behaviour. The mobile-narrow Capacitor shell
 * (Ionic `IonApp`) is out of scope for this primitive — see CLAUDE.md
 * "Migration status".
 */

const ANIMATION_MS = 200;

export type OnCloseInterceptor =
    | ((closeHandle: () => void, cancelCloseHandle: () => void) => void)
    | undefined;

// ── Imperative close-by-tag API ─────────────────────────────────────

const modalsControl = {
    taggedCloseHandlers: new Map<string, () => void>()
};

/**
 * Close an open Modal by its `tag`. Used from non-React contexts
 * (deep-link handlers, side-channels). Returns silently if no Modal
 * with that tag is mounted.
 */
export const closeModal = (tag: string) => {
    modalsControl.taggedCloseHandlers.get(tag)?.();
};

// ── Modal context (new) ─────────────────────────────────────────────

interface ModalContextValue {
    setOnBack: (callback: (() => void) | undefined) => void;
    setOnCloseInterceptor: (interceptor: OnCloseInterceptor) => void;
    footerElement: HTMLDivElement | null;
    headerElement: HTMLDivElement | null;
}

const ModalContext = createContext<ModalContextValue>({
    setOnBack: () => {},
    setOnCloseInterceptor: () => {},
    footerElement: null,
    headerElement: null
});

// ── Props ──────────────────────────────────────────────────────────

export type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /** Centered H2 rendered at the top of the modal body. */
    heading?: ReactNode;
    /** Centered Body1 subtitle directly below `heading`. */
    subheading?: ReactNode;
    /**
     * Optional title rendered between the back arrow and close button
     * in the top bar. Prefer the inline `heading` slot instead.
     */
    topBarTitle?: ReactNode;
    /** Hide the top-right close (X) button. */
    hideCloseButton?: boolean;
    /**
     * Back-button handler shown as the top-left arrow. Use this when the
     * enclosing screen knows its own back target (e.g. a multi-step flow).
     * For content-driven back (a sub-step inside the body), a child of the
     * modal can call `useSetModalOnBack` instead; if both are present the
     * prop wins.
     */
    onBack?: () => void;
    /**
     * Mobile-only height variant:
     *  - `'auto'` (default) — bottom sheet sized to content, capped at 90vh
     *  - `'half'`          — bottom sheet floor 50vh, cap 80vh
     *  - `'full'`          — full-screen, no rounded corners
     * On desktop this prop is ignored — desktop always centers a card with
     * `max-h-[calc(var(--app-height)-32px)]`.
     */
    mobileHeight?: 'auto' | 'half' | 'full';
    /**
     * Stretch the modal body to fill the viewport (minus the 16px
     * top/bottom safe-area). Desktop-only — mobile is full-screen when
     * `mobileFullScreen` is set.
     */
    tall?: boolean;
    /**
     * Reserved for parity with the legacy primitive. The new Modal
     * doesn't animate per-step height changes at all, so this prop is
     * a no-op today; keep passing it from existing call sites without
     * editing them.
     */
    disableHeightAnimation?: boolean;
    /** Fires after the close animation completes. */
    afterClose?: () => void;
    /** Tag for imperative close via `closeModal(tag)`. */
    tag?: string;
    /** Extra classes for the inner card container. */
    className?: string;
    children: ReactNode;
};

// ── Modal component ─────────────────────────────────────────────────

export const Modal: FC<ModalProps> = ({
    isOpen,
    onClose,
    heading,
    subheading,
    topBarTitle,
    hideCloseButton,
    onBack: onBackProp,
    mobileHeight = 'auto',
    tall,
    afterClose,
    tag,
    className,
    children
}) => {
    const isFullWidth = useIsFullWidthMode();

    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    // Back handler can come from the `onBack` prop (parent-driven) or from a
    // child via `useSetModalOnBack` (content-driven); the prop takes priority.
    const [onBackFromContext, setOnBack] = useState<(() => void) | undefined>();
    const onBack = onBackProp ?? onBackFromContext;
    const [onCloseInterceptor, setOnCloseInterceptor] = useState<OnCloseInterceptor>();
    const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null);
    const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null);

    // Mount + visibility animation. `visible` toggles the opacity
    // class one frame after mount so the entrance transition runs;
    // unmount is delayed by ANIMATION_MS so the exit transition can
    // complete before the portal tears down.
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            const raf = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        if (mounted) {
            setVisible(false);
            const t = setTimeout(() => {
                setMounted(false);
                afterClose?.();
            }, ANIMATION_MS);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [isOpen, mounted, afterClose]);

    const requestClose = useCallback(() => {
        if (onCloseInterceptor) {
            onCloseInterceptor(onClose, () => {});
        } else {
            onClose();
        }
    }, [onClose, onCloseInterceptor]);

    // Scroll lock while open.
    useEffect(() => {
        if (!mounted) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [mounted]);

    // Escape closes the modal (routed through any interceptor).
    useEffect(() => {
        if (!mounted) return undefined;
        const handler = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') requestClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [mounted, requestClose]);

    // Register the tag-keyed close handler. `closeModal(tag)` reaches
    // straight into `onClose` without going through the interceptor —
    // matches the legacy `closeNotification` semantics that side-channel
    // callers (deep links, etc.) rely on.
    useEffect(() => {
        if (!tag || !mounted) return undefined;
        modalsControl.taggedCloseHandlers.set(tag, onClose);
        return () => {
            modalsControl.taggedCloseHandlers.delete(tag);
        };
    }, [tag, onClose, mounted]);

    const onBackdropClick = useCallback(
        (e: ReactMouseEvent) => {
            // Only the backdrop itself triggers close — clicks that
            // bubbled up from the card are ignored. Mobile-fullscreen
            // has no visible backdrop so this never fires there.
            if (e.target === e.currentTarget && isFullWidth) requestClose();
        },
        [isFullWidth, requestClose]
    );

    const onCardKeyDown = useCallback((e: ReactKeyboardEvent) => {
        // Stop ESC from bubbling out of nested inputs while keeping it
        // active at the document listener (registered above).
        e.stopPropagation();
    }, []);

    const ctxValue = useMemo<ModalContextValue>(
        () => ({
            setOnBack,
            setOnCloseInterceptor,
            footerElement,
            headerElement
        }),
        [footerElement, headerElement]
    );

    if (!mounted) return null;

    const useMobileSheet = !isFullWidth;
    const isMobileFull = useMobileSheet && mobileHeight === 'full';

    return (
        <ReactPortal wrapperId="react-portal-modal-container">
            <ModalContext.Provider value={ctxValue}>
                <div
                    role="presentation"
                    onClick={onBackdropClick}
                    className={cn(
                        'fixed inset-0 z-50 flex transition-opacity duration-200',
                        isFullWidth
                            ? 'items-center justify-center bg-backgroundOverlayStrong p-4'
                            : isMobileFull
                            ? 'items-stretch justify-stretch'
                            : 'items-end justify-stretch bg-backgroundOverlayStrong',
                        visible ? 'opacity-100' : 'opacity-0'
                    )}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        onClick={e => e.stopPropagation()}
                        onKeyDown={onCardKeyDown}
                        className={cn(
                            'relative flex flex-col bg-backgroundPage shadow-2xl',
                            isFullWidth
                                ? cn(
                                      // Cap height at viewport-minus-padding so the body's
                                      // `overflow-y-auto` engages when content exceeds the
                                      // viewport; otherwise the card overflows the screen
                                      // and there's no way to reach the bottom.
                                      'w-full max-w-[640px] max-h-[calc(var(--app-height)-32px)] overflow-hidden rounded-large',
                                      tall && 'min-h-[calc(var(--app-height)-32px)]'
                                  )
                                : mobileHeight === 'full'
                                ? 'h-full w-full'
                                : mobileHeight === 'half'
                                ? 'min-h-[50vh] max-h-[80vh] w-full rounded-t-large'
                                : 'max-h-[90vh] w-full rounded-t-large',
                            className
                        )}
                    >
                        {(onBack || !hideCloseButton || topBarTitle) && (
                            <div className="flex h-14 shrink-0 items-center justify-between px-2">
                                {onBack ? (
                                    <button
                                        type="button"
                                        aria-label="Back"
                                        onClick={onBack}
                                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-textPrimary transition-colors hover:bg-backgroundContentTint"
                                    >
                                        <ArrowLeftIcon />
                                    </button>
                                ) : (
                                    <span className="h-10 w-10" />
                                )}
                                {topBarTitle ? (
                                    <span className="min-w-0 truncate text-label1 text-textPrimary">
                                        {topBarTitle}
                                    </span>
                                ) : (
                                    <span />
                                )}
                                {!hideCloseButton ? (
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        onClick={requestClose}
                                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-textPrimary transition-colors hover:bg-backgroundContentTint"
                                    >
                                        <CloseIcon />
                                    </button>
                                ) : (
                                    <span className="h-10 w-10" />
                                )}
                            </div>
                        )}

                        <div
                            ref={setHeaderElement}
                            className="empty:hidden"
                            aria-hidden={!headerElement}
                        />

                        <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {(heading || subheading) && (
                                <div className="mb-6 flex flex-col items-center gap-1 text-center">
                                    {heading && (
                                        <h2 className="text-h2 text-textPrimary">{heading}</h2>
                                    )}
                                    {subheading && (
                                        <p className="text-body1 text-textSecondary">
                                            {subheading}
                                        </p>
                                    )}
                                </div>
                            )}
                            {children}
                        </div>

                        <div ref={setFooterElement} className="shrink-0 empty:hidden" />
                    </div>
                </div>
            </ModalContext.Provider>
        </ReactPortal>
    );
};

// ── Public hooks ───────────────────────────────────────────────────

/**
 * Register a back-button handler in the enclosing `Modal`. When set,
 * the modal shows a back arrow in the top-left that calls the handler.
 * Pass `undefined` to hide the back arrow.
 */
export const useSetModalOnBack = (onBack: undefined | (() => void)) => {
    const { setOnBack } = useContext(ModalContext);
    useEffect(() => {
        setOnBack(() => onBack);
        return () => setOnBack(undefined);
    }, [setOnBack, onBack]);
};

/**
 * Register an interceptor that runs when the user tries to close the
 * modal (X button, ESC, backdrop). Used for the discard-confirm flow:
 * the interceptor can show a confirmation and decide whether to call
 * `closeHandle()` or `cancelClose()`.
 *
 * The tag-based `closeModal(tag)` API bypasses the interceptor — it's
 * meant for side-channel callers that have already made the close
 * decision elsewhere.
 */
export const useSetModalOnCloseInterceptor = (interceptor: OnCloseInterceptor) => {
    const { setOnCloseInterceptor } = useContext(ModalContext);
    useEffect(() => {
        setOnCloseInterceptor(() => interceptor);
        return () => setOnCloseInterceptor(undefined);
    }, [setOnCloseInterceptor, interceptor]);
};

// ── Footer portal ──────────────────────────────────────────────────

/**
 * Wraps a button (or button row) at the bottom of the modal sheet —
 * portaled into the Modal's footer slot. Outside a Modal it renders
 * its children inline; that fallback keeps screens reusable on routes
 * that aren't backed by a Modal yet.
 */
export const ModalFooterPortal: FC<PropsWithChildren> = ({ children }) => {
    const { footerElement } = useContext(ModalContext);
    if (footerElement) return createPortal(children, footerElement);
    return <>{children}</>;
};

/** Padded wrapper rendered inside `ModalFooterPortal` to host the CTA(s). */
export const ModalFooter: FC<PropsWithChildren<{ className?: string }>> = ({
    children,
    className
}) => (
    <div
        className={cn(
            'flex w-full flex-col gap-2 border-t border-separatorCommon px-4 py-4',
            className
        )}
    >
        {children}
    </div>
);
