import { Page, expect } from '@playwright/test';

/**
 * Authentication helper methods for E2E tests
 */
export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Login using phone number and OTP
   */
  async loginWithPhone(phoneNumber: string, rememberMe: boolean = true): Promise<void> {
    // Navigate to login if not already there
    if (!this.page.url().includes('/login')) {
      await this.page.goto('/login');
    }

    // Wait for login form to be visible
    await this.page.waitForSelector('input[type="tel"]', { timeout: 10000 });

    // Fill phone number
    await this.fillPhoneNumber(phoneNumber);

    // Check remember me if needed
    if (rememberMe) {
      const checkbox = this.page.locator('input[type="checkbox"]').first();
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
      }
    }

    // Submit phone form
    await this.page.click('button:has-text("שלח קוד אימות")');

    // Wait for OTP step
    await this.waitForOTPStep();

    // In test environment, we'll use a mock OTP
    // In real scenarios, you might need to:
    // 1. Intercept the OTP from test SMS service
    // 2. Use a fixed test OTP for test accounts
    // 3. Mock the backend to accept a specific OTP
    const testOTP = process.env.TEST_OTP || '123456';
    await this.fillOTP(testOTP);

    // Wait for successful authentication
    await this.waitForAuthentication();
  }

  /**
   * Login using social provider (Apple/Google)
   */
  async loginWithSocial(provider: 'apple' | 'google'): Promise<void> {
    // Navigate to login if not already there
    if (!this.page.url().includes('/login')) {
      await this.page.goto('/login');
    }

    // Click the appropriate social login button
    const buttonText = provider === 'apple' ? 'המשך עם Apple' : 'המשך עם Google';
    await this.page.click(`button:has-text("${buttonText}")`);

    // In test environment, you would typically:
    // 1. Mock the OAuth flow
    // 2. Use test accounts with automated OAuth consent
    // 3. Intercept and mock the redirect
    
    // For now, we'll wait for the OAuth redirect
    // This would need to be implemented based on your test setup
    await this.page.waitForTimeout(2000);
  }

  /**
   * Fill phone number in the login form
   */
  async fillPhoneNumber(phoneNumber: string): Promise<void> {
    const phoneInput = this.page.locator('input[type="tel"]');
    await phoneInput.clear();
    await phoneInput.fill(phoneNumber);
    
    // Trigger validation
    await phoneInput.blur();
    await this.page.waitForTimeout(100);
  }

  /**
   * Fill OTP code
   */
  async fillOTP(otp: string): Promise<void> {
    // OTP input is typically split into multiple inputs
    const otpInputs = this.page.locator('input[inputmode="numeric"]');
    const inputCount = await otpInputs.count();

    if (inputCount > 1) {
      // Multiple input fields for OTP
      for (let i = 0; i < otp.length && i < inputCount; i++) {
        await otpInputs.nth(i).fill(otp[i]);
      }
    } else {
      // Single input field for OTP
      const otpInput = this.page.locator('input').first();
      await otpInput.fill(otp);
    }

    // OTP forms often auto-submit when complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for OTP step to be visible
   */
  async waitForOTPStep(): Promise<void> {
    // Wait for OTP verification text
    await expect(
      this.page.locator('text=/אימות מספר טלפון|הזנו את הקוד/')
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Wait for successful authentication
   */
  async waitForAuthentication(): Promise<void> {
    // Wait for redirect to profile or home page
    await Promise.race([
      this.page.waitForURL('/profile', { timeout: 30000 }),
      this.page.waitForURL('/', { timeout: 30000 }),
    ]);

    // Verify auth token is stored
    const authToken = await this.getAuthToken();
    expect(authToken).toBeTruthy();
  }

  /**
   * Get auth token from localStorage
   */
  async getAuthToken(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
  }

  /**
   * Get refresh token from localStorage
   */
  async getRefreshToken(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('refreshToken');
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    // Clear localStorage
    await this.page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberLogin');
      localStorage.removeItem('lastPhoneNumber');
    });

    // Navigate to home page to trigger auth state update
    await this.page.goto('/');
    
    // Verify logout succeeded
    const isAuth = await this.isAuthenticated();
    expect(isAuth).toBeFalsy();
  }

  /**
   * Set auth tokens directly (useful for test setup)
   */
  async setAuthTokens(authToken: string, refreshToken?: string): Promise<void> {
    await this.page.evaluate(([auth, refresh]) => {
      localStorage.setItem('authToken', auth);
      if (refresh) {
        localStorage.setItem('refreshToken', refresh);
      }
    }, [authToken, refreshToken]);
  }

  /**
   * Wait for login form to be visible
   */
  async waitForLoginForm(): Promise<void> {
    await expect(
      this.page.locator('text=/התחברות לחשבון|Sign in/')
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check for authentication errors
   */
  async getAuthError(): Promise<string | null> {
    const errorElement = this.page.locator('.text-destructive, [role="alert"]').first();
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  /**
   * Handle OTP resend
   */
  async resendOTP(): Promise<void> {
    const resendButton = this.page.locator('button:has-text("שלח קוד חדש")');
    
    // Wait for cooldown if needed
    await expect(resendButton).toBeEnabled({ timeout: 60000 });
    await resendButton.click();
    
    // Wait for new OTP to be sent
    await this.page.waitForTimeout(1000);
  }

  /**
   * Go back to phone number step from OTP
   */
  async backToPhoneStep(): Promise<void> {
    await this.page.click('button:has-text("חזור למספר הטלפון")');
    await this.page.waitForSelector('input[type="tel"]', { timeout: 5000 });
  }
}