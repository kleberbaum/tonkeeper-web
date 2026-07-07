import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainHistoryEmptyState } from './MultichainHistoryEmptyState';

const WRAP = 'flex w-[390px] justify-center bg-backgroundPage py-16';

screenshot('MultichainHistoryEmptyState with add funds', () => (
    <div className={WRAP}>
        <MultichainHistoryEmptyState onAddFunds={() => {}} />
    </div>
));

screenshot('MultichainHistoryEmptyState filtered no results', () => (
    <div className={WRAP}>
        <MultichainHistoryEmptyState showAddFunds={false} />
    </div>
));

test('fires onAddFunds', async ({ mount }) => {
    let clicked = 0;
    const c = await mount(
        <div className={WRAP}>
            <MultichainHistoryEmptyState onAddFunds={() => (clicked += 1)} />
        </div>
    );
    await c.getByRole('button').click();
    expect(clicked).toBe(1);
});
