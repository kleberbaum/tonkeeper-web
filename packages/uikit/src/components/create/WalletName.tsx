import React, { FC, useEffect, useRef, useState } from 'react';
import { useTheme } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { H2Label2Responsive } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { Input } from '../fields/Input';
import { EmojisList } from '../shared/emoji/EmojisList';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { useMobileModalFullScreenStretcher } from '../../hooks/useElementHeight';
import { NotificationFooter, NotificationFooterPortal } from '../Notification';

const Body: FC<{ children: React.ReactNode }> = ({ children }) => {
    // `displayType` toggles Body1 (16px/24px) vs Body2 (14px/20px) typography
    // on full-width layouts. The legacy styled component pulled this from the
    // theme object via styled-components' `${p => p.theme.displayType …}`; the
    // Tailwind port reads the same value through `useTheme()` and swaps a
    // text-size utility instead. `text-body1` / `text-body2` are declared in
    // `tailwind.config.ts` to match the styled-components Body{1,2}Class.
    const theme = useTheme();
    const sizeClass = theme.displayType === 'full-width' ? 'text-body2' : 'text-body1';
    return (
        <span
            className={`select-none mb-4 text-center text-textSecondary font-medium not-italic ${sizeClass}`}
        >
            {children}
        </span>
    );
};

export const UpdateWalletName: FC<{
    walletEmoji: string;
    name?: string;
    submitHandler: ({ name, emoji }: { name: string; emoji: string }) => void;
    isLoading?: boolean;
    buttonText?: string;
}> = ({ walletEmoji, submitHandler, name: nameProp, isLoading, buttonText }) => {
    const { t } = useTranslation();
    const { ref: containerRef, stretcher } = useMobileModalFullScreenStretcher();

    const ref = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, []);

    const [name, setName] = useState(nameProp || '');
    const [emoji, setEmoji] = useState(walletEmoji);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        submitHandler({ name, emoji });
    };

    const onChange = (value: string) => {
        setName(value);
    };

    const isValid = name.length >= 3;

    return (
        <>
            <CenterContainer ref={containerRef} $mobileFitContent>
                <form className="flex flex-col gap-4 text-center" onSubmit={onSubmit}>
                    <div>
                        <H2Label2Responsive>{t('Name_your_wallet')}</H2Label2Responsive>
                        <Body>{t('Name_your_wallet_description')}</Body>
                    </div>

                    <Input
                        id="wallet-name"
                        ref={ref}
                        value={name}
                        onChange={onChange}
                        label={t('Wallet_name')}
                        isValid={isValid}
                        rightElement={emoji ? <WalletEmoji emoji={emoji} /> : null}
                    />
                    <EmojisList keepShortListForMS={500} onClick={setEmoji} />

                    <NotificationFooterPortal>
                        <NotificationFooter>
                            <ButtonResponsiveSize
                                fullWidth
                                primary
                                disabled={!isValid}
                                type="submit"
                                loading={isLoading}
                                onClick={() => submitHandler({ name, emoji })}
                            >
                                {buttonText ?? t('add_edit_favorite_save')}
                            </ButtonResponsiveSize>
                        </NotificationFooter>
                    </NotificationFooterPortal>
                </form>
            </CenterContainer>
            {stretcher}
        </>
    );
};
