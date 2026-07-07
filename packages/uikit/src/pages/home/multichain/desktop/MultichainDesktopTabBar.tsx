import { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '../../../../libs/css';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import IcWallet28 from '../../../../icons/components/IcWallet28';
import IcTrade28 from '../../../../icons/components/IcTrade28';
import IcExplore28 from '../../../../icons/components/IcExplore28';
import IcClock28 from '../../../../icons/components/IcClock28';
import IcGear28 from '../../../../icons/components/IcGear28';

const Tab: FC<{
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}> = ({ icon, label, active = false, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        aria-disabled={onClick ? undefined : true}
        className={cn(
            'flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 transition-colors',
            active ? 'text-textAccent' : 'text-textSecondary',
            onClick && !active && 'hover:text-textPrimary',
            !onClick && 'cursor-default'
        )}
    >
        <span className="flex size-7 items-center justify-center [&>svg]:size-7">{icon}</span>
        <span className="w-full text-center text-label3">{label}</span>
    </button>
);

/**
 * Desktop section nav, pinned at the bottom of the content column
 * (`MultichainDesktopShell`). Only Wallet and History resolve to a route today;
 * Trade / Browser / Settings are placeholders with no destination yet.
 */
export const MultichainDesktopTabBar: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const onHistory = pathname.startsWith(MultichainRoute.history);

    return (
        <div className="shrink-0 pt-3">
            <div className="flex h-[72px] items-stretch overflow-hidden rounded-2xl border-t-[0.5px] border-separatorCommon bg-backgroundContent px-4 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.16),0_16px_64px_rgba(0,0,0,0.48)]">
                <Tab
                    icon={<IcWallet28 />}
                    label={t('wallet')}
                    active={!onHistory}
                    onClick={() => navigate(MultichainRoute.home)}
                />
                <Tab icon={<IcTrade28 />} label={t('multichain_tab_trade')} />
                <Tab icon={<IcExplore28 />} label={t('multichain_tab_browser')} />
                <Tab
                    icon={<IcClock28 />}
                    label={t('page_header_history')}
                    active={onHistory}
                    onClick={() => navigate(MultichainRoute.history)}
                />
                <Tab icon={<IcGear28 />} label={t('wallet_aside_settings')} />
            </div>
        </div>
    );
};
