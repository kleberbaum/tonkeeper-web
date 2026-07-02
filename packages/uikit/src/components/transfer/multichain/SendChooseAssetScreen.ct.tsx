import { expect, screenshotEachMode, test } from '../../../../playwright/test';
import { SendChooseAssetScreen } from './SendChooseAssetScreen';

const noop = () => {};

// The seeded harness account has no backend asset feed in component tests, so
// the wallet reads as empty — which is exactly the empty-state screenshot we
// want here. The populated list is data-driven off the network and is left to
// the E2E suite; individual rows/among-chains logic are covered elsewhere.
screenshotEachMode(
    'SendChooseAsset empty',
    () => <SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('SendChooseAsset shows the empty state with an Add Funds action', async ({ mount, page }) => {
    let added = 0;
    await mount(
        <SendChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onAddFunds={() => (added += 1)}
        />
    );
    await expect(page.getByText('Nothing to send yet')).toBeVisible();
    const addFunds = page.getByRole('button', { name: 'Add Funds' });
    await expect(addFunds).toBeVisible();
    await addFunds.click();
    expect(added).toBe(1);
});

test('SendChooseAsset renders the search field', async ({ mount, page }) => {
    await mount(<SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />);
    await expect(page.getByPlaceholder('Search by ticker or name')).toBeVisible();
});
