import type { PricingRule } from "../../rules-engine-types";
import type { RuleFilter } from "../types";

/**
 * Filter rules by category and active status
 */
export const filterRulesByCategory: RuleFilter = (rules, category) => {
  return rules.filter(
    rule =>
      (rule.isActive === undefined || rule.isActive === true) &&
      rule.category?.toUpperCase() === category.toUpperCase()
  );
};

/**
 * Sort rules by priority (higher priority first)
 */
export const sortRulesByPriority = (rules: PricingRule[]): PricingRule[] => {
  return [...rules].sort((a, b) => b.priority - a.priority);
};

/**
 * Get all unique rule categories from a set of rules
 */
export const getUniqueCategories = (rules: PricingRule[]): string[] => {
  const categories = rules
    .map(rule => rule.category)
    .filter(Boolean) as string[];
  return [...new Set(categories)];
};

/**
 * Extract applied rule IDs from pipeline steps
 */
export const extractAppliedRuleIds = (
  steps: Array<{ appliedRules?: string[] }>
): string[] => {
  return steps.flatMap(step => step.appliedRules || []);
};

/**
 * Find rules that were applied based on their IDs
 */
export const getAppliedRules = (
  allRules: PricingRule[],
  appliedRuleIds: string[]
): PricingRule[] => {
  return allRules.filter(rule => appliedRuleIds.includes(rule.id));
};