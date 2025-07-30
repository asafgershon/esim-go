import type { ConditionEvaluator } from "../types";

/**
 * Normalize group name for flexible matching
 * Removes quotes, spaces, hyphens, commas and converts to lowercase
 */
export const normalizeGroupName = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/["\s,\-]+/g, "")
    .trim();
};

/**
 * Equals evaluator with special handling for group fields
 */
export const equals: ConditionEvaluator = (fieldValue, conditionValue) => {
  return fieldValue === conditionValue;
};

/**
 * Not equals evaluator with special handling for group fields
 */
export const notEquals: ConditionEvaluator = (fieldValue, conditionValue) => {
  return !equals(fieldValue, conditionValue);
};