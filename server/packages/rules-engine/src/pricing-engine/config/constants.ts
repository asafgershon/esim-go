/**
 * Pricing engine configuration constants
 */

export const DEFAULT_CONFIG = {
  // Logging
  enableDebugLogging: false,
  
  // Rule processing
  maxRulesPerCategory: 100,
  maxRuleConditions: 20,
  maxRuleActions: 10,
  
  // Pricing constraints
  minPrice: 0,
  maxPrice: 999999,
  maxDiscountPercentage: 100,
  maxMarkupPercentage: 1000,
  
  // Processing
  defaultCurrency: "USD",
  decimalPrecision: 2,
  
  // Performance
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
  
  // Validation
  validateInputs: true,
  validateOutputs: true,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_INPUT: "Invalid pricing engine input",
  NO_BUNDLES: "No bundles available for pricing",
  NO_RULES: "No pricing rules configured",
  INVALID_DURATION: "Invalid duration requested",
  CALCULATION_FAILED: "Price calculation failed",
} as const;

/**
 * Step names
 */
export const STEP_NAMES = {
  BUNDLE_SELECTION: "BUNDLE_SELECTION",
  BUNDLE_ADJUSTMENT: "BUNDLE_ADJUSTMENT",
  APPLY_DISCOUNTS: "APPLY_DISCOUNTS",
  APPLY_UNUSED_DAYS_DISCOUNT: "APPLY_UNUSED_DAYS_DISCOUNT",
  APPLY_CONSTRAINTS: "APPLY_CONSTRAINTS",
  APPLY_FEES: "APPLY_FEES",
  FINALIZE: "FINALIZE",
} as const;