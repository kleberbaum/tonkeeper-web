import { expect, screenshot, test } from '../../../../../playwright/test';
import { ManageCryptoSaveBar } from './ManageCryptoSaveBar';

// Edge cases the suite targets:
//   - default state shows "Save Changes" and the button is enabled.
//   - `isSaving` swaps the label to "Saving…" and disables the button
//     (disabled:opacity-60), so onSave can't fire while a save is in flight.
//   - the bar is `absolute inset-x-0 bottom-0`; it needs a positioned,
//     sized parent to anchor against — the frame supplies `relative`.

// CT's static mount-loader can't resolve wrappers defined in the test file,
// so inline the positioned frame the absolute bar anchors to.
const FRAME = 'relative h-40 w-[400px] bg-backgroundPage';

screenshot('ManageCryptoSaveBar idle', () => (
    <div className={FRAME}>
        <ManageCryptoSaveBar onSave={() => {}} isSaving={false} />
    </div>
));

screenshot('ManageCryptoSaveBar saving', () => (
    <div className={FRAME}>
        <ManageCryptoSaveBar onSave={() => {}} isSaving />
    </div>
));

test('ManageCryptoSaveBar fires onSave when idle', async ({ mount }) => {
    let saved = 0;
    const c = await mount(
        <div className="relative h-40 w-[400px] bg-backgroundPage">
            <ManageCryptoSaveBar onSave={() => saved++} isSaving={false} />
        </div>
    );
    await expect(c.getByRole('button')).toContainText('Save Changes');
    await c.getByRole('button').click();
    expect(saved).toBe(1);
});

test('ManageCryptoSaveBar disables the button and shows progress while saving', async ({
    mount
}) => {
    let saved = 0;
    const c = await mount(
        <div className="relative h-40 w-[400px] bg-backgroundPage">
            <ManageCryptoSaveBar onSave={() => saved++} isSaving />
        </div>
    );
    const button = c.getByRole('button');
    await expect(button).toContainText('Saving');
    await expect(button).toBeDisabled();
    await button.click({ force: true });
    expect(saved).toBe(0);
});
