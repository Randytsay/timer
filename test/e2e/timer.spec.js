import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('changes duration, starts, pauses, and resets a countdown', async ({ page }) => {
    await page.getByRole('button', { name: '+30秒' }).click();
    await expect(page.locator('#time-min')).toHaveText('05');
    await expect(page.locator('#time-sec')).toHaveText('30');

    await page.locator('#btn-main-action').click();
    await expect(page.locator('#icon-pause')).not.toHaveClass(/hidden-force/);

    await page.locator('body').press('Space');
    await expect(page.locator('#icon-play')).not.toHaveClass(/hidden-force/);

    await page.getByRole('button', { name: '重置' }).click();
    await expect(page.locator('#time-min')).toHaveText('05');
    await expect(page.locator('#time-sec')).toHaveText('30');
});

test('switches between countdown and clock modes', async ({ page }) => {
    await page.locator('#btn-mode-toggle').click();
    await expect(page.locator('#btn-mode-toggle')).toContainText('切換倒數');
    await expect(page.locator('#time-hour')).not.toHaveClass(/hidden-force/);

    await page.locator('#btn-mode-toggle').click();
    await expect(page.locator('#btn-mode-toggle')).toContainText('切換時鐘');
});

test('selects every built-in sound and display font', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 769, 'Secondary settings are intentionally inside the mobile drawer.');
    for (const sound of ['和弦', '思考', '綜藝']) {
        await page.getByRole('button', { name: sound }).click();
        await expect(page.getByRole('button', { name: sound })).toHaveClass(/ring-cyan-500\/50/);
    }

    const fontClasses = {
        Orbitron: 'font-orbitron',
        Bebas: 'font-bebas',
        Michroma: 'font-michroma',
        JetBrains: 'font-jetbrains'
    };
    for (const [font, className] of Object.entries(fontClasses)) {
        await page.getByRole('button', { name: font }).click();
        await expect(page.locator('#time-display')).toHaveClass(new RegExp(className));
    }
});

test('does not start a hidden timer when Space is pressed in clock mode', async ({ page }) => {
    await page.locator('#btn-mode-toggle').click();
    await page.locator('body').press('Space');
    await expect(page.locator('#time-hour')).not.toHaveClass(/hidden-force/);
    await expect(page.locator('#btn-main-action')).toHaveClass(/hidden-force/);
});

test('centers the running display on phone viewports and keeps counting overtime', async ({ page }, testInfo) => {
    test.skip(!['iphone-se', 'iphone-13', 'pixel-7'].includes(testInfo.project.name), 'This assertion targets phone-sized viewports.');
    await page.locator('#time-display').click();
    await page.locator('#input-min').fill('0');
    await page.locator('#input-sec').fill('1');
    await page.getByRole('button', { name: '確定' }).click();
    await page.locator('#btn-main-action').click();

    const layout = await page.locator('#time-display').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { center: rect.top + rect.height / 2, viewportCenter: window.innerHeight / 2 };
    });
    expect(Math.abs(layout.center - layout.viewportCenter)).toBeLessThanOrEqual(8);

    await expect(page.locator('#time-min')).toHaveText('-00', { timeout: 4_000 });
    await expect(page.locator('#time-sec')).toHaveText('01', { timeout: 2_500 });
});

test('fits page, primary controls, and modal in the active viewport', async ({ page }) => {
    const layout = await page.evaluate(() => {
        const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
        return { width: window.innerWidth, height: window.innerHeight, scrollWidth: document.documentElement.scrollWidth,
            display: rect('#time-display'), reset: rect('#btn-reset'), action: rect('#btn-main-action'), mode: rect('#btn-mode-toggle'),
            quickControls: [...document.querySelectorAll('#btn-minus, .quick-add, #btn-plus')].map((element) => element.getBoundingClientRect()) };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
    for (const element of [layout.display, layout.reset, layout.action, layout.mode]) {
        expect(element.left).toBeGreaterThanOrEqual(0);
        expect(element.right).toBeLessThanOrEqual(layout.width);
    }
    for (const control of layout.quickControls) {
        expect(control.left).toBeGreaterThanOrEqual(0);
        expect(control.right).toBeLessThanOrEqual(layout.width);
    }
    await page.locator('#time-display').click();
    const modal = await page.locator('#input-modal > div').evaluate((element) => element.getBoundingClientRect());
    expect(modal.left).toBeGreaterThanOrEqual(0);
    expect(modal.right).toBeLessThanOrEqual(layout.width);
    expect(modal.bottom).toBeLessThanOrEqual(layout.height);

    const inputs = await page.locator('#input-min, #input-sec').evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect())
    );
    for (const input of inputs) {
        expect(input.left).toBeGreaterThanOrEqual(0);
        expect(input.right).toBeLessThanOrEqual(layout.width);
    }
});

test('keeps the desktop display within the viewport while running', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('desktop-'), 'This assertion targets desktop browser projects.');
    await page.setViewportSize({ width: 2000, height: 1237 });
    await page.locator('#btn-main-action').click();

    const bounds = await page.locator('#time-display').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });

    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(2000);
    expect(bounds.top).toBeGreaterThanOrEqual(0);
    expect(bounds.bottom).toBeLessThanOrEqual(1237);
});

test('keeps every primary control visible in mobile portrait', async ({ page }, testInfo) => {
    test.skip(!['iphone-se', 'iphone-13', 'pixel-7'].includes(testInfo.project.name), 'This assertion targets phone-sized portrait viewports.');
    await page.setViewportSize({ width: 390, height: 844 });
    const layout = await page.evaluate(() => {
        const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
        const display = rect('#time-display');
        const controls = rect('#controls-panel');
        const reset = rect('#btn-reset');
        const action = rect('#btn-main-action');
        return { display, controls, reset, action };
    });

    expect(layout.display.bottom).toBeLessThanOrEqual(layout.controls.top);
    expect(layout.reset.left).toBeGreaterThanOrEqual(0);
    expect(layout.action.right).toBeLessThanOrEqual(390);
    expect(layout.controls.bottom).toBeLessThanOrEqual(844);
});

test('expands and collapses secondary settings on phone-sized viewports', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 769, 'The drawer is only collapsed by default on phones.');
    const drawer = page.locator('#settings-drawer');
    const summary = drawer.locator('summary');

    await expect(drawer).not.toHaveAttribute('open', '');
    await summary.click();
    await expect(drawer).toHaveAttribute('open', '');
    await expect(page.locator('#sound-selector')).toBeVisible();
    await summary.click();
    await expect(drawer).not.toHaveAttribute('open', '');
});

test('offers accessible audio controls and keyboard timer shortcuts', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 769, 'Secondary settings are inside the mobile drawer.');
    await expect(page.locator('#usage-hint')).toBeVisible();
    await page.getByRole('button', { name: '靜音' }).click();
    await expect(page.getByRole('button', { name: '取消靜音' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '停止音效' }).click();

    await page.locator('body').press('ArrowUp');
    await expect(page.locator('#time-min')).toHaveText('05');
    await expect(page.locator('#time-sec')).toHaveText('10');
});

test('opens and closes the time dialog with keyboard focus support', async ({ page }) => {
    await page.locator('#time-display').click();
    await expect(page.getByRole('dialog', { name: '設定時間' })).toBeVisible();
    await expect(page.locator('#input-min')).toBeFocused();
    await page.locator('#input-min').press('Escape');
    await expect(page.getByRole('dialog', { name: '設定時間' })).toBeHidden();
    await expect(page.locator('#time-display')).toBeFocused();
});

test('captures the responsive reference view', async ({ page }, testInfo) => {
    await page.screenshot({ path: testInfo.outputPath('viewport.png') });
});
