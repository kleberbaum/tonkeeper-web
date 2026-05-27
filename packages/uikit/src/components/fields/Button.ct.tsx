import { Button } from './Button';
import { expect, screenshot, test } from '../../../playwright/test';

// Default: one screenshot per state. Button has no breakpoint-dependent layout,
// so a single render is enough. (For responsive components, use
// `screenshotEachMode` to capture both desktop and mobile.)
screenshot('Button primary', () => <Button primary>Send</Button>);

screenshot('Button secondary disabled', () => (
    <Button secondary disabled>
        Cancel
    </Button>
));

screenshot('Button loading', () => (
    <Button primary loading>
        Send
    </Button>
));

// Behaviour: a component test is a real browser, so interactions work too.
test('Button forwards onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(
        <Button primary onClick={() => (clicks += 1)}>
            Send
        </Button>
    );

    await component.click();

    expect(clicks).toBe(1);
});

test('disabled Button is not clickable', async ({ mount }) => {
    const component = await mount(
        <Button primary disabled>
            Send
        </Button>
    );

    await expect(component).toBeDisabled();
});
