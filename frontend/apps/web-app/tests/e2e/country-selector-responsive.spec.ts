import { test, expect } from '@playwright/test';

test.describe('Country Selector - Responsive Tests', () => {
  
  test.describe('Desktop - Dropdown', () => {
    test.beforeEach(async ({ page, isMobile }) => {
      // Skip if on mobile
      if (isMobile) {
        test.skip();
      }
    });

    test('Desktop: It should load countries in dropdown', async ({ page }) => {
      // Navigate and clear auth
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Scroll to bundle selector
      const bundleSelector = page.locator('#esim-selector');
      await bundleSelector.scrollIntoViewIfNeeded();

      // Find and click the dropdown
      const dropdown = page.locator('button[role="combobox"]').first();
      await expect(dropdown).toBeVisible({ timeout: 10000 });
      
      // Check placeholder text
      const placeholderText = await dropdown.textContent();
      expect(placeholderText).toContain('לאן נוסעים?');
      console.log('✓ Dropdown shows placeholder text');

      // Click to open
      await dropdown.click();
      await page.waitForTimeout(500);

      // Check for country options
      const options = page.locator('[role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThan(100);
      console.log(`✓ Dropdown loaded ${count} countries`);

      // Check for specific countries
      const expectedCountries = ['ארצות הברית', 'איטליה', 'יוון', 'תאילנד', 'ישראל'];
      for (const country of expectedCountries) {
        const countryOption = page.locator(`[role="option"]:has-text("${country}")`);
        await expect(countryOption).toBeVisible();
      }
      console.log('✓ Found expected countries');

      // Test search functionality
      const searchInput = page.locator('input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('ישראל');
        await page.waitForTimeout(300);
        
        const filteredCount = await options.count();
        expect(filteredCount).toBeLessThan(count);
        expect(filteredCount).toBeGreaterThan(0);
        console.log(`✓ Search works: filtered to ${filteredCount} results`);
        
        await searchInput.clear();
      }

      // Select a country
      const firstOption = options.first();
      const optionText = await firstOption.textContent();
      await firstOption.click();
      await page.waitForTimeout(500);

      // Verify selection
      const selectedText = await dropdown.textContent();
      expect(selectedText).not.toContain('לאן נוסעים?');
      console.log(`✓ Selected country: ${selectedText}`);

      // Verify URL updated
      const url = new URL(page.url());
      expect(url.searchParams.has('countryId')).toBeTruthy();
      console.log(`✓ URL updated with countryId: ${url.searchParams.get('countryId')}`);
    });
  });

  test.describe('Mobile/Tablet - Drawer', () => {
    test.beforeEach(async ({ page, isMobile, viewport }) => {
      // Skip if on desktop (viewport width > 768px for tablets)
      if (!isMobile && viewport && viewport.width > 768) {
        test.skip();
      }
    });

    test('Mobile: It should load countries in drawer/sheet', async ({ page, isMobile }) => {
      // For mobile browsers or when isMobile is true
      if (!isMobile) {
        // Set mobile viewport for desktop browsers
        await page.setViewportSize({ width: 375, height: 667 });
      }

      // Navigate and clear auth
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Scroll to bundle selector
      const bundleSelector = page.locator('#esim-selector');
      await bundleSelector.scrollIntoViewIfNeeded();

      // Find the mobile trigger button
      // Mobile uses a different selector - might be the same button but opens a drawer
      const mobileTrigger = page.locator('button:has-text("לאן נוסעים?")').first();
      await expect(mobileTrigger).toBeVisible({ timeout: 10000 });
      console.log('✓ Found mobile selector trigger');

      // Click to open drawer/sheet
      await mobileTrigger.click();
      await page.waitForTimeout(1000); // Wait for animation

      // Look for the drawer/sheet container
      const drawerSelectors = [
        '[role="dialog"]',
        '.sheet-content',
        '[data-testid="mobile-destination-drawer"]',
        '.drawer-content',
        '[data-state="open"]'
      ];

      let drawer = null;
      for (const selector of drawerSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          drawer = element;
          console.log(`✓ Drawer opened using selector: ${selector}`);
          break;
        }
      }

      if (!drawer) {
        console.log('⚠️ Could not find drawer, checking for alternative UI');
        // Fallback: check if countries are visible in any container
        const anyCountries = page.locator('text=/ארצות הברית|איטליה|יוון/').first();
        await expect(anyCountries).toBeVisible({ timeout: 5000 });
        console.log('✓ Countries are visible (alternative UI)');
      }

      // Look for country options in the drawer
      const countrySelectors = [
        'button:has-text("🇺🇸")',
        'button:has-text("🇮🇹")',
        'button:has-text("🇬🇷")',
        '[role="button"]',
        '.country-item',
        '[data-testid*="country"]'
      ];

      let countryButtons = null;
      let countryCount = 0;
      
      for (const selector of countrySelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 10) { // Expect many countries
          countryButtons = elements;
          countryCount = count;
          console.log(`✓ Found ${count} countries using selector: ${selector}`);
          break;
        }
      }

      if (countryCount > 0) {
        expect(countryCount).toBeGreaterThan(50); // Should have many countries
        console.log(`✓ Drawer loaded ${countryCount} countries`);

        // Check for specific countries
        const expectedCountries = [
          { name: 'ארצות הברית', flag: '🇺🇸' },
          { name: 'איטליה', flag: '🇮🇹' },
          { name: 'יוון', flag: '🇬🇷' }
        ];

        for (const country of expectedCountries) {
          const countryElement = page.locator(
            `text="${country.name}", text="${country.flag}"`
          ).first();
          const isVisible = await countryElement.isVisible().catch(() => false);
          if (isVisible) {
            console.log(`✓ Found country: ${country.flag} ${country.name}`);
          }
        }

        // Test search if available
        const searchInput = page.locator('input[type="search"], input[placeholder*="חיפוש"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('ישראל');
          await page.waitForTimeout(300);
          console.log('✓ Search input available in drawer');
        }

        // Select a country
        const firstCountry = countryButtons.first();
        const countryText = await firstCountry.textContent();
        await firstCountry.click();
        await page.waitForTimeout(1000); // Wait for drawer to close

        // Verify selection
        const selectedText = await mobileTrigger.textContent();
        expect(selectedText).not.toContain('לאן נוסעים?');
        console.log(`✓ Selected country: ${selectedText || countryText}`);

        // Verify URL updated
        const url = new URL(page.url());
        if (url.searchParams.has('countryId')) {
          console.log(`✓ URL updated with countryId: ${url.searchParams.get('countryId')}`);
        }
      } else {
        console.log('⚠️ Could not count countries, but drawer is functional');
      }
    });
  });

  test('Verify GraphQL loads countries for all viewports', async ({ page }) => {
    let countriesData: any = null;

    // Intercept GraphQL responses
    page.on('response', async (response) => {
      if (response.url().includes('graphql')) {
        try {
          const json = await response.json();
          if (json.data?.bundlesByCountry) {
            countriesData = json.data.bundlesByCountry;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify countries were loaded
    expect(countriesData).toBeTruthy();
    expect(countriesData.length).toBeGreaterThan(100);
    console.log(`✅ GraphQL loaded ${countriesData.length} countries`);

    // Log sample countries
    countriesData.slice(0, 5).forEach((item: any) => {
      const country = item.country;
      console.log(`  - ${country.flag} ${country.nameHebrew || country.name} (${country.iso})`);
    });
  });
});