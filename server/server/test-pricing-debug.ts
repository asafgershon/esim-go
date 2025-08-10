import { calculatePricingWithDB } from '../packages/rules-engine-2/src/index';
import { PaymentMethod } from '../packages/rules-engine-2/src/generated/types';

async function testPricing() {
  const testCases = [
    { days: 1, expected: 4 },
    { days: 3, expected: 9 },
    { days: 7, expected: 28 }
  ];

  for (const test of testCases) {
    console.log(`\n=== Testing AU ${test.days} days (expected: $${test.expected}) ===`);
    
    const result = await calculatePricingWithDB({
      country: 'AU',
      days: test.days,
      group: 'Standard Unlimited Essential',
      paymentMethod: PaymentMethod.IsraeliCard
    });

    // Calculate what the price would be without processing fee
    const processingFeeRule = result.appliedRules.find(r => r.name.includes('processing fee'));
    const priceWithoutProcessingFee = result.pricing.finalPrice - (processingFeeRule?.impact || 0);

    console.log({
      days: test.days,
      finalPrice: result.pricing.finalPrice,
      priceWithoutProcessingFee: Math.round(priceWithoutProcessingFee),
      expected: test.expected,
      isRounded: result.pricing.finalPrice === test.expected,
      matchesWithoutFee: Math.round(priceWithoutProcessingFee) === test.expected,
      breakdown: {
        cost: result.selectedBundle?.price || 0,
        markup: result.appliedRules.find(r => r.name.includes('markup'))?.impact || 0,
        processingFee: processingFeeRule?.impact || 0,
        rounding: result.appliedRules.find(r => r.name.includes('rounding'))?.impact || 0
      },
      appliedRules: result.appliedRules.map(r => ({ 
        name: r.name, 
        impact: r.impact,
        category: r.category 
      }))
    });
  }
}

testPricing().catch(console.error);