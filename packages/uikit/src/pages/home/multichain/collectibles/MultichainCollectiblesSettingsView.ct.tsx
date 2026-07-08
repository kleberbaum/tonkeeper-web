import { Network } from '@tonkeeper/core/dist/entries/network';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { CollectiblesSettingsGroup } from './collectibles-settings-utils';
import { MultichainCollectiblesSettingsView } from './MultichainCollectiblesSettingsView';

const noop = () => {};

const IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#7665E5"/></svg>'
    );

const group = (overrides: Partial<CollectiblesSettingsGroup>): CollectiblesSettingsGroup => ({
    address: '0:' + 'a1'.repeat(32),
    name: 'Telegram Usernames',
    image: IMAGE,
    count: 3,
    isSingle: false,
    isSpam: false,
    isHidden: false,
    ...overrides
});

const visible = [
    group({}),
    group({ address: '0:' + 'a2'.repeat(32), name: 'Lonely NFT', count: 1, isSingle: true })
];
const hidden = [group({ address: '0:' + 'a3'.repeat(32), name: 'Hidden things', isHidden: true })];
const spam = [
    group({ address: '0:' + 'a4'.repeat(32), name: 'Free Airdrop!!!', count: 1, isSpam: true })
];

screenshot('MultichainCollectiblesSettingsView all sections', () => (
    <div className="w-[390px]">
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={visible}
            hidden={hidden}
            spam={spam}
            onBack={noop}
            onHide={noop}
            onShow={noop}
            onNotSpam={noop}
        />
    </div>
));

screenshot('MultichainCollectiblesSettingsView visible only', () => (
    <div className="w-[390px]">
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={visible}
            hidden={[]}
            spam={[]}
            onBack={noop}
            onHide={noop}
            onShow={noop}
            onNotSpam={noop}
        />
    </div>
));

test('remove and add buttons hide and show groups', async ({ mount }) => {
    const hidden_: string[] = [];
    const shown: string[] = [];
    const c = await mount(
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={[visible[0]]}
            hidden={hidden}
            spam={[]}
            onBack={noop}
            onHide={g => hidden_.push(g.address)}
            onShow={g => shown.push(g.address)}
            onNotSpam={noop}
        />
    );
    await c.getByRole('button', { name: 'remove' }).click();
    await c.getByRole('button', { name: 'add' }).click();
    expect(hidden_).toEqual([visible[0].address]);
    expect(shown).toEqual([hidden[0].address]);
});

test('spam row opens token details; Not Spam trusts the group', async ({ mount, page }) => {
    const trusted: string[] = [];
    const c = await mount(
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={[]}
            hidden={[]}
            spam={spam}
            onBack={noop}
            onHide={noop}
            onShow={noop}
            onNotSpam={g => trusted.push(g.address)}
        />
    );
    await c.getByText('Free Airdrop!!!').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Token Details')).toBeVisible();
    await dialog.getByRole('button', { name: 'Not Spam' }).click();
    expect(trusted).toEqual([spam[0].address]);
    await expect(page.getByRole('dialog')).toHaveCount(0);
});
