import { expect, screenshot, test } from '../../../../playwright/test';
import { BalanceHarness } from './HomeMultichainBalanceHarness';

// Edge cases the screenshot suite targets:
//   - the total renders as the app fiat (USD default from AppContext);
//   - zero, a normal balance, and a large grouped balance all stay on
//     one centered line;
//   - the battery icon is absent here (no battery balance is seeded), so
//     the row is just the amount — the battery branch is covered by the
//     battery state hooks, not this presentational row.

screenshot('HomeMultichainBalance zero', () => (
    <div className="w-[390px]">
        <BalanceHarness totalFiatStr="0" />
    </div>
));

screenshot('HomeMultichainBalance normal', () => (
    <div className="w-[390px]">
        <BalanceHarness totalFiatStr="1234.56" />
    </div>
));

screenshot('HomeMultichainBalance large grouped', () => (
    <div className="w-[390px]">
        <BalanceHarness totalFiatStr="9876543.21" />
    </div>
));

test('HomeMultichainBalance renders the formatted fiat total', async ({ mount }) => {
    const c = await mount(
        <div className="w-[390px]">
            <BalanceHarness totalFiatStr="1234.56" />
        </div>
    );
    await expect(c).toContainText('$');
});
