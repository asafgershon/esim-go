/**
 * Admin-Friendly Rule Examples
 * 
 * These examples demonstrate how the new computed fields make rules
 * much simpler for non-technical administrators to understand and manage.
 */

// BEFORE: Complex rule requiring technical understanding
export const oldComplexUnusedDaysRule = {
  name: "Complex Unused Days Discount (OLD)",
  category: "DISCOUNT",
  conditions: [
    { field: "response.unusedDays", operator: "GREATER_THAN", value: 0 },
    { field: "processing.previousBundle", operator: "NOT_EQUALS", value: null }
  ],
  actions: [
    // This required complex calculation in the pipeline step
    { type: "APPLY_DISCOUNT_FIXED", value: "calculateMarkupDifference() / unusedDays * unusedDays" }
  ]
};

// AFTER: Simple admin-friendly rule using computed fields
export const newSimpleUnusedDaysRule = {
  id: "unused-days-discount-auto",
  name: "Unused Days Discount (Auto)",
  category: "DISCOUNT", 
  conditions: [
    { field: "processing.bundleUpgrade", operator: "EQUALS", value: true },
    { field: "response.unusedDays", operator: "GREATER_THAN", value: 0 }
  ],
  actions: [
    { type: "APPLY_UNUSED_DAYS_DISCOUNT", value: "auto" }
  ],
  priority: 50,
  isActive: true
};

// Example: Manual unused days discount with custom rate
export const customUnusedDaysRule = {
  id: "unused-days-discount-custom",
  name: "Weekend Special Unused Days Discount",
  category: "DISCOUNT",
  conditions: [
    { field: "processing.bundleUpgrade", operator: "EQUALS", value: true },
    { field: "response.unusedDays", operator: "GREATER_THAN", value: 0 },
    { field: "request.promo", operator: "EQUALS", value: "WEEKEND_SPECIAL" }
  ],
  actions: [
    { type: "APPLY_UNUSED_DAYS_DISCOUNT", value: 15.0 } // Fixed $15 discount regardless of calculation
  ],
  priority: 60,
  isActive: true
};

// Example: Bundle upgrade bonus (leveraging bundleUpgrade field)
export const bundleUpgradeBonusRule = {
  id: "bundle-upgrade-bonus",
  name: "Bundle Upgrade Bonus Discount",
  category: "DISCOUNT",
  conditions: [
    { field: "processing.bundleUpgrade", operator: "EQUALS", value: true },
    { field: "processing.markupDifference", operator: "GREATER_THAN", value: 10 }
  ],
  actions: [
    { type: "APPLY_DISCOUNT_FIXED", value: 5.0 } // $5 bonus for large bundle upgrades
  ],
  priority: 40,
  isActive: true
};

// Example: Conditional discount based on computed values
export const smartDiscountRule = {
  id: "smart-discount-rule",
  name: "Smart Discount Based on Upgrade Cost",
  category: "DISCOUNT",
  conditions: [
    { field: "processing.unusedDaysDiscountPerDay", operator: "GREATER_THAN", value: 3.0 },
    { field: "response.unusedDays", operator: "GREATER_THAN_OR_EQUAL", value: 2 }
  ],
  actions: [
    // Use 80% of the computed discount instead of 100%
    { type: "APPLY_DISCOUNT_FIXED", value: "processing.effectiveDiscount * 0.8" }
  ],
  priority: 45,
  isActive: true
};

// SQL migration example for admin-friendly rules
export const adminFriendlyRuleMigration = `
-- Replace complex unused days discount with simple admin-friendly version
INSERT INTO pricing_rules (
  id,
  name, 
  category,
  conditions,
  actions,
  is_active,
  created_by,
  created_at,
  updated_at
) VALUES (
  'admin-friendly-unused-days-discount',
  'Unused Days Discount (Auto-Calculated)',
  'DISCOUNT',
  '[
    {
      "field": "processing.bundleUpgrade",
      "operator": "EQUALS", 
      "value": true
    },
    {
      "field": "response.unusedDays",
      "operator": "GREATER_THAN",
      "value": 0
    }
  ]',
  '[
    {
      "type": "APPLY_UNUSED_DAYS_DISCOUNT",
      "value": "auto"
    }
  ]',
  true,
  'admin-ui',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  conditions = EXCLUDED.conditions,
  actions = EXCLUDED.actions,
  updated_at = NOW();
`;

/**
 * Admin UI Field Suggestions
 * 
 * These computed fields can be suggested in admin UI dropdowns:
 */
export const adminUIFieldSuggestions = {
  businessLogicFields: [
    {
      field: "processing.bundleUpgrade",
      description: "True when customer gets a longer bundle than requested",
      type: "boolean",
      example: "true"
    },
    {
      field: "processing.markupDifference", 
      description: "Markup difference between selected and previous bundle",
      type: "number",
      example: "5.0"
    },
    {
      field: "processing.unusedDaysDiscountPerDay",
      description: "Calculated discount per unused day",
      type: "number", 
      example: "2.5"
    },
    {
      field: "processing.effectiveDiscount",
      description: "Total calculated discount for unused days",
      type: "number",
      example: "5.0"
    },
    {
      field: "response.unusedDays",
      description: "Number of unused days in selected bundle",
      type: "number",
      example: "2"
    }
  ],
  
  recommendedActions: [
    {
      type: "APPLY_UNUSED_DAYS_DISCOUNT",
      description: "Apply automatic unused days discount",
      valueOptions: ["auto", "custom amount"],
      adminFriendly: true
    }
  ]
};