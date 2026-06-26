import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';

const Close16 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

export const ManageCryptoHeader: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    return (
        <header className="relative flex h-[64px] shrink-0 items-center justify-center px-16">
            <div className="text-h3 text-textPrimary">{t('wallet_manage_crypto_title')}</div>
            <button
                aria-label={t('close')}
                onClick={onClose}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground"
            >
                <Close16 />
            </button>
        </header>
    );
};
