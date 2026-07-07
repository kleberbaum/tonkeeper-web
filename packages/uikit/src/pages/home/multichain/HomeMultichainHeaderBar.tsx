import { FC } from 'react';

import { useActiveAccount } from '../../../state/wallet';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { useTranslation } from '../../../hooks/translation';
import { AppRoute, MultichainRoute } from '../../../libs/routes';
import IcQrViewfinderOutline28 from '../../../icons/components/IcQrViewfinderOutline28';
import IcClockOutline28 from '../../../icons/components/IcClockOutline28';
import IcGearOutline28 from '../../../icons/components/IcGearOutline28';
import IcChevronDown16 from '../../../icons/components/IcChevronDown16';

export const HomeMultichainHeaderBar: FC = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const navigate = useNavigate();

    return (
        <div className="relative h-16 text-iconSecondary">
            <button
                type="button"
                aria-label={t('scan_qr_title')}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 transition-opacity hover:opacity-80"
                onClick={() => {
                    /* QR scan entry-point — wired in a follow-up */
                }}
            >
                <IcQrViewfinderOutline28 className="h-7 w-7" />
            </button>
            <button
                type="button"
                className="absolute left-1/2 top-1/2 flex h-10 max-w-[calc(100%-208px)] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-[20px] bg-buttonTertiaryBackground pl-[18px] pr-3 text-label2 text-textPrimary transition-colors hover:bg-buttonTertiaryBackgroundHighlighted"
                onClick={() => {
                    /* Wallet picker — wired to existing switcher in a follow-up */
                }}
            >
                <span className="shrink-0 text-lg">{account.emoji}</span>
                <span className="min-w-0 truncate">{account.name}</span>
                <IcChevronDown16 className="h-4 w-4 shrink-0 text-iconSecondary opacity-[0.64]" />
            </button>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
                <button
                    type="button"
                    aria-label={t('page_header_history')}
                    className="p-2.5 transition-opacity hover:opacity-80"
                    onClick={() => navigate(MultichainRoute.history)}
                >
                    <IcClockOutline28 className="h-7 w-7" />
                </button>
                <button
                    type="button"
                    aria-label={t('wallet_aside_settings')}
                    className="p-2.5 transition-opacity hover:opacity-80"
                    onClick={() => navigate(AppRoute.settings)}
                >
                    <IcGearOutline28 className="h-7 w-7" />
                </button>
            </div>
        </div>
    );
};
