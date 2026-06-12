import { test, expect } from '../fixtures';

test.describe('Home Page', () => {
  test('renders the main heading and description', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toHaveText('Pickleball Database');
    await expect(page.locator('text=Find My Perfect Paddle')).toBeVisible();
    await expect(page.locator('text=Browse Paddles')).toBeVisible();
  });

  test('navigation links point to correct routes', async ({ page }) => {
    await page.goto('/');

    const browseLink = page.locator('a[href="/paddles"]');
    await expect(browseLink).toBeVisible();

    const onboardingLink = page.locator('a[href="/onboarding"]');
    await expect(onboardingLink).toBeVisible();
  });

  test('displays feature cards', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Comprehensive Database' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Performance Metrics' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Expert Reviews' })).toBeVisible();
  });

  test('clicking Browse Paddles navigates to paddles page', async ({ page }) => {
    await page.goto('/');

    await page.locator('a[href="/paddles"]').click();
    await expect(page).toHaveURL('/paddles');
  });

  test('clicking Find My Perfect Paddle navigates to onboarding', async ({ page }) => {
    await page.goto('/');

    await page.locator('a[href="/onboarding"]').click();
    await expect(page).toHaveURL('/onboarding');
  });
});
