import { Button } from './Button';
import IcSnowflake16 from '../../icons/components/IcSnowflake16';
import { expect, screenshot, test } from '../../../playwright/test';

// Variant × size matrix (the CT harness runs in `displayType="full-width"`, so
// these capture the desktop/mobile-app shell rendering of each variant).
screenshot('Button primary medium', () => <Button variant="primary">Confirm</Button>);
screenshot('Button secondary medium', () => <Button variant="secondary">Cancel</Button>);
screenshot('Button warn medium', () => <Button variant="warn">Delete</Button>);
screenshot('Button tertiary medium', () => <Button variant="tertiary">Action</Button>);
screenshot('Button primary small', () => (
    <Button variant="primary" size="small">
        Confirm
    </Button>
));
screenshot('Button primary large', () => (
    <Button variant="primary" size="large">
        Confirm
    </Button>
));
screenshot('Button primary disabled', () => (
    <Button variant="primary" disabled>
        Confirm
    </Button>
));
screenshot('Button primary loading', () => (
    <Button variant="primary" loading>
        Confirm
    </Button>
));
screenshot('Button primary fullWidth', () => (
    <Button variant="primary" fullWidth>
        Continue
    </Button>
));

// Figma "Buttons States" icon slots — left icon, right icon, icon-only square.
screenshot('Button leftIcon small', () => (
    <Button variant="secondary" size="small" leftIcon={<IcSnowflake16 />}>
        Text
    </Button>
));
screenshot('Button rightIcon small', () => (
    <Button variant="secondary" size="small" rightIcon={<IcSnowflake16 />}>
        Text
    </Button>
));
screenshot('Button iconOnly small', () => (
    <Button variant="secondary" size="small" leftIcon={<IcSnowflake16 />} />
));

test('Button forwards onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(
        <Button variant="primary" onClick={() => (clicks += 1)}>
            Click
        </Button>
    );
    await component.click();
    expect(clicks).toBe(1);
});

test('disabled Button is not clickable', async ({ mount }) => {
    const component = await mount(
        <Button variant="primary" disabled>
            Send
        </Button>
    );
    await expect(component).toBeDisabled();
});

test('loading Button is disabled', async ({ mount }) => {
    const component = await mount(
        <Button variant="primary" loading>
            Send
        </Button>
    );
    await expect(component).toBeDisabled();
});

test('Button sets a default type of "button"', async ({ mount }) => {
    const component = await mount(<Button variant="primary">Confirm</Button>);
    await expect(component).toHaveAttribute('type', 'button');
});

test('legacy `primary` boolean alias still selects the primary variant', async ({ mount }) => {
    // CT mounts a single React root per test, so render both buttons side by
    // side and compare their resolved background colour.
    const container = await mount(
        <div>
            <Button variant="primary" data-testid="enum-primary">
                A
            </Button>
            <Button primary data-testid="bool-primary">
                A
            </Button>
        </div>
    );
    const enumBg = await container
        .locator('[data-testid="enum-primary"]')
        .evaluate(el => getComputedStyle(el).backgroundColor);
    const boolBg = await container
        .locator('[data-testid="bool-primary"]')
        .evaluate(el => getComputedStyle(el).backgroundColor);
    expect(boolBg).toBe(enumBg);
});

test('`variant` wins over the legacy boolean flags', async ({ mount }) => {
    const container = await mount(
        <div>
            <Button variant="warn" primary data-testid="conflict">
                Delete
            </Button>
            <Button variant="warn" data-testid="warn-only">
                Delete
            </Button>
        </div>
    );
    const conflictBg = await container
        .locator('[data-testid="conflict"]')
        .evaluate(el => getComputedStyle(el).backgroundColor);
    const warnBg = await container
        .locator('[data-testid="warn-only"]')
        .evaluate(el => getComputedStyle(el).backgroundColor);
    expect(conflictBg).toBe(warnBg);
});
