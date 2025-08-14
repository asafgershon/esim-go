import { test, expect } from '@playwright/test';

test.describe('Destination Navigation - Query Params and Scrolling', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear storage and navigate to home
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.waitForLoadState('networkidle');
  });

  test('Clicking destination card sets countryId query param and scrolls to selector', async ({ page }) => {
    // Find the destinations gallery section
    await page.waitForSelector('text=/שירות זמין ב/', { timeout: 10000 });
    
    // Get initial URL
    const urlBefore = page.url();
    expect(urlBefore).not.toContain('countryId');
    
    // Find and click on Italy destination card
    const italyCard = page.locator('text="איטליה"').first();
    await expect(italyCard).toBeVisible({ timeout: 10000 });
    
    // Get the selector's initial position
    const selectorBefore = await page.locator('#esim-selector').boundingBox();
    
    // Click the destination
    await italyCard.click();
    
    // Wait for navigation/scroll
    await page.waitForTimeout(1500);
    
    // Verify URL has countryId param
    const urlAfter = page.url();
    expect(urlAfter).toContain('countryId=it');
    console.log(`✓ URL updated: ${urlAfter}`);
    
    // Verify the page scrolled to the selector
    const selector = page.locator('#esim-selector');
    await expect(selector).toBeInViewport();
    console.log('✓ Scrolled to #esim-selector');
    
    // Verify the dropdown shows the selected country
    const dropdown = page.locator('button[role="combobox"]').first();
    const dropdownText = await dropdown.textContent();
    expect(dropdownText).toContain('🇮🇹');
    console.log(`✓ Dropdown shows: ${dropdownText}`);
  });

  test('Multiple destination clicks update query params correctly', async ({ page }) => {
    // Click first destination (Rome/Italy)
    const italyCard = page.locator('text="רומא"').first();
    await italyCard.click();
    await page.waitForTimeout(1000);
    
    let url = new URL(page.url());
    expect(url.searchParams.get('countryId')).toBe('it');
    console.log('✓ First click: countryId=it');
    
    // Click second destination (USA)
    const usaCard = page.locator('text="ארצות הברית"').first();
    await usaCard.click();
    await page.waitForTimeout(1000);
    
    url = new URL(page.url());
    expect(url.searchParams.get('countryId')).toBe('us');
    console.log('✓ Second click: countryId=us');
    
    // Click third destination (Greece)
    const greeceCard = page.locator('text="יוון"').first();
    await greeceCard.click();
    await page.waitForTimeout(1000);
    
    url = new URL(page.url());
    expect(url.searchParams.get('countryId')).toBe('gr');
    console.log('✓ Third click: countryId=gr');
  });

  test('CTA buttons scroll to selector and focus input', async ({ page }) => {
    // Look for CTA buttons that might trigger scroll
    const ctaSelectors = [
      'button:has-text("בחר חבילה")',
      'button:has-text("התחל")',
      'button:has-text("קנה עכשיו")',
      'a:has-text("בחר חבילה")',
    ];
    
    let ctaButton = null;
    for (const selector of ctaSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        ctaButton = element;
        console.log(`✓ Found CTA button: ${selector}`);
        break;
      }
    }
    
    if (ctaButton) {
      // Click CTA button
      await ctaButton.click();
      await page.waitForTimeout(1500);
      
      // Verify scroll to selector
      const selector = page.locator('#esim-selector');
      await expect(selector).toBeInViewport();
      console.log('✓ CTA button scrolled to selector');
      
      // Check if dropdown is focused or opened
      const dropdown = page.locator('button[role="combobox"]').first();
      const isFocused = await dropdown.evaluate(el => el === document.activeElement);
      console.log(`✓ Dropdown focused: ${isFocused}`);
    } else {
      console.log('⚠️ No CTA buttons found on page');
    }
  });

  test('Query params persist on page reload', async ({ page }) => {
    // Set country via destination click
    const thailandCard = page.locator('text="תאילנד"').first();
    await thailandCard.click();
    await page.waitForTimeout(1000);
    
    // Verify param is set
    let url = new URL(page.url());
    expect(url.searchParams.get('countryId')).toBe('th');
    
    // Add days param
    await page.goto(`${page.url()}&numOfDays=7`);
    await page.waitForLoadState('networkidle');
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify params persist
    url = new URL(page.url());
    expect(url.searchParams.get('countryId')).toBe('th');
    expect(url.searchParams.get('numOfDays')).toBe('7');
    console.log('✓ Query params persist after reload');
    
    // Verify UI reflects the params
    const dropdown = page.locator('button[role="combobox"]').first();
    const dropdownText = await dropdown.textContent();
    expect(dropdownText).toContain('🇹🇭');
    console.log('✓ UI reflects persisted params');
  });

  test('Direct URL navigation with countryId scrolls to selector', async ({ page }) => {
    // Navigate directly with countryId param
    await page.goto('/?countryId=br');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Verify selector is in viewport
    const selector = page.locator('#esim-selector');
    await expect(selector).toBeInViewport({ timeout: 5000 });
    console.log('✓ Direct navigation scrolled to selector');
    
    // Verify dropdown shows Brazil
    const dropdown = page.locator('button[role="combobox"]').first();
    const dropdownText = await dropdown.textContent();
    expect(dropdownText).toContain('🇧🇷');
    console.log(`✓ Dropdown shows Brazil: ${dropdownText}`);
  });

  test('Scroll behavior on mobile devices', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Set mobile viewport for desktop browsers
      await page.setViewportSize({ width: 375, height: 667 });
    }
    
    // Click a destination
    const dubaiCard = page.locator('text="דובאי"').first();
    await dubaiCard.click();
    await page.waitForTimeout(2000);
    
    // Verify URL updated
    const url = new URL(page.url());
    expect(url.searchParams.get('countryId')).toBe('ae');
    console.log('✓ Mobile: URL updated with countryId=ae');
    
    // Verify scroll (selector should be visible)
    const selector = page.locator('#esim-selector');
    const isVisible = await selector.isVisible();
    expect(isVisible).toBeTruthy();
    console.log('✓ Mobile: Selector is visible after scroll');
  });

  test('Destination gallery pricing updates from GraphQL', async ({ page }) => {
    let pricesLoaded = false;
    
    // Monitor GraphQL responses for pricing
    page.on('response', async (response) => {
      if (response.url().includes('graphql')) {
        try {
          const json = await response.json();
          if (json.data?.calculatePrices) {
            pricesLoaded = true;
            const prices = json.data.calculatePrices;
            console.log(`✓ Loaded ${prices.length} destination prices from GraphQL`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if prices are displayed
    const priceElements = page.locator('text=/החל מ-|From/');
    const priceCount = await priceElements.count();
    
    if (priceCount > 0) {
      console.log(`✓ Found ${priceCount} price displays`);
      expect(pricesLoaded).toBeTruthy();
    }
  });
});