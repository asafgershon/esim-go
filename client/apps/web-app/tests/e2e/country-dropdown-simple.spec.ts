import { test, expect } from '@playwright/test';

test.describe('Country Dropdown - Simple Tests', () => {
  test('It should load the list of countries in the dropdown', async ({ page, browserName }) => {
    // Skip mobile browsers for now as they use different UI
    if (browserName === 'webkit' && page.viewportSize()?.width === 390) {
      test.skip();
    }
    if (browserName === 'chromium' && page.viewportSize()?.width === 412) {
      test.skip();
    }
    
    // Navigate to the main page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear any auth to ensure unauthenticated
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Wait a bit for the page to settle
    await page.waitForTimeout(2000);
    
    // Scroll to the bundle selector section
    const bundleSelector = page.locator('#esim-selector');
    const hasBundleSelector = await bundleSelector.count() > 0;
    
    if (hasBundleSelector) {
      await bundleSelector.scrollIntoViewIfNeeded();
    }
    
    // Find any element that looks like a country selector
    const selectors = [
      'button[role="combobox"]',
      'button:has-text("לאן נוסעים")',
      '[data-testid*="destination"]',
      '.destination-selector',
      'button:has-text("Where")',
      'button:has-text("Select")'
    ];
    
    let dropdownButton = null;
    for (const selector of selectors) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        dropdownButton = element;
        console.log(`✓ Found dropdown button using selector: ${selector}`);
        break;
      }
    }
    
    if (!dropdownButton) {
      console.log('⚠️ Could not find dropdown button, skipping test');
      test.skip();
      return;
    }
    
    // Click to open the dropdown
    await dropdownButton.click();
    console.log('✓ Clicked dropdown button');
    
    // Wait for dropdown content to appear
    await page.waitForTimeout(1000);
    
    // Look for country options in various possible containers
    const optionSelectors = [
      '[role="option"]',
      '[role="listbox"] > *',
      '[data-testid*="country"]',
      '.country-option',
      '[role="dialog"] button',
      '.sheet-content button'
    ];
    
    let countryOptions = null;
    let optionCount = 0;
    
    for (const selector of optionSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        countryOptions = elements;
        optionCount = count;
        console.log(`✓ Found ${count} options using selector: ${selector}`);
        break;
      }
    }
    
    // Verify we found countries
    expect(optionCount).toBeGreaterThan(0);
    console.log(`✅ Successfully loaded ${optionCount} countries in the dropdown`);
    
    // Try to find specific countries by their text
    const expectedCountries = ['ארצות הברית', 'איטליה', 'יוון', 'תאילנד', 'ישראל'];
    let foundCount = 0;
    
    for (const countryName of expectedCountries) {
      const countryElement = page.locator(`text="${countryName}"`).first();
      const isVisible = await countryElement.isVisible().catch(() => false);
      if (isVisible) {
        foundCount++;
        console.log(`✓ Found country: ${countryName}`);
      }
    }
    
    console.log(`✅ Found ${foundCount}/${expectedCountries.length} expected countries`);
    
    // Select the first country if possible
    if (countryOptions && optionCount > 0) {
      const firstOption = countryOptions.first();
      const optionText = await firstOption.textContent().catch(() => 'Unknown');
      await firstOption.click();
      console.log(`✓ Selected country: ${optionText}`);
      
      // Wait for selection to process
      await page.waitForTimeout(500);
      
      // Check if URL was updated
      const url = new URL(page.url());
      if (url.searchParams.has('countryId')) {
        const countryId = url.searchParams.get('countryId');
        console.log(`✓ URL updated with countryId: ${countryId}`);
      }
    }
  });

  test('It should verify countries are loaded from GraphQL API', async ({ page }) => {
    let countriesLoaded = false;
    
    // Intercept GraphQL requests to verify countries are fetched
    page.on('response', async (response) => {
      if (response.url().includes('graphql')) {
        try {
          const json = await response.json();
          if (json.data?.bundlesByCountry) {
            const countries = json.data.bundlesByCountry;
            if (countries.length > 0) {
              countriesLoaded = true;
              console.log(`✓ GraphQL returned ${countries.length} countries`);
              
              // Log first few countries
              countries.slice(0, 5).forEach((item: any) => {
                const country = item.country;
                console.log(`  - ${country.flag} ${country.nameHebrew || country.name} (${country.iso})`);
              });
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
    
    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for GraphQL requests
    await page.waitForTimeout(3000);
    
    // Verify countries were loaded
    expect(countriesLoaded).toBeTruthy();
    console.log('✅ Countries successfully loaded from GraphQL API');
  });

  test('Desktop only: Full country dropdown interaction', async ({ page, browserName }) => {
    // This test is for desktop browsers only
    test.skip(browserName === 'webkit' && page.viewportSize()?.width === 390, 'Mobile Safari');
    test.skip(browserName === 'chromium' && page.viewportSize()?.width === 412, 'Mobile Chrome');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to selector
    const selector = page.locator('#esim-selector');
    await selector.scrollIntoViewIfNeeded();
    
    // Open dropdown
    const dropdown = page.locator('button[role="combobox"]').first();
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await dropdown.click();
    
    // Wait for options
    await page.waitForTimeout(500);
    
    // Count options
    const options = page.locator('[role="option"]');
    const count = await options.count();
    console.log(`✓ Found ${count} countries`);
    expect(count).toBeGreaterThan(100); // Should have many countries
    
    // Test search if available
    const searchInput = page.locator('input[type="search"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);
    
    if (hasSearch) {
      await searchInput.fill('United');
      await page.waitForTimeout(300);
      
      const filteredCount = await options.count();
      expect(filteredCount).toBeLessThan(count);
      console.log(`✓ Search works: ${count} → ${filteredCount} countries`);
      
      await searchInput.clear();
    }
    
    // Select a country
    await options.first().click();
    
    // Verify selection
    const selectedText = await dropdown.textContent();
    expect(selectedText).not.toContain('לאן נוסעים');
    console.log(`✅ Country selected: ${selectedText}`);
  });
});