import { test, expect } from '../fixtures';

test.describe('Onboarding Page', () => {
  test('shows QuickStart profiles screen first', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.locator('text=Quick Start').or(page.locator('text=Get Started'))).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Skip - Answer Manually')).toBeVisible();
  });

  test('renders the onboarding wizard after skipping QuickStart', async ({ page }) => {
    await page.goto('/onboarding');

    await page.locator('text=Skip - Answer Manually').click();
    await expect(page.getByRole('heading', { name: /skill level/i })).toBeVisible({ timeout: 10000 });
  });

  test('shows progress indicator after QuickStart', async ({ page }) => {
    await page.goto('/onboarding');

    await page.locator('text=Skip - Answer Manually').click();
    await expect(page.locator('[data-slot="progress"]')).toBeVisible({ timeout: 10000 });
  });

  test('has Next button after QuickStart', async ({ page }) => {
    await page.goto('/onboarding');

    await page.locator('text=Skip - Answer Manually').click();
    await expect(page.locator('button:has-text("Next")').first()).toBeVisible({ timeout: 10000 });
  });
});
