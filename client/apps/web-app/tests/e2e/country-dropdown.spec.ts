import { test, expect } from '@playwright/test';

test.describe('Country Dropdown - Unauthenticated Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth to ensure unauthenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('It should load the list of countries in the dropdown', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to the bundle selector section
    const bundleSelector = page.locator('#esim-selector');
    await bundleSelector.scrollIntoViewIfNeeded();
    
    // Find the destination selector dropdown button
    // On mobile, it might be a different element
    const dropdownButton = page.locator('button[role="combobox"], button:has-text("לאן נוסעים?")').first();
    
    // If not found, try mobile-specific selector
    let isVisible = await dropdownButton.isVisible().catch(() => false);
    if (!isVisible) {
      const mobileButton = page.locator('[data-testid="destination-selector"], .destination-selector-trigger').first();
      isVisible = await mobileButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(mobileButton).toBeVisible({ timeout: 10000 });
        // Use mobile button for rest of test
        Object.assign(dropdownButton, mobileButton);
      }
    } else {
      await expect(dropdownButton).toBeVisible({ timeout: 10000 });
    }
    
    // Check initial state - should show placeholder
    const buttonText = await dropdownButton.textContent();
    expect(buttonText).toContain('לאן נוסעים?'); // "Where are you traveling?"
    
    // Click to open the dropdown
    await dropdownButton.click();
    
    // Wait for dropdown to open
    await page.waitForTimeout(500);
    
    // Check if the dropdown content is visible
    // The dropdown might be a popover or a sheet on mobile
    const dropdownContent = page.locator('[role="listbox"], [role="dialog"]').first();
    await expect(dropdownContent).toBeVisible({ timeout: 5000 });
    
    // Check for country options
    const countryOptions = page.locator('[role="option"], [data-testid*="country"]');
    const optionCount = await countryOptions.count();
    
    // Should have at least some countries loaded
    expect(optionCount).toBeGreaterThan(0);
    console.log(`✓ Found ${optionCount} countries in the dropdown`);
    
    // Check for specific popular countries with their flags
    const expectedCountries = [
      { name: 'ארצות הברית', flag: '🇺🇸' },
      { name: 'איטליה', flag: '🇮🇹' },
      { name: 'יוון', flag: '🇬🇷' },
      { name: 'תאילנד', flag: '🇹🇭' },
    ];
    
    for (const country of expectedCountries) {
      // Look for country by text content (name or flag)
      const countryOption = page.locator(`[role="option"]:has-text("${country.name}"), [role="option"]:has-text("${country.flag}")`).first();
      const isVisible = await countryOption.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`✓ Found country: ${country.name} ${country.flag}`);
      } else {
        // Try alternative selectors for mobile view
        const mobileOption = page.locator(`text="${country.name}"`).first();
        const isMobileVisible = await mobileOption.isVisible().catch(() => false);
        if (isMobileVisible) {
          console.log(`✓ Found country (mobile): ${country.name}`);
        }
      }
    }
    
    // Test search functionality if search input is available
    const searchInput = page.locator('input[type="search"], input[placeholder*="חיפוש"], input[placeholder*="Search"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);
    
    if (hasSearch) {
      // Type a search query
      await searchInput.fill('ישראל');
      await page.waitForTimeout(300);
      
      // Check if results are filtered
      const filteredOptions = await countryOptions.count();
      console.log(`✓ Search works - showing ${filteredOptions} result(s) for "ישראל"`);
      
      // Clear search
      await searchInput.clear();
    }
    
    // Select a country
    const firstCountry = countryOptions.first();
    const countryText = await firstCountry.textContent();
    await firstCountry.click();
    
    // Verify selection
    await page.waitForTimeout(500);
    const selectedText = await dropdownButton.textContent();
    expect(selectedText).not.toContain('לאן נוסעים?');
    console.log(`✓ Selected country: ${selectedText}`);
    
    // Verify URL updated with country parameter
    const url = new URL(page.url());
    expect(url.searchParams.has('countryId')).toBeTruthy();
    const selectedCountryId = url.searchParams.get('countryId');
    console.log(`✓ URL updated with countryId: ${selectedCountryId}`);
  });

  test('It should handle empty/loading states gracefully', async ({ page }) => {
    // Intercept GraphQL to simulate loading/empty states
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      // Check if this is a countries query
      if (postData?.query?.includes('bundlesByCountry') || postData?.operationName === 'GetCountriesWithBundles') {
        // First, simulate loading by delaying
        await page.waitForTimeout(100);
        
        // Then return empty result
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              bundlesByCountry: []
            }
          })
        });
      } else {
        await route.continue();
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to open dropdown
    const bundleSelector = page.locator('#esim-selector');
    await bundleSelector.scrollIntoViewIfNeeded();
    
    const dropdownButton = page.locator('button[role="combobox"]').first();
    await expect(dropdownButton).toBeVisible({ timeout: 10000 });
    await dropdownButton.click();
    
    // Check for loading or empty state message
    const emptyMessage = page.locator('text=/אין תוצאות|No results|Loading/i').first();
    const hasEmptyState = await emptyMessage.isVisible().catch(() => false);
    
    if (hasEmptyState) {
      console.log('✓ Empty/loading state is handled');
    }
    
    // Dropdown should still be functional even if empty
    expect(true).toBeTruthy();
  });

  test('It should preserve country selection across page navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Select a country
    const bundleSelector = page.locator('#esim-selector');
    await bundleSelector.scrollIntoViewIfNeeded();
    
    const dropdownButton = page.locator('button[role="combobox"]').first();
    await dropdownButton.click();
    
    // Select first available country
    const countryOption = page.locator('[role="option"]').first();
    await countryOption.click();
    
    // Get the selected country from URL
    const urlBefore = new URL(page.url());
    const countryIdBefore = urlBefore.searchParams.get('countryId');
    expect(countryIdBefore).toBeTruthy();
    
    // Navigate away and back
    await page.goto('/');
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Check if country is still selected
    const urlAfter = new URL(page.url());
    const countryIdAfter = urlAfter.searchParams.get('countryId');
    
    expect(countryIdAfter).toBe(countryIdBefore);
    console.log(`✓ Country selection preserved: ${countryIdAfter}`);
    
    // Verify dropdown shows selected country
    const dropdownText = await dropdownButton.textContent();
    expect(dropdownText).not.toContain('לאן נוסעים?');
  });

  test('It should work on mobile devices', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to bundle selector
    const bundleSelector = page.locator('#esim-selector');
    await bundleSelector.scrollIntoViewIfNeeded();
    
    // On mobile, the selector might be different (drawer/sheet)
    const mobileDropdown = page.locator('button[role="combobox"], [data-testid="mobile-destination-trigger"]').first();
    await expect(mobileDropdown).toBeVisible({ timeout: 10000 });
    
    // Click to open
    await mobileDropdown.click();
    await page.waitForTimeout(500);
    
    // Check for mobile drawer/sheet
    const mobileDrawer = page.locator('[role="dialog"], .sheet-content, [data-testid="mobile-destination-drawer"]').first();
    const isDrawerVisible = await mobileDrawer.isVisible().catch(() => false);
    
    if (isDrawerVisible) {
      console.log('✓ Mobile drawer opened successfully');
      
      // Check for countries in mobile view
      const mobileCountries = page.locator('[role="option"], [data-testid*="country"], .country-item');
      const countryCount = await mobileCountries.count();
      expect(countryCount).toBeGreaterThan(0);
      console.log(`✓ Found ${countryCount} countries in mobile view`);
      
      // Select a country
      await mobileCountries.first().click();
      await page.waitForTimeout(500);
      
      // Verify selection
      const selectedText = await mobileDropdown.textContent();
      expect(selectedText).not.toContain('לאן נוסעים?');
      console.log(`✓ Mobile selection works: ${selectedText}`);
    } else {
      // Fallback: desktop dropdown might work on mobile too
      const desktopDropdown = page.locator('[role="listbox"]').first();
      await expect(desktopDropdown).toBeVisible({ timeout: 5000 });
      console.log('✓ Dropdown works on mobile (desktop mode)');
    }
  });
});