// Main exports
export { PricingEngine, type PricingEngineInput, type PricingEngineOutput } from './pricing-engine';
// Keep old export for backward compatibility
export { PricingEngine as PricingRuleEngine } from './pricing-engine';
export { RuleBuilder } from './rule-builder';

// Type exports from base types
export {
  RuleType,
  ConditionOperator,
  ActionType,
  PaymentMethod,
  RuleCondition,
  RuleAction,
  PricingRule as BasePricingRule,
  CreatePricingRuleInput,
  RuleConditionInput,
  RuleActionInput,
  AppliedRule,
  DiscountApplication,
  PricingRuleCalculation
} from './types';

// Extended types specific to rules engine
export {
  PricingRule,
  Bundle,
  PricingContext,
  PricingCalculation,
  RuleEvaluationResult,
  RuleValidationError,
  RuleConflict,
  type PricingEngine as IPricingEngine
} from './rules-engine-types';

// Pricing steps types
export {
  PricingStepType,
  BasePricingStep,
  BundleSelectionStep,
  InitializationStep,
  RuleEvaluationStep,
  RuleApplicationStep,
  SubtotalCalculationStep,
  UnusedDaysCalculationStep,
  FinalCalculationStep,
  ProfitValidationStep,
  CompletedStep,
  PricingStep
} from './pricing-steps';

// Action types
export {
  ActionResult,
  PricingState
} from './actions/base';

// Re-export everything from types for backward compatibility
export * from './types';
export * from './rules-engine-types';