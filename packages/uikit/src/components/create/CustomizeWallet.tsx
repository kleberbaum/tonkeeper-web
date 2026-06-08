import { FC, FormEventHandler, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { EmojisList } from '../shared/emoji/EmojisList';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';

/**
 * Create-flow "Customize your wallet". Wallet name + emoji selection in
 * the same screen — the user picks the icon from the grid below and the
 * picked emoji renders as the input's right affordance.
 */
export const CustomizeWallet: FC<{
    walletEmoji: string;
    name?: string;
    submitHandler: (form: { name: string; emoji: string }) => void;
    isLoading?: boolean;
    buttonText?: string;
}> = ({ walletEmoji, name: nameProp, submitHandler, isLoading, buttonText }) => {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [name, setName] = useState(nameProp || '');
    const [emoji, setEmoji] = useState(walletEmoji);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const isValid = name.length >= 3;

    const onSubmit: FormEventHandler<HTMLFormElement> = e => {
        e.preventDefault();
        if (!isValid) return;
        submitHandler({ name, emoji });
    };

    return (
        <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[524px] flex-col gap-4">
            <div className="flex flex-col items-center gap-1 px-8 pb-4 text-center">
                <h2 className="text-h2 text-textPrimary">{t('customize_wallet_title')}</h2>
                <p className="text-balance text-body1 text-textSecondary">
                    {t('customize_wallet_description')}
                </p>
            </div>

            <Input
                id="wallet-name"
                ref={inputRef}
                value={name}
                onChange={setName}
                label={t('Wallet_name')}
                isValid={isValid}
                rightElement={emoji ? <WalletEmoji emoji={emoji} /> : null}
            />

            <EmojisList keepShortListForMS={500} onClick={setEmoji} />

            <Button
                size="large"
                variant="primaryBlue"
                fullWidth
                type="submit"
                loading={isLoading}
                disabled={!isValid}
            >
                {buttonText ?? t('continue')}
            </Button>
        </form>
    );
};
