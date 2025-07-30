import * as dot from "dot-object";
import type { ConditionEvaluator, RuleCondition } from "../types";
import type { PricingEngineState } from "../../rules-engine-types";
import { equals, notEquals } from "./equals";
import { greaterThan, lessThan, greaterThanOrEqual, lessThanOrEqual } from "./comparison";
import { inArray, notInArray } from "./array";

/**
 * Map of operator names to evaluator functions
 */
const evaluatorMap: Record<string, ConditionEvaluator> = {
  EQUALS: equals,
  NOT_EQUALS: notEquals,
  GREATER_THAN: greaterThan,
  LESS_THAN: lessThan,
  GREATER_THAN_OR_EQUAL: greaterThanOrEqual,
  LESS_THAN_OR_EQUAL: lessThanOrEqual,
  IN: inArray,
  NOT_IN: notInArray,
};

/**
 * Evaluate a single condition
 */
export const evaluateCondition = (
  condition: RuleCondition,
  state: PricingEngineState
): boolean => {
  const fieldValue = dot.pick(condition.field, state);
  const evaluator = evaluatorMap[condition.operator];
  
  if (!evaluator) {
    // Unknown operator, default to true
    return true;
  }
  
  return evaluator(fieldValue, condition.value);
};

/**
 * Evaluate all conditions (AND logic - all must pass)
 */
export const evaluateConditions = (
  conditions: RuleCondition[],
  state: PricingEngineState
): boolean => {
  // If no conditions, rule always applies
  if (!conditions || conditions.length === 0) {
    return true;
  }
  
  // All conditions must pass
  return conditions.every(condition => evaluateCondition(condition, state));
};

/**
 * Check if a field name is group-related and should use flexible matching
 */
export const isGroupField = (fieldName: string): boolean => {
  return fieldName.toLowerCase().includes("group");
};