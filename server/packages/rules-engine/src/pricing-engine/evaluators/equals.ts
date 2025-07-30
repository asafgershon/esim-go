import type { ConditionEvaluator } from "../types";

/**
 * Normalize group name for flexible matching
 * Removes quotes, spaces, hyphens, commas and converts to lowercase
 */
const normalizeGroupName = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/["\s,\-]+/g, "")
    .trim();
};

/**
 * Check if a value represents a group field and should use flexible matching
 */
const isGroupValue = (value: any): boolean => {
  return typeof value === "string" && 
    (value.toLowerCase().includes("group") || 
     value.toLowerCase().includes("bundle"));
};

/**
 * Equals evaluator with special handling for group fields
 */
export const equals: ConditionEvaluator = (fieldValue, conditionValue) => {
  // Special handling for group fields with normalization
  if (typeof fieldValue === "string" && typeof conditionValue === "string") {
    if (isGroupValue(fieldValue) || isGroupValue(conditionValue)) {
      return normalizeGroupName(fieldValue) === normalizeGroupName(conditionValue);
    }
  }
  
  return fieldValue === conditionValue;
};

/**
 * Not equals evaluator with special handling for group fields
 */
export const notEquals: ConditionEvaluator = (fieldValue, conditionValue) => {
  return !equals(fieldValue, conditionValue);
};