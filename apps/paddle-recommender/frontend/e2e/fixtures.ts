import { test as base, expect, type Page } from '@playwright/test';
import { setupApiMocks } from './mocks/api-handlers';

export { expect };

type Fixtures = {
  mockApiPage: Page;
};

export const test = base.extend<Fixtures>({
  mockApiPage: async ({ page }, use) => {
    await setupApiMocks(page);
    await use(page);
  },
});
