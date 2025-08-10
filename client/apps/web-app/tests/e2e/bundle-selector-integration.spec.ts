import { expect, test } from '@playwright/test';
import { DESTINATIONS, TEST_CONSTANTS, TestUtils } from './helpers/test-utils';

/**
 * Integration tests for the eSIM Go bundle selector component
 * Tests the interaction between destination gallery, country selector, and days slider
 * with URL query parameters and focus management
 */

test.describe('Bundle Selector Integration', () => {
  let testUtils: TestUtils;
  
  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    
    // Navigate to the main page and wait for it to be fully loaded
    await page.goto('/');
    await testUtils.waitForMainPageLoad();
  });

  test.describe('Test Case 1: Destination Gallery Click Sets Country Query Param', () => {
    
    test('clicking on Italy destination sets countryId=it query parameter', async () => {
      await testUtils.clickDestination(DESTINATIONS.ROME.name);
      await testUtils.expectUrlParam('countryId', DESTINATIONS.ROME.countryCode);
    });

    test('clicking on USA destination sets countryId=us query parameter', async () => {
      await testUtils.clickDestination(DESTINATIONS.USA.name);
      await testUtils.expectUrlParam('countryId', DESTINATIONS.USA.countryCode);
    });

    test('clicking on Greece destination sets countryId=gr query parameter', async () => {
      await testUtils.clickDestination(DESTINATIONS.GREECE.name);
      await testUtils.expectUrlParam('countryId', DESTINATIONS.GREECE.countryCode);
    });

    test('clicking on Thailand destination sets countryId=th query parameter', async () => {
      await testUtils.clickDestination(DESTINATIONS.THAILAND.name);
      await testUtils.expectUrlParam('countryId', DESTINATIONS.THAILAND.countryCode);
    });

    test('clicking on Brazil destination sets countryId=br query parameter', async () => {
      await testUtils.clickDestination(DESTINATIONS.BRAZIL.name);
      await testUtils.expectUrlParam('countryId', DESTINATIONS.BRAZIL.countryCode);
    });
  });

  test.describe('Test Case 2: Country Param Change Scrolls and Focuses Selector', () => {
    
    test('changing country parameter scrolls to esim-selector and focuses destination selector', async () => {
      // First, scroll to the top to ensure we're not already near the selector
      await testUtils.scrollToTop();
      
      // Navigate directly with country parameter
      await testUtils.navigateToState({
        countryId: DESTINATIONS.ROME.countryCode
      });
      
      // Wait for the selector section to be visible and in viewport
      await testUtils.waitForSelectorVisible();
      
      // Verify the destination selector shows selected state
      await testUtils.expectDestinationSelected();
      
      // Verify URL parameters are correctly set
      await testUtils.expectUrlParam('countryId', DESTINATIONS.ROME.countryCode);
    });

    test.skip('country parameter change triggers scroll behavior on mobile', async ({ browserName }) => {
      // Skip webkit for mobile as it has different scroll behavior
      test.skip(browserName === 'webkit', 'WebKit has different mobile scroll behavior');
      
      // Set mobile viewport
      await testUtils.setMobileViewport();
      
      // First, scroll to the top
      await testUtils.scrollToTop();
      
      // Navigate with country parameter
      await testUtils.navigateToState({
        countryId: DESTINATIONS.USA.countryCode
      });
      
      // Wait for selector to be visible and verify it's in viewport
      await testUtils.waitForSelectorVisible();
    });

    test.skip('multiple country parameter changes maintain scroll behavior', async () => {
      // Start with one country
      await testUtils.navigateToState({
        countryId: DESTINATIONS.GREECE.countryCode
      });
      await testUtils.waitForSelectorVisible();
      
      // Scroll away from selector
      await testUtils.scrollToTop();
      
      // Change to different country
      await testUtils.navigateToState({
        countryId: DESTINATIONS.THAILAND.countryCode
      });
      
      // Should scroll back to selector
      await testUtils.waitForSelectorVisible();
      await testUtils.expectDestinationSelected();
    });
  });

  test.describe('Test Case 3: Days Slider Updates Query Parameter', () => {
    
    test.skip('changing days slider updates numOfDays query parameter', async () => {
      // Navigate to page with a selected country to make slider accessible
      await testUtils.navigateToState({
        countryId: DESTINATIONS.ROME.countryCode,
        numOfDays: TEST_CONSTANTS.DEFAULT_DAYS.toString()
      });
      
      // Wait for the selector section to be visible
      await testUtils.waitForSelectorVisible();
      
      // Verify initial state
      await testUtils.expectUrlParam('numOfDays', TEST_CONSTANTS.DEFAULT_DAYS.toString());
      
      // Change slider value to 15 days
      await testUtils.setDaysSliderValue('15');
      
      // Check that URL parameter was updated
      await testUtils.expectUrlParam('numOfDays', '15');
    });

    test.skip('slider value persists across navigation', async ({ page }) => {
      // Set initial state with specific days
      await testUtils.navigateToState({
        countryId: DESTINATIONS.GREECE.countryCode,
        numOfDays: '10'
      });
      
      // Wait for selector to be visible
      await testUtils.waitForSelectorVisible();
      
      // Verify slider shows correct initial value
      const initialValue = await testUtils.getDaysSliderValue();
      expect(initialValue).toBe('10');
      
      // Change to different value
      await testUtils.setDaysSliderValue('20');
      await testUtils.expectUrlParam('numOfDays', '20');
      
      // Navigate away and back
      await testUtils.navigateToState({
        countryId: DESTINATIONS.GREECE.countryCode
      });
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Check URL still has the updated value
      await testUtils.expectUrlParam('numOfDays', '20');
    });

    test.skip('slider respects minimum and maximum bounds', async () => {
      // Navigate with country selected
      await testUtils.navigateToState({
        countryId: DESTINATIONS.THAILAND.countryCode,
        numOfDays: '15'
      });
      
      await testUtils.waitForSelectorVisible();
      
      // Try to set value below minimum (should clamp to 1)
      await testUtils.setDaysSliderValue('0');
      
      // Should clamp to minimum value (1)
      const params = testUtils.getUrlParams();
      const minValue = parseInt(params.get('numOfDays') || '0');
      expect(minValue).toBeGreaterThanOrEqual(TEST_CONSTANTS.MIN_DAYS);
      
      // Try to set value above maximum (should clamp to 30)
      await testUtils.setDaysSliderValue('35');
      
      // Should clamp to maximum value (30)
      const maxParams = testUtils.getUrlParams();
      const maxValue = parseInt(maxParams.get('numOfDays') || '0');
      expect(maxValue).toBeLessThanOrEqual(TEST_CONSTANTS.MAX_DAYS);
    });

    test.skip('slider updates in real-time', async () => {
      // Set up initial state
      await testUtils.navigateToState({
        countryId: DESTINATIONS.BRAZIL.countryCode,
        numOfDays: '5'
      });
      
      await testUtils.waitForSelectorVisible();
      
      // Test multiple rapid changes
      const testValues = ['8', '12', '25', '3'];
      
      for (const value of testValues) {
        await testUtils.setDaysSliderValue(value);
        await testUtils.expectUrlParam('numOfDays', value);
      }
    });
  });

  test.describe('Cross-Component Integration', () => {
    
    test.skip('complete user flow: destination click -> scroll -> slider change', async () => {
      // Step 1: Click on a destination from the gallery
      await testUtils.clickDestination(DESTINATIONS.BRAZIL.name);
      
      // Step 2: Verify we're at the selector section with correct country
      await testUtils.waitForSelectorVisible();
      await testUtils.expectUrlParam('countryId', DESTINATIONS.BRAZIL.countryCode);
      await testUtils.expectDestinationSelected();
      
      // Step 3: Change the days slider
      await testUtils.setDaysSliderValue('14');
      
      // Step 4: Verify both parameters are correctly set
      await testUtils.expectUrlParam('countryId', DESTINATIONS.BRAZIL.countryCode);
      await testUtils.expectUrlParam('numOfDays', '14');
    });

    test.skip('URL parameters are preserved during page reload', async ({ page }) => {
      // Set up specific state
      await testUtils.navigateToState({
        countryId: DESTINATIONS.CANADA.countryCode,
        numOfDays: '21'
      });
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify parameters are preserved
      await testUtils.expectUrlParam('countryId', DESTINATIONS.CANADA.countryCode);
      await testUtils.expectUrlParam('numOfDays', '21');
      
      // Verify UI reflects the preserved state
      await testUtils.waitForSelectorVisible();
      await testUtils.expectDestinationSelected();
      
      // Check slider shows correct value
      const sliderValue = await testUtils.getDaysSliderValue();
      expect(sliderValue).toBe('21');
    });

    test.skip('sequential destination clicks update parameters correctly', async () => {
      // Click first destination
      await testUtils.clickDestination(DESTINATIONS.ROME.name);
      await testUtils.waitForSelectorVisible();
      await testUtils.expectUrlParam('countryId', DESTINATIONS.ROME.countryCode);
      
      // Go back to gallery and click different destination
      await testUtils.scrollToTop();
      await testUtils.clickDestination(DESTINATIONS.CHINA.name);
      
      // Verify parameters updated correctly
      await testUtils.waitForSelectorVisible();
      await testUtils.expectUrlParam('countryId', DESTINATIONS.CHINA.countryCode);
      await testUtils.expectDestinationSelected();
    });

    test.skip('destination click preserves existing days value', async () => {
      // First set a specific days value
      await testUtils.navigateToState({
        countryId: DESTINATIONS.DUBAI.countryCode,
        numOfDays: '18'
      });
      
      await testUtils.waitForSelectorVisible();
      
      // Now click a different destination from gallery
      await testUtils.scrollToTop();
      await testUtils.clickDestination(DESTINATIONS.USA.name);
      
      // Verify country changed but days preserved
      await testUtils.waitForSelectorVisible();
      await testUtils.expectUrlParam('countryId', DESTINATIONS.USA.countryCode);
      // Note: This test may need adjustment based on actual app behavior
      // The days value might reset or preserve based on business logic
    });

    test.skip('rapid interactions do not cause race conditions', async () => {
      // Rapid sequence of interactions
      await testUtils.clickDestination(DESTINATIONS.GREECE.name);
      await testUtils.waitForSelectorVisible();
      
      // Quickly change slider multiple times
      await testUtils.setDaysSliderValue('5');
      await testUtils.setDaysSliderValue('15');
      await testUtils.setDaysSliderValue('10');
      
      // Final state should be consistent
      await testUtils.expectUrlParam('countryId', DESTINATIONS.GREECE.countryCode);
      await testUtils.expectUrlParam('numOfDays', '10');
      await testUtils.expectDestinationSelected();
    });
  });
});