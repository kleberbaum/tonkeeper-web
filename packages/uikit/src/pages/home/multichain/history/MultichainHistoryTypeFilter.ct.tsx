import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainHistoryTypeFilter } from './MultichainHistoryTypeFilter';

const WRAP = 'relative h-[160px] w-[390px] bg-backgroundPage';

screenshot('MultichainHistoryTypeFilter all types pill', () => (
    <div className={WRAP}>
        <MultichainHistoryTypeFilter compact onChange={() => {}} />
    </div>
));

screenshot('MultichainHistoryTypeFilter sent selected pill', () => (
    <div className={WRAP}>
        <MultichainHistoryTypeFilter compact value="send" onChange={() => {}} />
    </div>
));

test('opens the menu and reports the picked type', async ({ mount }) => {
    let picked: string | undefined = 'unset';
    const c = await mount(<MultichainHistoryTypeFilter onChange={type => (picked = type)} />);
    await c.getByRole('button', { name: 'All Types' }).click();
    await c.getByRole('button', { name: 'Received' }).click();
    expect(picked).toBe('receive');
});

test('reflects the selected value in the pill label', async ({ mount }) => {
    const c = await mount(<MultichainHistoryTypeFilter value="send" onChange={() => {}} />);
    await expect(c).toContainText('Sent');
});
