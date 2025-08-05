/**
 * Example demonstrating the database integration for coupons and corporate email domains
 * This file shows how to use the new database-backed discount system
 */

import { calculatePricing } from '../index';
import { createLogger } from '@hiilo/utils/src/logger';
import { 
  loadCouponByCode, 
  findCorporateEmailDomain, 
  clearCouponCaches,
  logCouponUsage 
} from '../loaders/coupon-loader';

const logger = createLogger({
  name: 'database-integration-example',
  level: 'info',
});

async function demonstrateCouponUsage() {
  logger.info('=== Demonstrating Coupon Usage ===');

  try {
    // Example 1: Test coupon validation directly
    logger.info('1. Testing direct coupon validation...');
    const coupon = await loadCouponByCode('WELCOME10');
    if (coupon) {
      logger.info('Found coupon:', {
        code: coupon.code,
        type: coupon.coupon_type,
        value: coupon.value,
        isActive: coupon.is_active,
        validUntil: coupon.valid_until,
      });
    } else {
      logger.info('Coupon WELCOME10 not found or invalid');
    }

    // Example 2: Test pricing with coupon code
    logger.info('2. Testing pricing calculation with coupon...');
    const pricingWithCoupon = await calculatePricing({
      days: 7,
      country: 'US',
      group: 'Standard Unlimited Essential',
      couponCode: 'WELCOME10',
      userId: 'user-123',
      userEmail: 'test@example.com',
    });

    logger.info('Pricing with coupon result:', {
      finalPrice: pricingWithCoupon.pricing.finalPrice,
      discountValue: pricingWithCoupon.pricing.discountValue,
      appliedRules: pricingWithCoupon.appliedRules.length,
    });

    // Example 3: Test pricing without coupon for comparison
    logger.info('3. Testing pricing calculation without coupon...');
    const pricingWithoutCoupon = await calculatePricing({
      days: 7,
      country: 'US',
      group: 'Standard Unlimited Essential',
      userId: 'user-123',
      userEmail: 'test@example.com',
    });

    logger.info('Pricing without coupon result:', {
      finalPrice: pricingWithoutCoupon.pricing.finalPrice,
      discountValue: pricingWithoutCoupon.pricing.discountValue,
    });

    const savings = pricingWithoutCoupon.pricing.finalPrice - pricingWithCoupon.pricing.finalPrice;
    logger.info(`Coupon savings: $${savings.toFixed(2)}`);

  } catch (error) {
    logger.error('Error in coupon demonstration:', error instanceof Error ? error : new Error(String(error)));
  }
}

async function demonstrateCorporateEmailDiscounts() {
  logger.info('=== Demonstrating Corporate Email Discounts ===');

  try {
    // Example 1: Test corporate email domain lookup
    logger.info('1. Testing direct corporate domain lookup...');
    const corporateDomain = await findCorporateEmailDomain('company.com');
    if (corporateDomain) {
      logger.info('Found corporate domain:', {
        domain: corporateDomain.domain,
        discountPercentage: corporateDomain.discount_percentage,
        maxDiscount: corporateDomain.max_discount,
        minSpend: corporateDomain.min_spend,
        isActive: corporateDomain.is_active,
      });
    } else {
      logger.info('Corporate domain company.com not found');
    }

    // Example 2: Test pricing with corporate email
    logger.info('2. Testing pricing with corporate email...');
    const corporatePricing = await calculatePricing({
      days: 7,
      country: 'US',
      group: 'Standard Unlimited Essential',
      userId: 'user-456',
      userEmail: 'employee@company.com',
    });

    logger.info('Corporate pricing result:', {
      finalPrice: corporatePricing.pricing.finalPrice,
      discountValue: corporatePricing.pricing.discountValue,
    });

    // Example 3: Test pricing with regular email
    logger.info('3. Testing pricing with regular email...');
    const regularPricing = await calculatePricing({
      days: 7,
      country: 'US',
      group: 'Standard Unlimited Essential',
      userId: 'user-789',
      userEmail: 'user@gmail.com',
    });

    logger.info('Regular pricing result:', {
      finalPrice: regularPricing.pricing.finalPrice,
      discountValue: regularPricing.pricing.discountValue,
    });

    const corporateSavings = regularPricing.pricing.finalPrice - corporatePricing.pricing.finalPrice;
    logger.info(`Corporate email savings: $${corporateSavings.toFixed(2)}`);

  } catch (error) {
    logger.error('Error in corporate email demonstration:', error instanceof Error ? error : new Error(String(error)));
  }
}

async function demonstrateCombinedDiscounts() {
  logger.info('=== Demonstrating Discount Priority ===');

  try {
    // Test what happens when both coupon and corporate email discounts are eligible
    logger.info('Testing combined discount scenario...');
    
    const combinedPricing = await calculatePricing({
      days: 7,
      country: 'US',
      group: 'Standard Unlimited Essential',
      couponCode: 'WELCOME10', // Should take priority over corporate discount
      userId: 'user-combined',
      userEmail: 'employee@company.com',
    });

    logger.info('Combined scenario result:', {
      finalPrice: combinedPricing.pricing.finalPrice,
      discountValue: combinedPricing.pricing.discountValue,
      // The rules engine should apply the coupon discount since it has higher priority
    });

  } catch (error) {
    logger.error('Error in combined discount demonstration:', error instanceof Error ? error : new Error(String(error)));
  }
}

async function demonstrateCacheClearing() {
  logger.info('=== Demonstrating Cache Management ===');

  try {
    logger.info('1. Loading coupon to populate cache...');
    await loadCouponByCode('WELCOME10');
    
    logger.info('2. Clearing caches...');
    clearCouponCaches();
    
    logger.info('3. Loading coupon again (should hit database)...');
    await loadCouponByCode('WELCOME10');
    
    logger.info('Cache demonstration completed');

  } catch (error) {
    logger.error('Error in cache demonstration:', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Run all demonstrations
 */
export async function runDatabaseIntegrationExamples() {
  logger.info('Starting database integration examples...');

  try {
    await demonstrateCouponUsage();
    await demonstrateCorporateEmailDiscounts();
    await demonstrateCombinedDiscounts();
    await demonstrateCacheClearing();
    
    logger.info('All database integration examples completed successfully!');
  } catch (error) {
    logger.error('Error running database integration examples:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Allow running this file directly for testing
if (require.main === module) {
  runDatabaseIntegrationExamples()
    .then(() => {
      logger.info('Examples completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Examples failed:', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    });
}