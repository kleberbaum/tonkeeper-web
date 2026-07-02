import { SwipeToConfirm } from './SwipeToConfirm';
import { expect, screenshot, test } from '../../playwright/test';

// A plain host <div> gives the slider its track width. Playwright CT can only
// mount real imported components (not ones defined in the test file), so the
// width wrapper must stay a host element rather than a local component.
const TRACK = 'w-[358px]';

screenshot('SwipeToConfirm idle', () => (
    <div className={TRACK}>
        <SwipeToConfirm onConfirm={() => {}} label="Confirm" hint="Swipe right" />
    </div>
));
screenshot('SwipeToConfirm loading', () => (
    <div className={TRACK}>
        <SwipeToConfirm onConfirm={() => {}} status="loading" label="Confirm" hint="Swipe right" />
    </div>
));
screenshot('SwipeToConfirm done', () => (
    <div className={TRACK}>
        <SwipeToConfirm onConfirm={() => {}} status="done" doneLabel="Done" />
    </div>
));
screenshot('SwipeToConfirm disabled', () => (
    <div className={TRACK}>
        <SwipeToConfirm onConfirm={() => {}} disabled label="Confirm" hint="Swipe right" />
    </div>
));

test('done state shows the done label', async ({ mount }) => {
    const component = await mount(
        <div className={TRACK}>
            <SwipeToConfirm onConfirm={() => {}} status="done" doneLabel="Done" />
        </div>
    );
    await expect(component.getByText('Done')).toBeVisible();
});

test('dragging the handle to the end fires onConfirm', async ({ mount, page }) => {
    let confirmed = false;
    const component = await mount(
        <div className={TRACK}>
            <SwipeToConfirm
                onConfirm={() => (confirmed = true)}
                label="Confirm"
                hint="Swipe right"
            />
        </div>
    );

    const handle = component.getByRole('button', { name: 'Confirm' });
    const handleBox = await handle.boundingBox();
    const trackBox = await component.boundingBox();
    expect(handleBox && trackBox).toBeTruthy();

    const startX = handleBox!.x + handleBox!.width / 2;
    const y = handleBox!.y + handleBox!.height / 2;
    // Drag past the completion threshold (clamped to the track's right edge).
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(trackBox!.x + trackBox!.width, y, { steps: 12 });
    await page.mouse.up();

    expect(confirmed).toBe(true);
});

test('releasing short of the threshold does not fire onConfirm', async ({ mount, page }) => {
    let confirmed = false;
    const component = await mount(
        <div className={TRACK}>
            <SwipeToConfirm
                onConfirm={() => (confirmed = true)}
                label="Confirm"
                hint="Swipe right"
            />
        </div>
    );

    const handle = component.getByRole('button', { name: 'Confirm' });
    const handleBox = await handle.boundingBox();
    const startX = handleBox!.x + handleBox!.width / 2;
    const y = handleBox!.y + handleBox!.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX + 30, y, { steps: 4 });
    await page.mouse.up();

    expect(confirmed).toBe(false);
});
