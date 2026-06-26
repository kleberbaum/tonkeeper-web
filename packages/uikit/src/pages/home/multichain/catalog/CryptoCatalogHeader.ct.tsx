import { expect, screenshot, test } from '../../../../../playwright/test';
import { CryptoCatalogHeader } from './CryptoCatalogHeader';

// Edge cases the screenshot suite targets:
//   - centred title (`wallet_crypto_section`) sits in the middle while the
//     close button is absolutely pinned to the right — title centring must
//     not shift when the button is present.
//   - fixed 64px header height with a secondary-background close affordance.

const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundContent';

screenshot('CryptoCatalogHeader default', () => (
    <div className={CARD}>
        <CryptoCatalogHeader onClose={() => {}} />
    </div>
));

test('CryptoCatalogHeader close button fires onClose', async ({ mount }) => {
    let closed = 0;
    const c = await mount(
        <div className={CARD}>
            <CryptoCatalogHeader onClose={() => closed++} />
        </div>
    );
    await c.getByRole('button').click();
    expect(closed).toBe(1);
});
