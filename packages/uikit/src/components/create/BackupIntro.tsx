import { FC } from 'react';
import { Button } from '../../primitives/Button';
import { useTranslation } from '../../hooks/translation';
import { WriteLottieIcon } from '../lottie/LottieIcons';

/**
 * Create-flow backup intro. Sits between the mnemonic-generation
 * loading screens and `BackupShow` — the user sees what they're about
 * to do ("write down your recovery phrase") before the words actually
 * appear.
 *
 * Pure content. The surrounding `Notification` modal owns back/close
 * chrome. The action button is rendered inline at the bottom of the
 * centered column (matching `MnemonicInputForm`) — using
 * `ModalFooterPortal` here would stretch the button to the modal
 * sheet width and lose the column's horizontal padding on desktop.
 */
export const BackupIntro: FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const { t } = useTranslation();

    return (
        <div className="mx-auto flex w-full max-w-[524px] flex-col items-center text-center">
            <WriteLottieIcon />
            <div className="mt-2 flex flex-col gap-1 px-8 pb-8">
                <h2 className="text-h2 text-textPrimary">{t('create_wallet_title')}</h2>
                <p className="text-balance text-body1 text-textSecondary">
                    {t('create_wallet_caption')}
                </p>
            </div>

            <Button size="large" variant="primaryBlue" fullWidth onClick={onContinue}>
                {t('continue')}
            </Button>
        </div>
    );
};
