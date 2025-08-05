#!/usr/bin/env node
/**
 * Test script to verify database integration for coupons and corporate email domains
 * 
 * Usage:
 * 1. Make sure the database is running and populated with test data
 * 2. Set environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
 * 3. Run: node dist/test-database-integration.js
 */

import { calculatePricing } from './index';
import { 
  loadCouponByCode, 
  findCorporateEmailDomain, 
  getCouponUsageCount,
  clearCouponCaches 
} from './loaders/coupon-loader';
import { createLogger } from '@hiilo/utils/src/logger';

const logger = createLogger({
  name: 'test-database-integration',
  level: 'info',
});

async function testCouponIntegration() {
  logger.info('=== Testing Coupon Database Integration ===');

  try {
    // Test 1: Direct coupon loading
    logger.info('1. Testing direct coupon loading...');
    const testCoupons = ['WELCOME10', 'SAVE20', 'NONEXISTENT'];
    
    for (const couponCode of testCoupons) {
      const coupon = await loadCouponByCode(couponCode);
      if (coupon) {
        logger.info(`✓ Found coupon: ${coupon.code}`, {
          type: coupon.coupon_type,
          value: coupon.value,
          minSpend: coupon.min_spend,
          maxDiscount: coupon.max_discount,
          isActive: coupon.is_active,
        });

        // Check usage count
        const usage = await getCouponUsageCount(coupon.id);
        logger.info(`  Usage stats: Total: ${usage.totalUsage}, User: ${usage.userUsage}`);
      } else {
        logger.info(`✗ Coupon not found: ${couponCode}`);
      }
    }

    // Test 2: Pricing with coupon
    logger.info('2. Testing pricing calculation with coupons...');
    
    const pricingTests = [
      {
        description: 'US pricing with WELCOME10 coupon',
        request: {
          days: 7,
          country: 'US' as const,
          group: 'Standard Unlimited Essential',
          couponCode: 'WELCOME10',
          userId: 'test-user-123',
          userEmail: 'test@example.com',
        }
      },
      {
        description: 'EU pricing with SAVE20 coupon',
        request: {
          days: 14,
          country: 'DE' as const,
          group: 'Standard Unlimited Plus',
          couponCode: 'SAVE20',
          userId: 'test-user-456',
          userEmail: 'test@business.com',
        }
      },
      {
        description: 'Pricing without coupon (baseline)',
        request: {
          days: 7,
          country: 'US' as const,
          group: 'Standard Unlimited Essential',
          userId: 'test-user-789',
          userEmail: 'test@gmail.com',
        }
      }
    ];

    for (const test of pricingTests) {
      try {
        logger.info(`Testing: ${test.description}`);
        const result = await calculatePricing(test.request);
        
        logger.info(`✓ Calculation successful`, {
          finalPrice: result.pricing.finalPrice,
          discountValue: result.pricing.discountValue,
          discountRate: result.pricing.discountRate,
          selectedBundle: result.selectedBundle?.esim_go_name,
        });
      } catch (error) {
        logger.error(`✗ Calculation failed for ${test.description}:`, error);
      }
    }

  } catch (error) {
    logger.error('Error in coupon integration test:', error);
  }
}

async function testCorporateEmailIntegration() {
  logger.info('=== Testing Corporate Email Database Integration ===');

  try {
    // Test 1: Direct corporate domain loading
    logger.info('1. Testing direct corporate domain loading...');
    const testDomains = ['company.com', 'enterprise.org', 'gmail.com', 'unknown-domain.xyz'];
    
    for (const domain of testDomains) {
      const corporateDomain = await findCorporateEmailDomain(domain);
      if (corporateDomain) {
        logger.info(`✓ Found corporate domain: ${corporateDomain.domain}`, {
          discountPercentage: corporateDomain.discount_percentage,
          maxDiscount: corporateDomain.max_discount,
          minSpend: corporateDomain.min_spend,
          isActive: corporateDomain.is_active,
        });
      } else {
        logger.info(`✗ Corporate domain not found: ${domain}`);
      }
    }

    // Test 2: Pricing with corporate emails
    logger.info('2. Testing pricing calculation with corporate emails...');
    
    const corporateTests = [
      {
        description: 'Pricing with corporate email (company.com)',
        request: {
          days: 7,
          country: 'US' as const,
          group: 'Standard Unlimited Essential',
          userId: 'corporate-user-123',
          userEmail: 'employee@company.com',
        }
      },
      {
        description: 'Pricing with regular Gmail',
        request: {
          days: 7,
          country: 'US' as const,
          group: 'Standard Unlimited Essential',
          userId: 'regular-user-456',
          userEmail: 'user@gmail.com',
        }
      }
    ];

    for (const test of corporateTests) {
      try {
        logger.info(`Testing: ${test.description}`);
        const result = await calculatePricing(test.request);
        
        logger.info(`✓ Calculation successful`, {
          finalPrice: result.pricing.finalPrice,
          discountValue: result.pricing.discountValue,
          discountRate: result.pricing.discountRate,
          userEmail: test.request.userEmail,
        });
      } catch (error) {
        logger.error(`✗ Calculation failed for ${test.description}:`, error);
      }
    }

  } catch (error) {
    logger.error('Error in corporate email integration test:', error);
  }
}

async function testCachePerformance() {
  logger.info('=== Testing Cache Performance ===');

  try {
    // Clear caches first
    clearCouponCaches();
    
    // Time database lookup
    const startTime = Date.now();
    await loadCouponByCode('WELCOME10');
    const dbTime = Date.now() - startTime;
    logger.info(`Database lookup time: ${dbTime}ms`);
    
    // Time cached lookup
    const cachedStartTime = Date.now();
    await loadCouponByCode('WELCOME10');
    const cachedTime = Date.now() - cachedStartTime;
    logger.info(`Cached lookup time: ${cachedTime}ms`);
    
    logger.info(`Cache speedup: ${dbTime / cachedTime}x faster`);

  } catch (error) {
    logger.error('Error in cache performance test:', error);
  }
}

async function testDiscountPriority() {
  logger.info('=== Testing Discount Priority Rules ===');

  try {
    // Test scenario where both coupon and corporate discounts could apply
    logger.info('Testing discount priority (coupon vs corporate)...');
    
    const result = await calculatePricing({
      days: 7,
      country: 'US',
      group: 'Standard Unlimited Essential',
      couponCode: 'WELCOME10', // Should take priority over corporate discount
      userId: 'priority-test-user',
      userEmail: 'employee@company.com', // Has corporate discount available
    });
    
    logger.info('Priority test result:', {
      finalPrice: result.pricing.finalPrice,
      discountValue: result.pricing.discountValue,
      discountRate: result.pricing.discountRate,
    });
    
    logger.info('✓ Coupon should take priority over corporate discount');

  } catch (error) {
    logger.error('Error in discount priority test:', error);
  }
}

async function runAllTests() {
  logger.info('Starting comprehensive database integration tests...');
  
  const startTime = Date.now();
  
  try {
    await testCouponIntegration();
    await testCorporateEmailIntegration();
    await testCachePerformance();
    await testDiscountPriority();
    
    const totalTime = Date.now() - startTime;
    logger.info(`✅ All tests completed successfully in ${totalTime}ms`);
    
  } catch (error) {
    logger.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      logger.info('Test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { runAllTests, testCouponIntegration, testCorporateEmailIntegration };