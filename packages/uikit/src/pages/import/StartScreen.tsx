import { FC, MouseEventHandler } from 'react';
import { Button } from '../../components/fields/Button';
import { useAddWalletNotification } from '../../components/modals/AddWalletNotificationControlled';
import { useAppSdk } from '../../hooks/appSdk';
import { useLegalLinks } from '../../state/legal';
import { useTranslation } from '../../hooks/translation';
import cover1x from '../../illustrations/png/cover.webp';
import cover2x from '../../illustrations/png/cover@2x.webp';

/**
 * Onboarding start screen (Figma "Start", `579:49884`). Branded cover at
 * the top, two action buttons (Create / Import), and a Terms of Use link.
 *
 * Pure content — sizing, centering, viewport-bound height, and the
 * "strip the app chrome" decision all belong to `AppLayout` (passed
 * `bare`) at the shell level. The page itself just declares a 524px
 * max-width column and lets the layout do the rest.
 */
const StartScreen: FC = () => {
    const { t } = useTranslation();
    const { onOpen: openAddWallet } = useAddWalletNotification();
    const sdk = useAppSdk();
    const { termsLink } = useLegalLinks();

    const onImport = () => {
        sdk.twaExpand?.();
        sdk.requestExtensionPermission().then(() => openAddWallet({ pickerMode: 'import' }));
    };

    // Route the click through the platform SDK (Electron / extension / web all
    // need a different open path) but keep the `<a href>` semantic so screen
    // readers, right-click / cmd-click, and the keyboard "Enter" all behave
    // like a normal link.
    const onTerms: MouseEventHandler<HTMLAnchorElement> = e => {
        if (!termsLink) return;
        e.preventDefault();
        sdk.openPage(termsLink);
    };

    return (
        <div className="relative mx-auto flex w-full max-w-[524px] flex-1 flex-col">
            {/* this logo position is not 100% correct but this block will be redesigned so I won't fix it here */}
            <div className="flex-1 relative overflow-hidden">
                <img
                    src={cover1x}
                    srcSet={`${cover2x} 2x`}
                    className="absolute bottom-0 left-1/2 w-full max-w-[390px] -translate-x-1/2 select-none"
                    alt=""
                    draggable={false}
                />
            </div>

            <div className="flex flex-col items-center gap-1 px-8 pb-8 text-center">
                <h1 className="text-h2 text-textPrimary">Tonkeeper</h1>
                <p className="text-balance text-body1 text-textSecondary">
                    {t('import_add_wallet_description')}
                </p>
            </div>

            <div className="flex flex-col gap-4 px-8 pb-8">
                {/* "Create" is intentionally disabled — the multichain create
                    flow lands in a later commit; the entry stays so the layout
                    matches the design and users see what's coming. */}
                <Button size="large" variant="primary" fullWidth disabled>
                    {t('start_screen_create_wallet_button')}
                </Button>
                <Button size="large" variant="secondary" fullWidth onClick={onImport}>
                    {t('start_screen_import_wallet_button')}
                </Button>
            </div>

            <p className="px-8 pb-4 text-center text-body2 text-textTertiary">
                {t('start_screen_terms_caption')}{' '}
                <a
                    href={termsLink ?? '#'}
                    onClick={onTerms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-accentBlue hover:underline"
                >
                    {t('start_screen_terms_link')}
                </a>
            </p>
        </div>
    );
};

export default StartScreen;
