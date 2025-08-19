import { test, expect } from './fixtures/auth.fixture';
import { AuthHelpers } from './helpers/auth-helpers';

test.describe('Authentication - Login Flow', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    
    // Navigate to a page first before accessing localStorage
    await page.goto('/');
    
    // Ensure we start from a clean state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('It should login', async ({ page, testUser }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Verify login page loaded
    await authHelpers.waitForLoginForm();
    
    // Check that all login elements are present
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('button:has-text("שלח קוד אימות")')).toBeVisible();
    await expect(page.locator('button:has-text("המשך עם Apple")')).toBeVisible();
    await expect(page.locator('button:has-text("המשך עם Google")')).toBeVisible();
    
    // Perform login with phone number
    await authHelpers.loginWithPhone(testUser.phoneNumber);
    
    // Verify successful login by checking redirect
    await expect(page).toHaveURL(/\/(profile|$)/, { timeout: 30000 });
    
    // Verify auth token is stored
    const authToken = await authHelpers.getAuthToken();
    expect(authToken).toBeTruthy();
    expect(authToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format
    
    // Verify user can access authenticated content
    if (page.url().includes('profile')) {
      // If redirected to profile, verify profile page elements
      await expect(page.locator('text=/פרופיל|Profile/')).toBeVisible({ timeout: 10000 });
    }
  });

  test('It should show validation errors for invalid phone number', async ({ page }) => {
    await page.goto('/login');
    await authHelpers.waitForLoginForm();
    
    // Try various invalid phone numbers
    const invalidNumbers = [
      '123',           // Too short
      'abcdefgh',      // Letters
      '+1',            // Incomplete international
      '050',           // Incomplete local
    ];
    
    for (const invalidNumber of invalidNumbers) {
      await authHelpers.fillPhoneNumber(invalidNumber);
      
      // Try to submit
      const submitButton = page.locator('button:has-text("שלח קוד אימות")');
      
      // Check if button is disabled or if error appears
      const isDisabled = await submitButton.isDisabled();
      
      if (!isDisabled) {
        await submitButton.click();
        // Check for validation error
        const error = await page.locator('.text-destructive').first();
        await expect(error).toBeVisible({ timeout: 5000 });
      }
      
      // Clear the input for next iteration
      await page.locator('input[type="tel"]').clear();
    }
  });

  test('It should handle OTP resend', async ({ page, testUser }) => {
    await page.goto('/login');
    await authHelpers.waitForLoginForm();
    
    // Enter phone number and submit
    await authHelpers.fillPhoneNumber(testUser.phoneNumber);
    await page.click('button:has-text("שלח קוד אימות")');
    
    // Wait for OTP step
    await authHelpers.waitForOTPStep();
    
    // Click resend button (might need to wait for cooldown)
    const resendButton = page.locator('button:has-text(/שלח קוד חדש|שלח שוב/)');
    
    // Check if button has cooldown
    const buttonText = await resendButton.textContent();
    if (buttonText?.includes('שניות')) {
      // Wait for cooldown to finish (max 60 seconds)
      await expect(resendButton).toContainText('שלח קוד חדש', { timeout: 61000 });
    }
    
    // Click resend
    await resendButton.click();
    
    // Verify we're still on OTP step and can enter code
    await authHelpers.waitForOTPStep();
    const otpInputs = page.locator('input[inputmode="numeric"], input[type="text"]').first();
    await expect(otpInputs).toBeVisible();
  });

  test('It should navigate back from OTP to phone input', async ({ page, testUser }) => {
    await page.goto('/login');
    await authHelpers.waitForLoginForm();
    
    // Enter phone number and submit
    await authHelpers.fillPhoneNumber(testUser.phoneNumber);
    await page.click('button:has-text("שלח קוד אימות")');
    
    // Wait for OTP step
    await authHelpers.waitForOTPStep();
    
    // Click back button
    await authHelpers.backToPhoneStep();
    
    // Verify we're back at phone input
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('button:has-text("שלח קוד אימות")')).toBeVisible();
  });

  test('It should persist login with remember me', async ({ page, testUser }) => {
    await page.goto('/login');
    await authHelpers.waitForLoginForm();
    
    // Ensure remember me is checked
    const rememberCheckbox = page.locator('input[type="checkbox"]').first();
    const isChecked = await rememberCheckbox.isChecked();
    if (!isChecked) {
      await rememberCheckbox.click();
    }
    
    // Login
    await authHelpers.loginWithPhone(testUser.phoneNumber, true);
    
    // Verify login succeeded
    await expect(page).toHaveURL(/\/(profile|$)/, { timeout: 30000 });
    
    // Check localStorage for remember flag
    const rememberFlag = await page.evaluate(() => {
      return localStorage.getItem('rememberLogin');
    });
    expect(rememberFlag).toBeTruthy();
  });

  test('It should logout successfully', async ({ page, testUser }) => {
    // First login
    await page.goto('/login');
    await authHelpers.loginWithPhone(testUser.phoneNumber);
    await expect(page).toHaveURL(/\/(profile|$)/, { timeout: 30000 });
    
    // Verify authenticated
    let isAuth = await authHelpers.isAuthenticated();
    expect(isAuth).toBeTruthy();
    
    // Logout
    await authHelpers.logout();
    
    // Verify logged out
    isAuth = await authHelpers.isAuthenticated();
    expect(isAuth).toBeFalsy();
    
    // Verify can't access protected routes
    await page.goto('/profile');
    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
  });

  test('It should handle session expiry gracefully', async ({ page }) => {
    // Set an expired token
    await page.goto('/');
    await page.evaluate(() => {
      // Set an invalid/expired token
      localStorage.setItem('authToken', 'expired.token.here');
    });
    
    // Try to access protected route
    await page.goto('/profile');
    
    // Should redirect to login or show error
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
    
    // Verify token was cleared
    const token = await authHelpers.getAuthToken();
    expect(!token || token !== 'expired.token.here').toBeTruthy();
  });
});

test.describe('Authentication - Using Fixtures', () => {
  test('It should access authenticated content using fixture', async ({ authenticatedPage }) => {
    // This test uses the authenticatedPage fixture which handles login automatically
    
    // We should already be logged in and on the profile page
    await expect(authenticatedPage).toHaveURL('/profile');
    
    // Verify authenticated content is accessible
    await expect(authenticatedPage.locator('text=/פרופיל|Profile/')).toBeVisible();
    
    // Can navigate to other authenticated pages
    await authenticatedPage.goto('/');
    
    // Verify we stay authenticated
    const authHelpers = new AuthHelpers(authenticatedPage);
    const isAuth = await authHelpers.isAuthenticated();
    expect(isAuth).toBeTruthy();
  });
});