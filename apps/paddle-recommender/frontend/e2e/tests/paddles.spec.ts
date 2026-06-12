import { test, expect } from '../fixtures';

test.describe('Paddles List Page', () => {
  test('shows loading state then renders paddles', async ({ mockApiPage: page }) => {
    await page.goto('/paddles');

    await expect(page.locator('text=Selkirk')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=JOOLA')).toBeVisible();
    await expect(page.locator('text=CRBN')).toBeVisible();
    await expect(page.locator('text=Six Zero')).toBeVisible();
  });

  test('displays paddle count information', async ({ mockApiPage: page }) => {
    await page.goto('/paddles');

    await expect(page.locator('text=4 Paddles').or(page.locator('text=4 paddles'))).toBeVisible({ timeout: 10000 });
  });

  test('brand filter shows available brands', async ({ mockApiPage: page }) => {
    await page.goto('/paddles');

    await expect(page.locator('text=Selkirk').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=JOOLA').first()).toBeVisible();
    await expect(page.locator('text=Six Zero').first()).toBeVisible();
  });

  test('search filters paddles', async ({ mockApiPage: page }) => {
    await page.goto('/paddles');

    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill('Selkirk');
    await expect(page.locator('text=Selkirk')).toBeVisible();
  });

  test('navigates to paddle detail on click', async ({ mockApiPage: page }) => {
    await page.goto('/paddles');

    const moreDetailsBtn = page.locator('button:has-text("More Details")').first();
    await expect(moreDetailsBtn).toBeVisible({ timeout: 10000 });
    await moreDetailsBtn.click();

    await expect(page).toHaveURL(/\/paddles\/combined\//);
  });
});
