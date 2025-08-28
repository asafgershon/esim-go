import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  // Load test environment variables
  dotenv.config({ path: resolve(__dirname, '.env.test.local') });
  dotenv.config({ path: resolve(__dirname, '.env.test') });
  
  // Validate required environment variables
  const requiredEnvVars = ['TEST_PHONE_NUMBER'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && !process.env.CI) {
    console.warn(`
⚠️  Missing test environment variables: ${missingVars.join(', ')}
   
   To set up test credentials:
   1. Copy tests/e2e/.env.example to tests/e2e/.env.test.local
   2. Fill in your test credentials
   
   For CI environments, these should be set as secrets.
    `);
  }

  // Optionally, create an authenticated browser context that can be reused
  if (process.env.SETUP_AUTH === 'true') {
    console.log('Setting up authentication state...');
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Perform authentication
      await page.goto('http://localhost:3000/login');
      
      // Wait for login form
      await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
      
      // Fill in test credentials
      const phoneNumber = process.env.TEST_PHONE_NUMBER || '+972559899925';
      await page.fill('input[type="tel"]', phoneNumber);
      await page.click('button:has-text("שלח קוד אימות")');
      
      // Wait for OTP
      await page.waitForSelector('input[inputmode="numeric"], input[type="text"]', { timeout: 10000 });
      
      // Fill test OTP
      const testOTP = process.env.TEST_OTP || '123456';
      const otpInputs = page.locator('input[inputmode="numeric"]');
      const inputCount = await otpInputs.count();
      
      if (inputCount > 1) {
        for (let i = 0; i < testOTP.length && i < inputCount; i++) {
          await otpInputs.nth(i).fill(testOTP[i]);
        }
      } else {
        await page.locator('input').first().fill(testOTP);
      }
      
      // Wait for authentication
      await page.waitForURL(/\/(profile|$)/, { timeout: 30000 });
      
      // Save authentication state
      await context.storageState({ path: 'tests/e2e/auth.json' });
      console.log('✓ Authentication state saved');
      
    } catch (error) {
      console.error('Failed to set up authentication:', error);
    } finally {
      await browser.close();
    }
  }
  
  // Set up any test data, mock servers, etc.
  console.log('Global setup completed');
}

export default globalSetup;