import { FC } from 'react';

import { IconButton } from '../../../primitives';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { AppRoute } from '../../../libs/routes';
import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';
import { SendIcon, ReceiveIcon } from '../../../components/home/HomeIcons';
import IcSwapHorizontal28 from '../../../icons/components/IcSwapHorizontal28';
import { StakingIcon } from '../../../components/Icon';
import { useSwapMobileNotification } from '../../../state/swap/useSwapMobileNotification';

export const HomeMultichainActions: FC = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [, setSwapOpen] = useSwapMobileNotification();

    const onSend = () =>
        sdk.uiEvents.emit('transfer', {
            method: 'transfer',
            id: Date.now(),
            params: { from: 'wallet' } as TransferInitParams
        });

    const onAddFunds = () => sdk.uiEvents.emit('receive', { method: 'receive', params: {} });

    const onSwap = () => setSwapOpen(true);

    const onStake = () => navigate(AppRoute.staking);

    return (
        <div className="flex items-center justify-center gap-2 py-4">
            <IconButton icon={<SendIcon />} label={t('wallet_send')} onClick={onSend} />
            <IconButton icon={<ReceiveIcon />} label={t('wallet_add_funds')} onClick={onAddFunds} />
            <IconButton
                icon={<IcSwapHorizontal28 className="h-7 w-7" />}
                label={t('swap_title')}
                onClick={onSwap}
            />
            <IconButton
                icon={<StakingIcon className="h-7 w-7" />}
                label={t('staking_title')}
                onClick={onStake}
            />
        </div>
    );
};
