import { FC } from 'react';
import BigNumber from 'bignumber.js';

import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useBatteryBalance, useCanSeeBattery } from '../../../state/battery';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { AppRoute, WalletSettingsRoute } from '../../../libs/routes';
import { BatteryBalanceIcon } from '../../../components/settings/battery/BatteryInfoHeading';

export const HomeMultichainBalance: FC<{ totalFiat: BigNumber }> = ({ totalFiat }) => {
    const { fiat } = useAppContext();
    const { data: batteryBalance } = useBatteryBalance();
    const canSeeBattery = useCanSeeBattery();
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center gap-2 py-3 text-textPrimary">
            <span className="text-h1">{formatFiatCurrency(fiat, totalFiat)}</span>
            {!!batteryBalance && canSeeBattery && (
                <BatteryBalanceIcon
                    className="h-7 w-auto cursor-pointer"
                    onClick={() => navigate(AppRoute.settings + WalletSettingsRoute.battery)}
                    balance={batteryBalance}
                />
            )}
        </div>
    );
};
