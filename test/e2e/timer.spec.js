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

    await page.locator('#btn-main-action').click();
    await expect(page.locator('#icon-play')).not.toHaveClass(/hidden-force/);

    await page.getByRole('button', { name: '重置' }).click();
    await expect(page.locator('#time-min')).toHaveText('05');
    await expect(page.locator('#time-sec')).toHaveText('30');
});

test('switches between countdown and clock modes', async ({ page }) => {
    await page.getByRole('button', { name: '切換時鐘' }).click();
    await expect(page.getByRole('button', { name: '切換倒數' })).toBeVisible();
    await expect(page.locator('#time-hour')).not.toHaveClass(/hidden-force/);

    await page.getByRole('button', { name: '切換倒數' }).click();
    await expect(page.getByRole('button', { name: '切換時鐘' })).toBeVisible();
});

test('selects every built-in sound and display font', async ({ page }) => {
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

test('keeps the desktop display within the viewport while running', async ({ page }) => {
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

test('offers accessible audio controls and keyboard timer shortcuts', async ({ page }) => {
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
