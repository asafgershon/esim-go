import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('It should load', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check that the page has loaded by verifying the title or a key element
    await expect(page).toHaveTitle(/eSIM/i);
    
    // Verify that the main content is visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Verify that there are no console errors
    let consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Give the page a moment to fully render
    await page.waitForTimeout(1000);
    
    // Assert no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
});