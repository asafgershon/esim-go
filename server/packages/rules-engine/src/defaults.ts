import { RuleBuilder } from './rule-builder';
import { RuleCategory } from './rules-engine-types';

/**
 * Default System Rules
 * 
 * These rules implement the core business logic and are automatically loaded
 * into the system. They use the declarative RuleBuilder API to define
 * complex business scenarios in a readable way.
 */

// Core business rule: Unused days discount for bundle upgrades
export const unusedDaysBundleUpgradeDiscount = new RuleBuilder()
  .name("Unused Days Discount - Bundle Upgrades")
  .description("When customer requests shorter duration but gets longer bundle, apply discount for unused days based on markup difference")
  .category(RuleCategory.Discount)
  .when()
    .bundleUpgrade().equals("true")        // Customer got longer bundle than requested
  .when()
    .unusedDays().greaterThan(0)          // Has unused days to discount
  .when()
    .markupDifference().greaterThan(0)    // Markup difference exists for fair discount
  .then()
    .applyUnusedDaysDiscount("auto")      // Apply calculated discount: (markup_diff / unused_days) * unused_days
  .priority(80)
  .build();

// System markup rules - these define the base pricing structure
export const standardUnlimitedLite3DayMarkup = new RuleBuilder()
  .name("Standard Unlimited Lite 3-day Markup")
  .description("Base markup for 3-day Standard Unlimited Lite bundles")
  .category(RuleCategory.Fee)
  .when()
    .group().equals("Standard - Unlimited Lite")
  .when()
    .duration().equals(3)
  .then()
    .addMarkup(5.00)  // $5 markup
  .priority(100)
  .immutable()
  .build();

export const standardUnlimitedLite7DayMarkup = new RuleBuilder()
  .name("Standard Unlimited Lite 7-day Markup")
  .description("Base markup for 7-day Standard Unlimited Lite bundles")
  .category(RuleCategory.Fee)
  .when()
    .group().equals("Standard - Unlimited Lite")
  .when()
    .duration().equals(7)
  .then()
    .addMarkup(10.00)  // $10 markup
  .priority(100)
  .immutable()
  .build();

export const standardUnlimitedLite10DayMarkup = new RuleBuilder()
  .name("Standard Unlimited Lite 10-day Markup")
  .description("Base markup for 10-day Standard Unlimited Lite bundles")
  .category(RuleCategory.Fee)
  .when()
    .group().equals("Standard - Unlimited Lite")
  .when()
    .duration().equals(10)
  .then()
    .addMarkup(15.00)  // $15 markup
  .priority(100)
  .immutable()
  .build();

export const standardUnlimitedLite15DayMarkup = new RuleBuilder()
  .name("Standard Unlimited Lite 15-day Markup")
  .description("Base markup for 15-day Standard Unlimited Lite bundles")
  .category(RuleCategory.Fee)
  .when()
    .group().equals("Standard - Unlimited Lite")
  .when()
    .duration().equals(15)
  .then()
    .addMarkup(20.00)  // $20 markup
  .priority(100)
  .immutable()
  .build();

// Processing fee rules based on payment method
export const israeliCardProcessingFee = new RuleBuilder()
  .name("Israeli Card Processing Fee")
  .description("1.4% processing fee for Israeli credit cards")
  .category(RuleCategory.Fee)
  .when()
    .field("paymentMethod").equals("ISRAELI_CARD")
  .then()
    .setProcessingRate(1.4)
  .priority(90)
  .immutable()
  .build();

export const foreignCardProcessingFee = new RuleBuilder()
  .name("Foreign Card Processing Fee")
  .description("3.9% processing fee for foreign credit cards")
  .category(RuleCategory.Fee)
  .when()
    .field("paymentMethod").in(["FOREIGN_CARD", "VISA", "MASTERCARD"])
  .then()
    .setProcessingRate(3.9)
  .priority(90)
  .immutable()
  .build();

// Business scenario example rules
export const weekendSpecialDiscount = new RuleBuilder()
  .name("Weekend Special - Enhanced Bundle Upgrade Discount")
  .description("Double discount for bundle upgrades during weekend promotions")
  .category(RuleCategory.Discount)
  .when()
    .bundleUpgrade().equals("true")
  .when()
    .unusedDays().greaterThan(0)
  .when()
    .field("request.promo").equals("WEEKEND_SPECIAL")
  .then()
    .applyFixedDiscount(10.0)  // Fixed $10 instead of calculated discount
  .priority(85)
  .build();

export const largeUpgradeBonusDiscount = new RuleBuilder()
  .name("Large Bundle Upgrade Bonus")
  .description("Additional $5 discount for significant bundle upgrades (3+ unused days)")
  .category(RuleCategory.Discount)
  .when()
    .bundleUpgrade().equals("true")
  .when()
    .unusedDays().greaterThanOrEqual(3)
  .when()
    .markupDifference().greaterThan(8.0)  // Significant markup difference
  .then()
    .applyFixedDiscount(5.0)  // $5 bonus on top of unused days discount
  .priority(75)
  .build();

// Minimum constraints to ensure profitability
export const minimumProfitConstraint = new RuleBuilder()
  .name("Minimum Profit Constraint")
  .description("Ensure minimum $2 profit on all transactions")
  .category(RuleCategory.Constraint)
  .when()
    .field("bundle.cost").greaterThan(0)  // Any bundle with cost
  .then()
    .setMinimumProfit(2.00)
  .priority(95)
  .immutable()
  .build();

/**
 * Default rules collection for easy loading
 */
export const DEFAULT_RULES = [
  // Core business logic
  unusedDaysBundleUpgradeDiscount,
  
  // System markup rules (immutable)
  standardUnlimitedLite3DayMarkup,
  standardUnlimitedLite7DayMarkup,
  standardUnlimitedLite10DayMarkup,
  standardUnlimitedLite15DayMarkup,
  
  // Processing fees (immutable)
  israeliCardProcessingFee,
  foreignCardProcessingFee,
  
  // Business scenario rules
  weekendSpecialDiscount,
  largeUpgradeBonusDiscount,
  
  // Constraints (immutable)
  minimumProfitConstraint,
];

/**
 * Business Scenario Test Case
 * 
 * Customer requests 8 days, gets 10-day bundle:
 * 1. System calculates: unusedDays = 2, markupDifference = $15 - $10 = $5
 * 2. unusedDaysBundleUpgradeDiscount rule triggers
 * 3. Automatic calculation: $5 / 2 days = $2.50 per day discount
 * 4. Total discount applied: $2.50 × 2 = $5.00
 * 
 * If largeUpgradeBonusDiscount also applies (3+ unused days), customer gets additional $5 off.
 */

/**
 * Rule Loading Metadata
 */
export const RULE_METADATA = {
  version: "1.0.0",
  loadedAt: new Date().toISOString(),
  description: "Core eSIM Go pricing rules with admin-friendly business logic",
  totalRules: DEFAULT_RULES.length,
  categories: {
    discount: DEFAULT_RULES.filter(r => r.category === RuleCategory.Discount).length,
    fee: DEFAULT_RULES.filter(r => r.category === RuleCategory.Fee).length,
    constraint: DEFAULT_RULES.filter(r => r.category === RuleCategory.Constraint).length,
  }
};