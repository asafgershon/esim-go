import { test, expect } from '@playwright/test';

test.describe('Phone OTP Debug', () => {
  
  test('Debug phone submission and OTP step transition', async ({ page }) => {
    console.log('🔄 Debugging phone OTP flow...');
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForTimeout(3000);
    
    // Clear any existing auth/session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('📄 Initial page state:');
    const initialTitle = await page.locator('h1').textContent();
    const initialUrl = page.url();
    console.log(`  - Title: ${initialTitle}`);
    console.log(`  - URL: ${initialUrl}`);
    
    // Find phone input
    const phoneInput = page.locator('input[type="tel"]').first();
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    console.log('✓ Phone input found');
    
    // Enter test phone number
    const testPhone = '+15005550006';
    await phoneInput.fill(testPhone);
    console.log(`✓ Entered phone: ${testPhone}`);
    
    // Find and click submit button
    const submitButton = page.locator('button').filter({ 
      hasText: /שלח קוד אימות|שלח|Send/i 
    }).first();
    
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    const buttonText = await submitButton.textContent();
    console.log(`✓ Submit button found: "${buttonText}"`);
    
    // Check if button is enabled
    const isEnabled = await submitButton.isEnabled();
    console.log(`✓ Button enabled: ${isEnabled}`);
    
    // Monitor network requests for SMS/OTP API calls
    const networkLogs = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('auth') || url.includes('otp') || url.includes('sms')) {
        networkLogs.push({
          url,
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Click submit button
    await submitButton.click();
    console.log('✓ Clicked submit button');
    
    // Wait for potential network requests and UI updates
    await page.waitForTimeout(5000);
    
    // Check network logs
    console.log('📡 Network requests:');
    if (networkLogs.length > 0) {
      networkLogs.forEach(log => {
        console.log(`  - ${log.method} ${log.url} - Status: ${log.status}`);
      });
    } else {
      console.log('  - No auth/OTP/SMS network requests detected');
    }
    
    // Check page state after submission
    console.log('📄 Page state after submission:');
    const afterTitle = await page.locator('h1').textContent();
    const afterUrl = page.url();
    console.log(`  - Title: ${afterTitle}`);
    console.log(`  - URL: ${afterUrl}`);
    
    // Check for loading states
    const loadingTexts = ['שולח...', 'Loading...', 'Sending...'];
    for (const loadingText of loadingTexts) {
      const loadingElement = page.locator(`text="${loadingText}"`).first();
      if (await loadingElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`⏳ Loading state detected: ${loadingText}`);
      }
    }
    
    // Check for any error messages
    const errorSelectors = [
      'text=/error/i',
      'text=/שגיאה/',
      'text=/failed/i',
      'text=/invalid/i',
      '[role="alert"]',
      '.error',
      '.alert-error'
    ];
    
    console.log('⚠️ Checking for errors:');
    let errorFound = false;
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector).first();
      if (await errorElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        const errorText = await errorElement.textContent();
        console.log(`  - Error found: ${errorText}`);
        errorFound = true;
      }
    }
    
    if (!errorFound) {
      console.log('  - No visible errors detected');
    }
    
    // Check if we're still on phone step or moved to OTP step
    const phoneStepStill = await phoneInput.isVisible();
    const otpStepText = page.locator('text="אימות מספר טלפון"').first();
    const otpStepReached = await otpStepText.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log('📱 Step transition status:');
    console.log(`  - Still on phone step: ${phoneStepStill}`);
    console.log(`  - Reached OTP step: ${otpStepReached}`);
    
    // If we reached OTP step, try to interact with it manually
    if (otpStepReached) {
      console.log('🎯 OTP step reached - testing manual interaction');
      
      // Look for OTP input elements
      const otpContainer = page.locator('[data-input-otp-container]').first();
      const otpSlots = page.locator('[data-input-otp-slot]');
      
      const hasOtpContainer = await otpContainer.isVisible({ timeout: 2000 }).catch(() => false);
      const slotCount = await otpSlots.count();
      
      console.log(`  - OTP container visible: ${hasOtpContainer}`);
      console.log(`  - OTP slots count: ${slotCount}`);
      
      if (hasOtpContainer || slotCount > 0) {
        console.log('  - Attempting to enter test OTP...');
        try {
          if (hasOtpContainer) {
            await otpContainer.click();
            await page.keyboard.type('123456');
          } else if (slotCount > 0) {
            await otpSlots.first().click();
            await page.keyboard.type('123456');
          }
          console.log('  ✓ Test OTP entered successfully');
          
          // Wait for potential auto-submission
          await page.waitForTimeout(3000);
          
          // Check if authentication succeeded
          const finalTitle = await page.locator('h1').textContent();
          const finalUrl = page.url();
          console.log(`  - Final title: ${finalTitle}`);
          console.log(`  - Final URL: ${finalUrl}`);
          
        } catch (error) {
          console.log(`  - Error entering OTP: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Debug test completed');
  });
});