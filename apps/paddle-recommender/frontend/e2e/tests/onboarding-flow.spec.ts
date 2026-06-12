import { test, expect, type Page } from '../fixtures';

async function completeStep0(page: Page) {
  await page.locator('text=Skip - Answer Manually').click();
  await page.locator('text=Intermediate').click();
  await page.locator('text=Doubles').click();
  await page.locator('text=League Play').click();
  await page.locator('button:has-text("Next")').click();
}

async function completeStep1(page: Page) {
  await page.getByRole('button', { name: /all court/i }).first().click();
  await page.getByRole('button', { name: /control.*placement/i }).click();
  await page.locator('button:has-text("Next")').click();
}

async function completeStep2(page: Page) {
  await page.locator('text=Medium').first().click();
  await page.locator('button:has-text("Next")').click();
}

async function completeStep3(page: Page) {
  await page.locator('text=More Control').click();
  await page.locator('text=No, I want stock performance').click();
  await page.locator('button:has-text("Next")').click();
}

async function completeStep4(page: Page) {
  await page.locator('text=Pop-ups').click();
  await page.locator('button:has-text("Next")').click();
}

async function completeStep5(page: Page) {
  await page.locator('text=Bangers').click();
  await page.locator('text=Dinkers').click();
  await page.locator('button:has-text("Next")').click();
}

async function completeStep6(page: Page) {
  await page.locator('button:has-text("Next")').click();
}

async function completeStep7(page: Page) {
  const selectTrigger = page.getByRole('combobox').or(page.locator('button:has-text("Select")').first());
  await selectTrigger.click();
  const option = page.getByRole('option', { name: /consistency/i });
  await option.click();
  await page.locator('button:has-text("Next"):not([disabled])').click();
}

test.describe('Onboarding Full Flow', () => {
  test('completes Step 0: Skill Level & Context', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await expect(page.getByRole('heading', { name: /play style/i })).toBeVisible();
  });

  test('completes Step 1: Play Style & Tendencies', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await completeStep1(page);
    await expect(page.getByRole('heading', { name: /physical factors/i })).toBeVisible();
  });

  test('completes Step 2: Physical Factors', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await completeStep1(page);
    await completeStep2(page);
    await expect(page.getByRole('heading', { name: /paddle feel/i })).toBeVisible();
  });

  test('completes Step 3: Paddle Feel & Customization', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page);
    await expect(page.getByRole('heading', { name: /current setup/i })).toBeVisible();
  });

  test('completes Step 4: Current Setup & Pain Points (skippable)', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page);
    await completeStep4(page);
    await expect(page.getByRole('heading', { name: /environment/i })).toBeVisible();
  });

  test('completes Step 5: Environment & Opponents', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page);
    await completeStep4(page);
    await completeStep5(page);
    await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();
  });

  test('completes Step 6: Budget & Brand Preferences (defaults work)', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page);
    await completeStep4(page);
    await completeStep5(page);
    await completeStep6(page);
    await expect(page.getByRole('heading', { name: /goals|aspirations/i })).toBeVisible();
  });

  test('completes Step 7: Aspirations / Goals', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page);
    await completeStep4(page);
    await completeStep5(page);
    await completeStep6(page);
    await completeStep7(page);
    await expect(page.locator('text=Preview & Submit')).toBeVisible();
  });

  test('shows all summary cards on preview step', async ({ page }) => {
    await page.goto('/onboarding');
    await completeStep0(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page);
    await completeStep4(page);
    await completeStep5(page);
    await completeStep6(page);
    await completeStep7(page);

    await expect(page.locator('text=Preview & Submit')).toBeVisible();
    await expect(page.locator('h3:has-text("Skill Level & Context")')).toBeVisible();
    await expect(page.locator('h3:has-text("Play Style")')).toBeVisible();
    await expect(page.locator('h3:has-text("Physical Factors")')).toBeVisible();
    await expect(page.locator('h3:has-text("Current Setup")')).toBeVisible();
    await expect(page.locator('h3:has-text("Environment")')).toBeVisible();
    await expect(page.locator('h3:has-text("Budget")')).toBeVisible();
    await expect(page.locator('h3:has-text("Goals")')).toBeVisible();
    await expect(page.locator('button:has-text("Get My Paddle")')).toBeVisible();
  });
});
