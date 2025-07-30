import type { ConditionEvaluator } from "../types";
import { equals } from "./equals";

/**
 * In array evaluator with flexible matching for group fields
 */
export const inArray: ConditionEvaluator = (fieldValue, conditionValue) => {
  if (!Array.isArray(conditionValue)) {
    return false;
  }
  
  // Use flexible matching for each array element
  return conditionValue.some(value => equals(fieldValue, value));
};

/**
 * Not in array evaluator with flexible matching for group fields
 */
export const notInArray: ConditionEvaluator = (fieldValue, conditionValue) => {
  if (!Array.isArray(conditionValue)) {
    return true;
  }
  
  // Use flexible matching for each array element
  return !conditionValue.some(value => equals(fieldValue, value));
};