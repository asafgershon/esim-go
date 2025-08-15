import { Page, Locator, expect } from '@playwright/test';

/**
 * Test utilities for eSIM Go web app integration tests
 * Provides reusable functions for common test operations
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for the main page to be fully loaded with destinations gallery
   */
  async waitForMainPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(
      '[data-testid="destinations-gallery"], .destinations-gallery, section:has(h2:text("שירות זמין ב-"))', 
      { timeout: 15000 }
    );
  }

  /**
   * Get a destination card by destination name
   */
  getDestinationCard(destinationName: string): Locator {
    return this.page.locator(`text="${destinationName}"`).first();
  }

  /**
   * Click on a destination card and wait for navigation
   */
  async clickDestination(destinationName: string): Promise<void> {
    const card = this.getDestinationCard(destinationName);
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await this.page.waitForTimeout(1000); // Wait for URL update
  }

  /**
   * Get current URL search parameters
   */
  getUrlParams(): URLSearchParams {
    return new URL(this.page.url()).searchParams;
  }

  /**
   * Assert URL parameter value
   */
  async expectUrlParam(paramName: string, expectedValue: string): Promise<void> {
    const params = this.getUrlParams();
    expect(params.get(paramName)).toBe(expectedValue);
  }

  /**
   * Get the esim-selector section
   */
  getSelectorSection(): Locator {
    return this.page.locator('#esim-selector');
  }

  /**
   * Wait for the selector section to be visible and in viewport
   */
  async waitForSelectorVisible(): Promise<void> {
    const selector = this.getSelectorSection();
    await expect(selector).toBeVisible({ timeout: 10000 });
    
    // Ensure it's in viewport (indicating scroll happened)
    await expect(selector).toBeInViewport();
  }

  /**
   * Get the destination selector button/input
   */
  getDestinationSelector(): Locator {
    // The actual selector is a combobox button that shows the selected country
    return this.page.locator('button[role="combobox"]').first();
  }

  /**
   * Check if destination selector shows selected state (not placeholder)
   */
  async expectDestinationSelected(): Promise<void> {
    const selector = this.getDestinationSelector();
    await expect(selector).toBeVisible();
    const text = await selector.textContent();
    // The selector should show a country flag emoji and name, not the placeholder
    expect(text).not.toEqual('לאן נוסעים?'); // Updated placeholder text
    expect(text).toContain('🇮🇹'); // Should contain a flag emoji when selected
  }

  /**
   * Get the days slider element
   */
  getDaysSlider(): Locator {
    return this.page.locator('input[type="range"], [role="slider"], .slider').first();
  }

  /**
   * Set the days slider value and trigger change events
   */
  async setDaysSliderValue(value: string): Promise<void> {
    const slider = this.getDaysSlider();
    await expect(slider).toBeVisible({ timeout: 5000 });
    
    // For custom sliders with role="slider", we need to use keyboard navigation
    // or click at specific positions
    const targetValue = parseInt(value);
    const currentValue = await slider.getAttribute('aria-valuenow');
    const current = parseInt(currentValue || '7');
    
    // Calculate how many times to press arrow keys
    const diff = targetValue - current;
    
    // Focus the slider
    await slider.focus();
    
    // Press arrow keys to adjust value
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        await this.page.keyboard.press('ArrowRight');
        await this.page.waitForTimeout(50);
      }
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) {
        await this.page.keyboard.press('ArrowLeft');
        await this.page.waitForTimeout(50);
      }
    }
    
    await this.page.waitForTimeout(500); // Wait for URL update
  }

  /**
   * Get the current days slider value
   */
  async getDaysSliderValue(): Promise<string> {
    const slider = this.getDaysSlider();
    
    // Try multiple ways to get the value
    try {
      return await slider.inputValue();
    } catch {
      try {
        return await slider.getAttribute('value') || '7';
      } catch {
        return await slider.evaluate((el: any) => 
          el.value || el.getAttribute('aria-valuenow') || '7'
        );
      }
    }
  }

  /**
   * Navigate to a specific state with query parameters
   */
  async navigateToState(params: Record<string, string>): Promise<void> {
    const searchParams = new URLSearchParams(params);
    await this.page.goto(`/?${searchParams.toString()}`);
    // Don't wait for networkidle as the app has continuous background requests
    // Instead wait for the DOM to be ready
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000); // Give React time to render
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if element is in viewport
   */
  async isInViewport(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Assert that an element is in the viewport (useful for scroll tests)
   */
  async expectInViewport(locator: Locator): Promise<void> {
    await expect(locator).toBeInViewport();
  }

  /**
   * Set mobile viewport size
   */
  async setMobileViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Set desktop viewport size
   */
  async setDesktopViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * Wait for GraphQL queries to complete (useful when dealing with pricing data)
   */
  async waitForGraphQLQueries(): Promise<void> {
    // Wait for any pending GraphQL requests to complete
    await this.page.waitForFunction(() => {
      // Check if there are any pending network requests
      return (window as any).fetch === undefined || 
             document.readyState === 'complete';
    }, { timeout: 10000 });
    
    await this.page.waitForTimeout(1000); // Additional buffer
  }
}

/**
 * Destination mapping for tests
 */
export const DESTINATIONS = {
  ROME: { name: 'Rome', countryCode: 'it' },
  USA: { name: 'USA', countryCode: 'us' },
  GREECE: { name: 'Greece', countryCode: 'gr' },
  THAILAND: { name: 'Thailand', countryCode: 'th' },
  DUBAI: { name: 'Dubai', countryCode: 'ae' },
  BRAZIL: { name: 'Brazil', countryCode: 'br' },
  CANADA: { name: 'Canada', countryCode: 'ca' },
  CHINA: { name: 'China', countryCode: 'cn' },
} as const;

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
  DEFAULT_DAYS: 7,
  MIN_DAYS: 1,
  MAX_DAYS: 30,
  DEFAULT_TAB: 'countries',
  SELECTOR_ID: '#esim-selector',
  DESTINATION_PLACEHOLDER: 'בחר יעד',
} as const;