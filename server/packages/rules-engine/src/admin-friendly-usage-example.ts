import { RuleBuilder } from './rule-builder';
import { RuleCategory } from './rules-engine-types';

/**
 * Admin-Friendly Usage Examples
 * 
 * These examples show how non-technical administrators can now create
 * complex business logic rules using simple, intuitive methods.
 */

// Example 1: Simple automatic unused days discount
export const simpleUnusedDaysDiscount = new RuleBuilder()
  .name("Automatic Unused Days Discount")
  .description("Give customers a discount when they get a bundle longer than requested")
  .category(RuleCategory.Discount)
  .when()
    .bundleUpgrade().equals("true")        // Bundle is longer than requested
  .when()
    .unusedDays().greaterThan(0)         // Has unused days
  .then()
    .applyUnusedDaysDiscount("auto")     // Apply automatic calculation
  .priority(50)
  .build();

// Example 2: Weekend special with enhanced unused days discount  
export const weekendUnusedDaysSpecial = new RuleBuilder()
  .name("Weekend Special - Enhanced Unused Days Discount")
  .description("Double the unused days discount on weekends")
  .category(RuleCategory.Discount)
  .when()
    .bundleUpgrade().equals("true")
  .when()
    .unusedDays().greaterThan(0)
  .when()
    .field("request.promo").equals("WEEKEND_SPECIAL")
  .then()
    // Custom discount amount instead of auto-calculation
    .applyUnusedDaysDiscount(10.0)  // Fixed $10 discount
  .priority(60)
  .build();

// Example 3: Conditional discount based on markup difference
export const largeUpgradeBonus = new RuleBuilder()
  .name("Large Bundle Upgrade Bonus")
  .description("Extra discount for large bundle upgrades")
  .category(RuleCategory.Discount)
  .when()
    .bundleUpgrade().equals("true")
  .when()
    .markupDifference().greaterThan(15)  // Only for large markup differences
  .when()
    .unusedDays().greaterThanOrEqual(3)  // At least 3 unused days
  .then()
    .applyFixedDiscount(5.0)  // $5 bonus discount
  .priority(70)
  .build();

// Example 4: Smart discount based on calculated values
export const smartDiscountRule = new RuleBuilder()
  .name("Smart Discount for High-Value Upgrades")
  .description("Apply 80% of calculated discount for high-value upgrades")
  .category(RuleCategory.Discount)
  .when()
    .unusedDaysDiscountPerDay().greaterThan(4.0)  // High discount per day
  .when()
    .effectiveDiscount().greaterThan(10.0)        // High total discount
  .then()
    // Apply 80% of the calculated discount instead of 100%
    .applyUnusedDaysDiscount("auto")  // Could also use custom calculation
  .priority(65)
  .build();

/**
 * Before vs After Comparison
 */

// BEFORE: Complex rule requiring technical knowledge
export const oldComplexRule = {
  name: "Complex Unused Days Discount",
  category: "DISCOUNT",
  conditions: [
    { field: "processing.selectedBundle.validityInDays", operator: "GREATER_THAN", value: "request.duration" },
    { field: "response.unusedDays", operator: "GREATER_THAN", value: 0 },
    { field: "processing.previousBundle", operator: "NOT_EQUALS", value: null }
  ],
  actions: [
    // Complex calculation embedded in pipeline step - not in rule
    { type: "APPLY_DISCOUNT_FIXED", value: "computed_in_pipeline" }
  ]
};

// AFTER: Simple admin-friendly rule
export const newSimpleRule = new RuleBuilder()
  .name("Simple Unused Days Discount")
  .category(RuleCategory.Discount)
  .when()
    .bundleUpgrade().equals("true")     // Clear business intent
  .when()
    .unusedDays().greaterThan(0)      // Simple field name
  .then()
    .applyUnusedDaysDiscount("auto")  // Automatic calculation
  .priority(50)
  .build();

/**
 * Admin UI Benefits:
 * 
 * 1. Field Suggestions:
 *    - bundleUpgrade (boolean) - "Customer gets longer bundle than requested"
 *    - unusedDays (number) - "Number of unused days"
 *    - markupDifference (number) - "Price difference between bundle options"
 * 
 * 2. Action Suggestions:
 *    - applyUnusedDaysDiscount("auto") - "Apply automatic unused days discount"
 *    - applyUnusedDaysDiscount(amount) - "Apply custom discount amount"
 * 
 * 3. Business Logic Translation:
 *    - Technical: "processing.selectedBundle.validityInDays > request.duration"
 *    - Admin-Friendly: "bundleUpgrade equals true"
 * 
 * 4. Validation:
 *    - Engine validates computed fields are available
 *    - Clear error messages for missing dependencies
 */

export const adminUIRuleExample = {
  // This is what the admin sees in the UI
  conditions: [
    { 
      field: "Bundle Upgrade", 
      operator: "equals", 
      value: "Yes",
      description: "Customer gets a bundle longer than they requested"
    },
    { 
      field: "Unused Days", 
      operator: "greater than", 
      value: 0,
      description: "Number of unused days in the selected bundle"
    }
  ],
  actions: [
    {
      type: "Apply Unused Days Discount",
      value: "Automatic",
      description: "Automatically calculate discount based on price difference"
    }
  ]
};