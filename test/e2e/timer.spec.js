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
