import { test, expect } from '../fixtures';

test.describe('Combined Paddle Detail Page', () => {
  test('navigates from paddles list and shows detail', async ({ mockApiPage: page }) => {
    await page.goto('/paddles');
    await expect(page.locator('text=Selkirk')).toBeVisible({ timeout: 10000 });

    const moreDetailsBtn = page.locator('button:has-text("More Details")').first();
    await moreDetailsBtn.click();
    await expect(page).toHaveURL(/\/paddles\/combined\/Selkirk/);
  });

  test('shows paddle company and name', async ({ mockApiPage: page }) => {
    await page.goto('/paddles/combined/Selkirk-Epic');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Selkirk Epic').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows physical specifications', async ({ mockApiPage: page }) => {
    await page.goto('/paddles/combined/Selkirk-Epic');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Physical Specifications')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Shape:')).toBeVisible();
    await expect(page.locator('text=Core Thickness:')).toBeVisible();
    await expect(page.getByText('Weight:', { exact: true })).toBeVisible();
  });

  test('shows performance metrics', async ({ mockApiPage: page }) => {
    await page.goto('/paddles/combined/Selkirk-Epic');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Swing Weight:')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Twist Weight:')).toBeVisible();
    await expect(page.locator('text=Spin RPM:')).toBeVisible();
  });

  test('shows ratings', async ({ mockApiPage: page }) => {
    await page.goto('/paddles/combined/Selkirk-Epic');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Control:')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Feel:')).toBeVisible();
    await expect(page.locator('text=Power:')).toBeVisible();
  });

  test('shows materials & construction', async ({ mockApiPage: page }) => {
    await page.goto('/paddles/combined/Selkirk-Epic');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Materials & Construction')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Face Material:')).toBeVisible();
    await expect(page.locator('text=Core Material:')).toBeVisible();
    await expect(page.locator('text=Surface Texture:')).toBeVisible();
  });

  test('shows back button and navigates back', async ({ mockApiPage: page }) => {
    await page.goto('/paddles/combined/Selkirk-Epic');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Back to Paddles")')).toBeVisible({ timeout: 10000 });
  });

  test('shows different paddle data', async ({ mockApiPage: page }) => {
    await page.goto('/paddles/combined/JOOLA-Hyperion');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=JOOLA Hyperion').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Elongated')).toBeVisible();
    await expect(page.locator('text=Swing Weight:')).toBeVisible();
  });
});
