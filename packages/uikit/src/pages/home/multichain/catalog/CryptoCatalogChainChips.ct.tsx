import { expect, screenshot, test } from '../../../../../playwright/test';
import { CryptoCatalogChainChips } from './CryptoCatalogChainChips';

// Edge cases the screenshot suite targets:
//   - "All" chip (code === undefined) renders the translated label and carries
//     no chain icon; every other chip pairs its 20px chain glyph with a label.
//   - active chip uses the secondary button colours, inactive ones the tertiary
//     colours — the only signal of the current filter.
//   - the strip scrolls horizontally (8 chips, hidden scrollbar) inside a
//     constrained width without wrapping.

const CARD = 'w-[360px] rounded-medium bg-backgroundContent p-4';

screenshot('CryptoCatalogChainChips all selected', () => (
    <div className={CARD}>
        <CryptoCatalogChainChips value={undefined} onChange={() => {}} />
    </div>
));

screenshot('CryptoCatalogChainChips chain selected', () => (
    <div className={CARD}>
        <CryptoCatalogChainChips value="ton" onChange={() => {}} />
    </div>
));

test('CryptoCatalogChainChips selecting a chain forwards its code', async ({ mount }) => {
    let selected: string | undefined = 'unset';
    const c = await mount(
        <div className={CARD}>
            <CryptoCatalogChainChips value={undefined} onChange={v => (selected = v)} />
        </div>
    );
    await c.getByRole('button', { name: 'Ton', exact: true }).click();
    expect(selected).toBe('ton');
});

test('CryptoCatalogChainChips re-selecting All clears the filter', async ({ mount }) => {
    let selected: string | undefined = 'ton';
    const c = await mount(
        <div className={CARD}>
            <CryptoCatalogChainChips value="ton" onChange={v => (selected = v)} />
        </div>
    );
    await c.getByRole('button', { name: 'All', exact: true }).click();
    expect(selected).toBeUndefined();
});
