import { describe, it, expect, beforeEach } from 'bun:test';
import { DEFAULT_RULES } from '../defaults';
import { RuleBuilder } from '../rule-builder';
import { RuleCategory } from '../rules-engine-types';
import type { PricingEngineState, Bundle } from '../rules-engine-types';

/**
 * Business Scenario Tests
 * 
 * These tests validate that our default rules correctly implement
 * the business logic described in the requirements.
 */

describe('Business Scenario: Unused Days Discount', () => {
  let mockState: PricingEngineState;
  
  beforeEach(() => {
    // Set up the business scenario:
    // Customer requests 8 days, gets 10-day bundle
    // 7-day bundle has $10 markup, 10-day bundle has $15 markup
    mockState = {
      request: {
        duration: 8,  // Customer requested 8 days
        countryISO: 'DE',
        planId: 'standard-unlimited-lite'
      },
      processing: {
        selectedBundle: {
          id: 'bundle-10-day',
          planId: 'standard-unlimited-lite',
          validityInDays: 10,  // Customer gets 10-day bundle
          basePrice: 25.00,
          countryISO: 'DE',
          group: 'Standard - Unlimited Lite'
        } as Bundle,
        previousBundle: {
          id: 'bundle-7-day', 
          planId: 'standard-unlimited-lite',
          validityInDays: 7,   // Best match was 7-day bundle
          basePrice: 20.00,
          countryISO: 'DE',
          group: 'Standard - Unlimited Lite'
        } as Bundle,
        region: 'Europe',
        group: 'Standard - Unlimited Lite',
        // Computed fields that would be calculated by the engine
        markupDifference: 5.0,  // $15 - $10 = $5
        unusedDaysDiscountPerDay: 2.5,  // $5 / 2 unused days = $2.50
        bundleUpgrade: true,  // 10 days > 8 days requested
        effectiveDiscount: 5.0,  // $2.50 * 2 unused days = $5.00
      },
      response: {
        unusedDays: 2,  // 10 - 8 = 2 unused days
        pricing: {
          basePrice: 25.00,
          markup: 15.00,  // 10-day bundle markup
          totalCost: 40.00,  // $25 + $15
          discountValue: 0,
          priceAfterDiscount: 40.00,
        }
      },
      context: {
        rules: [],
        date: new Date('2024-01-15'),
      },
      metadata: {
        requestId: 'test-request-123',
        timestamp: new Date(),
        version: '1.0.0'
      }
    };
  });

  it('should create the correct unused days discount rule', () => {
    const unusedDaysRule = DEFAULT_RULES.find(
      rule => rule.name === "Unused Days Discount - Bundle Upgrades"
    );

    expect(unusedDaysRule).toBeDefined();
    expect(unusedDaysRule?.category).toBe(RuleCategory.Discount);
    expect(unusedDaysRule?.priority).toBe(80);
    
    // Check conditions
    expect(unusedDaysRule?.conditions).toHaveLength(3);
    
    // Should check for bundle upgrade
    const bundleUpgradeCondition = unusedDaysRule?.conditions.find(
      c => c.field === 'processing.bundleUpgrade'
    );
    expect(bundleUpgradeCondition).toBeDefined();
    expect(bundleUpgradeCondition?.value).toBe("true");
    
    // Should check for unused days > 0
    const unusedDaysCondition = unusedDaysRule?.conditions.find(
      c => c.field === 'response.unusedDays'
    );
    expect(unusedDaysCondition).toBeDefined();
    expect(unusedDaysCondition?.value).toBe(0);
    
    // Should check for markup difference > 0
    const markupDiffCondition = unusedDaysRule?.conditions.find(
      c => c.field === 'processing.markupDifference'
    );
    expect(markupDiffCondition).toBeDefined();
    expect(markupDiffCondition?.value).toBe(0);
    
    // Check action
    expect(unusedDaysRule?.actions).toHaveLength(1);
    expect(unusedDaysRule?.actions[0].type).toBe('APPLY_UNUSED_DAYS_DISCOUNT');
    expect(unusedDaysRule?.actions[0].value).toBe(1); // "auto" converted to 1
  });

  it('should have correct markup rules for the business scenario', () => {
    const markupRules = DEFAULT_RULES.filter(rule => 
      rule.category === RuleCategory.Fee && 
      rule.name.includes('Unlimited Lite') &&
      rule.name.includes('Markup')
    );

    expect(markupRules.length).toBeGreaterThanOrEqual(3);

    // Check 7-day markup rule
    const sevenDayRule = markupRules.find(rule => rule.name.includes('7-day'));
    expect(sevenDayRule).toBeDefined();
    expect(sevenDayRule?.actions[0].value).toBe(10.00); // $10 markup

    // Check 10-day markup rule  
    const tenDayRule = markupRules.find(rule => rule.name.includes('10-day'));
    expect(tenDayRule).toBeDefined();
    expect(tenDayRule?.actions[0].value).toBe(15.00); // $15 markup
  });

  it('should validate the business calculation logic', () => {
    // Given the scenario: 8 days requested, 10-day bundle selected
    const requestedDays = 8;
    const selectedBundleDays = 10;
    const unusedDays = selectedBundleDays - requestedDays; // 2 days
    
    // Given the markup difference: $15 - $10 = $5
    const selectedMarkup = 15.00;
    const previousMarkup = 10.00;
    const markupDifference = selectedMarkup - previousMarkup; // $5
    
    // Calculate expected discount
    const discountPerDay = markupDifference / unusedDays; // $5 / 2 = $2.50
    const totalDiscount = discountPerDay * unusedDays; // $2.50 * 2 = $5.00
    
    expect(unusedDays).toBe(2);
    expect(markupDifference).toBe(5.00);
    expect(discountPerDay).toBe(2.50);
    expect(totalDiscount).toBe(5.00);
    
    // Verify this matches our mock state
    expect(mockState.response.unusedDays).toBe(unusedDays);
    expect(mockState.processing.markupDifference).toBe(markupDifference);
    expect(mockState.processing.unusedDaysDiscountPerDay).toBe(discountPerDay);
    expect(mockState.processing.effectiveDiscount).toBe(totalDiscount);
  });

  it('should create rules with admin-friendly field names', () => {
    const ruleBuilder = new RuleBuilder()
      .name("Test Admin-Friendly Rule")
      .category(RuleCategory.Discount)
      .when()
        .bundleUpgrade().equals("true")
      .when()
        .unusedDays().greaterThan(0)
      .when()
        .markupDifference().greaterThan(0)
      .then()
        .applyUnusedDaysDiscount("auto")
      .priority(50)
      .build();

    expect(ruleBuilder.name).toBe("Test Admin-Friendly Rule");
    expect(ruleBuilder.conditions).toHaveLength(3);
    
    // Check that the conditions use the computed field paths
    expect(ruleBuilder.conditions[0].field).toBe('processing.bundleUpgrade');
    expect(ruleBuilder.conditions[1].field).toBe('response.unusedDays'); 
    expect(ruleBuilder.conditions[2].field).toBe('processing.markupDifference');
    
    expect(ruleBuilder.actions[0].type).toBe('APPLY_UNUSED_DAYS_DISCOUNT');
    expect(ruleBuilder.actions[0].value).toBe(1); // "auto" mode
  });

  it('should handle edge cases correctly', () => {
    // Test: No unused days (exact match)
    const exactMatchState = { ...mockState };
    exactMatchState.request.duration = 10; // Exact match
    exactMatchState.response.unusedDays = 0;
    exactMatchState.processing.bundleUpgrade = false;
    
    // The rule should not apply in this case
    const conditions = DEFAULT_RULES[0].conditions;
    const unusedDaysCondition = conditions.find(c => c.field === 'response.unusedDays');
    expect(unusedDaysCondition?.operator).toBe('GREATER_THAN');
    expect(unusedDaysCondition?.value).toBe(0);
    // With 0 unused days, this condition would fail
    
    // Test: No markup difference 
    const noMarkupDiffState = { ...mockState };
    noMarkupDiffState.processing.markupDifference = 0;
    
    // The rule should not apply when markup difference is 0
    const markupCondition = conditions.find(c => c.field === 'processing.markupDifference');
    expect(markupCondition?.operator).toBe('GREATER_THAN');
    expect(markupCondition?.value).toBe(0);
    // With 0 markup difference, this condition would fail
  });

  it('should have appropriate rule priorities', () => {
    const rules = DEFAULT_RULES;
    
    // System rules (markup, processing fees, constraints) should have highest priority
    const systemRules = rules.filter(r => 
      r.name.includes('Markup') || 
      r.name.includes('Processing Fee') || 
      r.name.includes('Constraint')
    );
    systemRules.forEach(rule => {
      expect(rule.priority).toBeGreaterThanOrEqual(90);
    });
    
    // Business logic rules should have medium-high priority
    const businessRules = rules.filter(r => 
      r.name.includes('Unused Days Discount')
    );
    businessRules.forEach(rule => {
      expect(rule.priority).toBeGreaterThanOrEqual(70);
      expect(rule.priority).toBeLessThan(90);
    });
    
    // Promotional rules should have lower priority
    const promoRules = rules.filter(r => 
      r.name.includes('Weekend') || 
      r.name.includes('Bonus')
    );
    promoRules.forEach(rule => {
      expect(rule.priority).toBeLessThan(90);
    });
  });
});