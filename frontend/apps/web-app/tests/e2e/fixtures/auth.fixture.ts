import { test as base, Page } from '@playwright/test';
import { AuthHelpers } from '../helpers/auth-helpers';

/**
 * Custom test fixture that provides authentication capabilities
 */
export type AuthFixtures = {
  authHelpers: AuthHelpers;
  authenticatedPage: Page;
  testUser: TestUser;
};

export type TestUser = {
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Provides authentication helper methods
   */
  authHelpers: async ({ page }, use) => {
    const helpers = new AuthHelpers(page);
    await use(helpers);
  },

  /**
   * Provides a pre-authenticated page for tests that require login
   */
  authenticatedPage: async ({ page, authHelpers }, use) => {
    // Get test credentials from environment or use defaults
    const phoneNumber = process.env.TEST_PHONE_NUMBER || '+972501234567';
    
    // Perform login before test
    await page.goto('/login');
    await authHelpers.loginWithPhone(phoneNumber);
    
    // Verify authentication succeeded
    await page.waitForURL('/profile', { timeout: 30000 });
    
    // Use the authenticated page in test
    await use(page);
    
    // Cleanup after test
    await authHelpers.logout();
  },

  /**
   * Provides test user data
   */
  testUser: async ({}, use) => {
    const user: TestUser = {
      phoneNumber: process.env.TEST_PHONE_NUMBER || '+972501234567',
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };
    await use(user);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper to save authentication state for reuse
 */
export async function saveAuthState(page: Page, path: string = 'auth.json') {
  // Wait for authentication to complete
  await page.waitForURL('/profile', { timeout: 30000 });
  
  // Save storage state (includes localStorage and cookies)
  await page.context().storageState({ path });
}

/**
 * Helper to load authentication state
 */
export async function loadAuthState(page: Page, path: string = 'auth.json') {
  // This is typically done at browser context creation
  // but can be used to restore state mid-test if needed
  const storageState = await page.context().storageState();
  
  // Apply auth token from storage state if available
  if (storageState.origins.length > 0) {
    const origin = storageState.origins.find(o => o.origin === page.url());
    if (origin?.localStorage) {
      for (const item of origin.localStorage) {
        await page.evaluate(([key, value]) => {
          localStorage.setItem(key, value);
        }, [item.name, item.value]);
      }
    }
  }
}