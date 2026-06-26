import { expect, screenshot, test } from '../../../../../playwright/test';
import { CryptoCatalogSearch } from './CryptoCatalogSearch';

// Edge cases the screenshot suite targets:
//   - empty value renders the translated placeholder in the secondary text
//     colour beside the search glyph.
//   - filled value renders typed text in the primary colour; the field flexes
//     to fill the row without pushing the icon out of alignment.

const CARD = 'w-[360px] rounded-medium bg-backgroundContent p-4';

screenshot('CryptoCatalogSearch empty placeholder', () => (
    <div className={CARD}>
        <CryptoCatalogSearch value="" onChange={() => {}} />
    </div>
));

screenshot('CryptoCatalogSearch with value', () => (
    <div className={CARD}>
        <CryptoCatalogSearch value="Toncoin" onChange={() => {}} />
    </div>
));

test('CryptoCatalogSearch typing forwards onChange', async ({ mount }) => {
    let last = '';
    const c = await mount(
        <div className={CARD}>
            <CryptoCatalogSearch value="" onChange={v => (last = v)} />
        </div>
    );
    await c.getByRole('textbox').fill('USDT');
    expect(last).toBe('USDT');
});
