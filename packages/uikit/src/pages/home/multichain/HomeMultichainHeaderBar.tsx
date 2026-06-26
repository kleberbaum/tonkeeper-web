import { FC } from 'react';

import { useActiveAccount } from '../../../state/wallet';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { useTranslation } from '../../../hooks/translation';
import { AppRoute } from '../../../libs/routes';

const QrScannerIcon: FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6 text-iconPrimary"
    >
        <path
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"
        />
    </svg>
);

const ClockIcon: FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6 text-iconPrimary"
    >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M12 7v5l3.5 2.5" />
    </svg>
);

const GearIcon: FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6 text-iconPrimary"
    >
        <path
            stroke="currentColor"
            strokeWidth="1.6"
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.3 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.5 2.6c-.7.3-1.4.7-2 1.2l-2.3-1-2 3.4 2 1.6c-.1.4-.1.8-.1 1.2s0 .8.1 1.2l-2 1.6 2 3.4 2.3-1c.6.5 1.3.9 2 1.2l.5 2.6h5l.5-2.6c.7-.3 1.4-.7 2-1.2l2.3 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z"
        />
    </svg>
);

export const HomeMultichainHeaderBar: FC = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-between px-4 py-3">
            <button
                type="button"
                aria-label={t('scan_qr_title')}
                className="-m-2 p-2 transition-opacity hover:opacity-80"
                onClick={() => {
                    /* QR scan entry-point — wired in a follow-up */
                }}
            >
                <QrScannerIcon />
            </button>
            <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-full bg-buttonTertiaryBackground px-3 text-label2 text-textPrimary transition-colors hover:bg-buttonTertiaryBackgroundHighlighted"
                onClick={() => {
                    /* Wallet picker — wired to existing switcher in a follow-up */
                }}
            >
                <span className="text-lg">{account.emoji}</span>
                <span>{account.name}</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-iconSecondary"
                >
                    <path
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m3 4.5 3 3 3-3"
                    />
                </svg>
            </button>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label={t('page_header_history')}
                    className="-m-2 p-2 transition-opacity hover:opacity-80"
                    onClick={() => navigate(AppRoute.activity)}
                >
                    <ClockIcon />
                </button>
                <button
                    type="button"
                    aria-label={t('wallet_aside_settings')}
                    className="-m-2 p-2 transition-opacity hover:opacity-80"
                    onClick={() => navigate(AppRoute.settings)}
                >
                    <GearIcon />
                </button>
            </div>
        </div>
    );
};
