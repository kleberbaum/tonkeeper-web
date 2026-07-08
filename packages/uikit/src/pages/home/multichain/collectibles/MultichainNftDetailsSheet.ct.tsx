import type { Page } from 'playwright-core';

import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { MultichainNftDetailsSheet } from './MultichainNftDetailsSheet';

const noop = () => {};

const PREVIEW =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#2FA8A0"/></svg>'
    );

const NFT_ADDRESS = '0:' + 'a1'.repeat(32);
const COLLECTION_ADDRESS = '0:' + 'b2'.repeat(32);
const OWNER_ADDRESS = '0:' + 'c3'.repeat(32);

const sampleNft = (overrides: Record<string, unknown>): NFT =>
    ({
        address: NFT_ADDRESS,
        owner: { address: OWNER_ADDRESS },
        previews: [{ resolution: '500x500', url: PREVIEW }],
        metadata: {
            name: 'Loot box #38',
            description:
                'The loot box will open after some time and turn into an NFT wearable or accessory for your avatar collection.'
        },
        collection: {
            address: COLLECTION_ADDRESS,
            name: 'StickerFace Wearables',
            description:
                'Fashion collection with clothes and wearables for StickerFace avatars, created by the community.'
        },
        trust: 'whitelist',
        ...overrides
    } as unknown as NFT);

// Modal renders as a centered dialog on desktop and a bottom sheet on
// mobile — snapshot the `role="dialog"` card in both.
screenshotEachMode(
    'MultichainNftDetailsSheet full',
    () => (
        <MultichainNftDetailsSheet
            nft={sampleNft({
                metadata: {
                    name: 'Loot box #38',
                    description:
                        'The loot box will open after some time and turn into an NFT wearable or accessory for your avatar collection.',
                    attributes: [
                        { trait_type: 'Size', value: 'Small' },
                        { trait_type: 'Color', value: 'Green' }
                    ]
                }
            })}
            isOpen
            onClose={noop}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'MultichainNftDetailsSheet on sale shows chip',
    () => (
        <MultichainNftDetailsSheet
            nft={sampleNft({ sale: { address: '0:sale' } })}
            isOpen
            onClose={noop}
        />
    ),
    ['desktop'],
    { target: 'dialog' }
);

// The dialog is capped to the viewport height and scrolls internally, so at
// the default 800px viewport everything below the square hero image is cut
// out of the capture. These two variants differ from the baseline only
// below that fold (report-spam button, details cells without a collection
// line) — stretch the viewport so the dialog renders its full content.
const fullDialogHeight = (page: Page) => page.setViewportSize({ width: 1280, height: 2400 });

screenshotEachMode(
    'MultichainNftDetailsSheet unverified shows report spam',
    () => <MultichainNftDetailsSheet nft={sampleNft({ trust: 'none' })} isOpen onClose={noop} />,
    ['desktop'],
    { target: 'dialog', setupPage: fullDialogHeight }
);

screenshotEachMode(
    'MultichainNftDetailsSheet single without collection',
    () => (
        <MultichainNftDetailsSheet
            nft={sampleNft({ collection: undefined, metadata: { name: 'Lonely NFT' } })}
            isOpen
            onClose={noop}
        />
    ),
    ['desktop'],
    { target: 'dialog', setupPage: fullDialogHeight }
);

test('shows details cells and explorer link', async ({ mount, page }) => {
    await mount(<MultichainNftDetailsSheet nft={sampleNft({})} isOpen onClose={noop} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Owner')).toBeVisible();
    await expect(dialog.getByText('Contract address')).toBeVisible();
    await expect(dialog.getByText('View in explorer')).toBeVisible();
});

test('report spam only offered for unverified items', async ({ mount, page }) => {
    await mount(
        <MultichainNftDetailsSheet nft={sampleNft({ trust: 'none' })} isOpen onClose={noop} />
    );
    await expect(page.getByRole('dialog').getByText('Report Spam')).toBeVisible();
});

test('verified items have no report spam button', async ({ mount, page }) => {
    await mount(<MultichainNftDetailsSheet nft={sampleNft({})} isOpen onClose={noop} />);
    await expect(page.getByRole('dialog').getByText('Report Spam')).toHaveCount(0);
});
