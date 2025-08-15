#!/usr/bin/env tsx

/**
 * Example usage of the enhanced discount functionality
 * 
 * This demonstrates how to use:
 * 1. Coupon code discounts
 * 2. Email domain discounts
 * 
 * Both work independently of unused days calculations.
 */

import { calculatePricing } from './src/index';

async function demonstrateDiscounts() {
  console.log('=== eSIM Go Pricing Engine v2 - Discount Examples ===\n');

  // Base pricing example (no discounts)
  console.log('1. Base pricing (no discounts):');
  const baseResult = await calculatePricing({
    days: 7,
    country: 'US',
    group: 'Standard Unlimited Essential',
  });
  console.log(`Final Price: $${baseResult.pricing.finalPrice}`);
  console.log(`Discount Value: $${baseResult.pricing.discountValue}`);
  console.log('---\n');

  // Coupon code discount example
  console.log('2. With valid coupon code (WELCOME10 - 10% off):');
  const couponResult = await calculatePricing({
    days: 7,
    country: 'US', 
    group: 'Standard Unlimited Essential',
    couponCode: 'WELCOME10',
  });
  console.log(`Final Price: $${couponResult.pricing.finalPrice}`);
  console.log(`Discount Value: $${couponResult.pricing.discountValue}`);
  console.log(`Discount Rate: ${couponResult.pricing.discountRate}%`);
  console.log('---\n');

  // Email domain discount example
  console.log('3. With corporate email domain (company.com - 15% off):');
  const emailResult = await calculatePricing({
    days: 7,
    country: 'US',
    group: 'Standard Unlimited Essential', 
    userEmail: 'user@company.com',
  });
  console.log(`Final Price: $${emailResult.pricing.finalPrice}`);
  console.log(`Discount Value: $${emailResult.pricing.discountValue}`);
  console.log(`Discount Rate: ${emailResult.pricing.discountRate}%`);
  console.log('---\n');

  // Fixed discount coupon example
  console.log('4. With fixed discount coupon (FIXED50 - $50 off):');
  const fixedResult = await calculatePricing({
    days: 14,
    country: 'US',
    group: 'Standard Unlimited Essential',
    couponCode: 'FIXED50',
  });
  console.log(`Final Price: $${fixedResult.pricing.finalPrice}`);
  console.log(`Discount Value: $${fixedResult.pricing.discountValue}`);
  console.log('---\n');

  // Invalid coupon example
  console.log('5. With invalid coupon code (should not apply discount):');
  const invalidResult = await calculatePricing({
    days: 7,
    country: 'US',
    group: 'Standard Unlimited Essential',
    couponCode: 'INVALID123',
  });
  console.log(`Final Price: $${invalidResult.pricing.finalPrice}`);
  console.log(`Discount Value: $${invalidResult.pricing.discountValue}`);
  console.log('---\n');

  // Email domain + coupon (coupon should take priority)
  console.log('6. Corporate email + coupon (coupon takes priority):');
  const priorityResult = await calculatePricing({
    days: 7,
    country: 'US',
    group: 'Standard Unlimited Essential',
    userEmail: 'user@company.com',
    couponCode: 'SAVE20', // 20% off with min spend $50
  });
  console.log(`Final Price: $${priorityResult.pricing.finalPrice}`);
  console.log(`Discount Value: $${priorityResult.pricing.discountValue}`);
  console.log(`Discount Rate: ${priorityResult.pricing.discountRate}%`);
  console.log('---\n');

  // University email discount
  console.log('7. University email discount (25% off):');
  const uniResult = await calculatePricing({
    days: 10,
    country: 'US',
    group: 'Standard Unlimited Essential',
    userEmail: 'student@university.edu',
  });
  console.log(`Final Price: $${uniResult.pricing.finalPrice}`);
  console.log(`Discount Value: $${uniResult.pricing.discountValue}`);
  console.log(`Discount Rate: ${uniResult.pricing.discountRate}%`);
  console.log('---\n');

  console.log('=== Available Coupon Codes ===');
  console.log('WELCOME10    - 10% discount (general use)');
  console.log('SAVE20       - 20% discount (min spend $50, max discount $25)');
  console.log('SUMMER2025   - 15% discount (EU, US, ASIA regions only)');
  console.log('LONGSTAY     - 25% discount (specific bundles only)');
  console.log('FIXED50      - $50 fixed discount (min spend $100)');
  console.log('');

  console.log('=== Available Email Domain Discounts ===');
  console.log('company.com      - 15% discount (Company Corp)');
  console.log('enterprise.org   - 20% discount (Enterprise Solutions)');
  console.log('startup.io       - 10% discount (min spend $25)');
  console.log('university.edu   - 25% discount (max $50 off)');
  console.log('government.gov   - 30% discount (max $200 off)');
}

// Run examples if this file is executed directly
if (require.main === module) {
  demonstrateDiscounts().catch(console.error);
}

export { demonstrateDiscounts };