import { FC, useEffect } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives/Button';
import { useActiveConfig } from '../../state/wallet';
import { ExclamationMarkCircleIcon } from '../Icon';

/**
 * Create-flow recovery phrase display. Renders the freshly generated
 * 12/24-word mnemonic as a numbered two-column grid and advances to the
 * verification step.
 *
 * `showMamInfo` switches the screen into the MAM (multi-account
 * mnemonic) variant: an explainer callout sits above the grid and the
 * heading swaps to the MAM-specific "Your Account Recovery Phrase",
 * so the MAM create flow shares the same screen without a fork.
 */
export const BackupShow: FC<{
    mnemonic: string[];
    onCheck: () => void;
    showMamInfo?: boolean;
}> = ({ mnemonic, onCheck, showMamInfo }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const config = useActiveConfig();

    useEffect(() => {
        sdk.twaExpand?.();
    }, [sdk]);

    const captionKey = mnemonic.length === 12 ? 'secret_words_caption_12' : 'secret_words_caption';
    const titleKey = showMamInfo ? 'secret_words_account_title' : 'secret_words_title';

    return (
        <div className="mx-auto flex w-full max-w-[524px] flex-col">
            <div className="flex flex-col items-center gap-1 pb-4 text-center">
                <h2 className="text-h2 text-textPrimary">{t(titleKey)}</h2>
                <p className="text-balance text-body1 text-textSecondary">{t(captionKey)}</p>
            </div>

            {showMamInfo && (
                <div className="mb-4 flex items-start gap-3 rounded-medium bg-backgroundContent p-3">
                    <p className="flex-1 text-body3 text-textSecondary">
                        {t('mam_account_explanation') + ' '}
                        {!!config.mam_learn_more_url && (
                            <button
                                type="button"
                                onClick={() => sdk.openPage(config.mam_learn_more_url!)}
                                className="cursor-pointer border-0 bg-transparent p-0 text-body3 text-accentBlueConstant"
                            >
                                {t('learn_more')}
                            </button>
                        )}
                    </p>
                    <ExclamationMarkCircleIcon className="mt-1 h-4 w-4 shrink-0 text-accentOrange" />
                </div>
            )}

            <div
                className="mx-auto grid w-full max-w-[310px] gap-x-4 gap-y-2 py-4"
                style={{
                    gridTemplateRows: `repeat(${mnemonic.length / 2}, minmax(0, 1fr))`,
                    gridAutoFlow: 'column'
                }}
            >
                {mnemonic.map((word, index) => (
                    <div key={index} className="flex items-baseline gap-1 pr-4">
                        <span
                            aria-hidden
                            className="w-6 select-none text-right text-body2 text-textSecondary"
                        >
                            {index + 1}.
                        </span>
                        <span className="text-body1 text-textPrimary">{word}</span>
                    </div>
                ))}
            </div>

            <Button size="large" variant="primaryBlue" fullWidth onClick={onCheck} className="mt-4">
                {t('check_backup_button')}
            </Button>
        </div>
    );
};
