import React, { FC, useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import styled from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import ReactPortal from './ReactPortal';
import { Toast } from './Toast';

const Message = styled.div`
    position: fixed;
    z-index: 200;
    top: env(safe-area-inset-top);
    left: 50%;
    transform: translateX(-50%)
        translateY(${p => (p.theme.proDisplayType === 'mobile' ? '0' : '-30px')}) scale(0.8);
    transition: all 0.1s ease-in-out;

    &.enter-done {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(16px) scale(1);
    }

    &.exit {
        opacity: 0;
        transform: translateX(-50%)
            translateY(${p => (p.theme.proDisplayType === 'mobile' ? '0' : '-30px')}) scale(0.8);
    }
`;

export const CopyNotification: FC<{ hideSimpleCopyNotifications?: boolean }> = React.memo(
    ({ hideSimpleCopyNotifications }) => {
        const { t } = useTranslation();
        const [isOpen, setOpen] = useState<boolean>(false);
        const [text, setText] = useState<string>(t('copied'));
        const sdk = useAppSdk();

        useEffect(() => {
            let timer: NodeJS.Timeout | null = null;
            const handler = (options: {
                method: 'copy';
                id?: number | undefined;
                params: string;
            }) => {
                if (timer) {
                    clearTimeout(timer);
                }

                if (hideSimpleCopyNotifications && !options.params) {
                    return;
                    // hide 'Copy' notification
                }

                setText(options.params ?? t('copied'));
                setOpen(true);
                timer = setTimeout(
                    () => {
                        setOpen(false);
                    },
                    options.params && options.params !== t('copied') ? 5000 : 2000
                );
            };
            sdk.uiEvents.on('copy', handler);
            return () => {
                sdk.uiEvents.off('copy', handler);
            };
        }, [hideSimpleCopyNotifications, sdk.uiEvents, t]);

        const nodeRef = useRef(null);

        return (
            <ReactPortal wrapperId="react-copy-modal">
                <CSSTransition
                    in={isOpen}
                    timeout={{ enter: 0, exit: 300 }}
                    unmountOnExit
                    nodeRef={nodeRef}
                >
                    <Message
                        ref={nodeRef}
                        onClick={() => {
                            sdk.copyToClipboard(text);
                            setOpen(false);
                        }}
                    >
                        <Toast text={text} size="medium" className="cursor-pointer" />
                    </Message>
                </CSSTransition>
            </ReactPortal>
        );
    }
);
CopyNotification.displayName = 'CopyNotification';
