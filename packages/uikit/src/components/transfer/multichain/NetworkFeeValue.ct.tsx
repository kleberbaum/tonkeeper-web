import { expect, screenshot, test } from '../../../../playwright/test';
import { NetworkFeeValue } from './NetworkFeeValue';

const noop = () => {};

// Plain host wrapper mirroring the confirm row's cell-value styling (label1 /
// primary, right-aligned) so the screenshot reflects the real look — in
// particular that the fee currency is plain, not the blue "pick a method"
// accent. (Playwright CT can only mount real imported components, not ones
// defined in the test file, so the wrapper must stay a plain <div>.)
const CELL = 'w-[280px] bg-backgroundContent p-4 text-right text-label1 text-textPrimary';

// One screenshot per state — the value has no breakpoint-dependent layout, so
// desktop and mobile would render identically (hence `screenshot`, not
// `screenshotEachMode`).
screenshot('NetworkFeeValue with fiat', () => (
    <div className={CELL}>
        <NetworkFeeValue fiatText="$0.000262" symbol="TON" cryptoText="0.000262 TON" />
    </div>
));

screenshot('NetworkFeeValue crypto only', () => (
    <div className={CELL}>
        <NetworkFeeValue cryptoText="0.000262 TON" symbol="TON" />
    </div>
));

screenshot('NetworkFeeValue loading', () => (
    <div className={CELL}>
        <NetworkFeeValue loading />
    </div>
));

screenshot('NetworkFeeValue error', () => (
    <div className={CELL}>
        <NetworkFeeValue error onRetry={noop} />
    </div>
));

test('NetworkFeeValue retry fires onRetry', async ({ mount }) => {
    let retried = 0;
    const c = await mount(<NetworkFeeValue error onRetry={() => (retried += 1)} />);
    await c.getByText('Retry').click();
    expect(retried).toBe(1);
});

test('NetworkFeeValue renders the currency without the accent affordance', async ({ mount }) => {
    const c = await mount(
        <NetworkFeeValue fiatText="$0.000262" symbol="TON" cryptoText="0.000262 TON" />
    );
    // The symbol is plain text in the value, not a styled accent element.
    await expect(c.locator('.text-textAccent')).toHaveCount(0);
});
