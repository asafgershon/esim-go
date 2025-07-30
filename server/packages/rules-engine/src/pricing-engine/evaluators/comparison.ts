import type { ConditionEvaluator } from "../types";

/**
 * Greater than evaluator
 */
export const greaterThan: ConditionEvaluator = (fieldValue, conditionValue) => {
  return Number(fieldValue) > Number(conditionValue);
};

/**
 * Less than evaluator
 */
export const lessThan: ConditionEvaluator = (fieldValue, conditionValue) => {
  return Number(fieldValue) < Number(conditionValue);
};

/**
 * Greater than or equal evaluator
 */
export const greaterThanOrEqual: ConditionEvaluator = (fieldValue, conditionValue) => {
  return Number(fieldValue) >= Number(conditionValue);
};

/**
 * Less than or equal evaluator
 */
export const lessThanOrEqual: ConditionEvaluator = (fieldValue, conditionValue) => {
  return Number(fieldValue) <= Number(conditionValue);
};