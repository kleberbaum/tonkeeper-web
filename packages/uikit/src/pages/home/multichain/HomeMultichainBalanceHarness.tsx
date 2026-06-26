import { FC } from 'react';
import BigNumber from 'bignumber.js';

import { HomeMultichainBalance } from './HomeMultichainBalance';

// Playwright CT serializes mount props across the Node→browser boundary, which
// drops class prototypes — a `BigNumber` arrives as a plain object and the
// formatter then reads it as `NaN` and renders "0". Reconstruct the total here,
// where the body runs in the browser, so the component gets a real `BigNumber`.
export const BalanceHarness: FC<{ totalFiatStr: string }> = ({ totalFiatStr }) => (
    <HomeMultichainBalance totalFiat={new BigNumber(totalFiatStr)} />
);
