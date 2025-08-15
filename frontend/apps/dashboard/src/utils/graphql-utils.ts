/**
 * Utility functions for GraphQL operations
 */

/**
 * Recursively removes __typename fields from Apollo Client cache objects
 * This is needed when passing objects from query results to mutations
 */
export function stripTypename<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(stripTypename) as T;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key !== '__typename') {
        cleaned[key] = stripTypename(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Specifically strips __typename from RuleCondition objects
 */
export function cleanRuleConditions(conditions: any[]): any[] {
  return conditions.map(condition => ({
    field: condition.field,
    operator: condition.operator,
    value: condition.value,
    type: condition.type || null,
  }));
}

/**
 * Specifically strips __typename from RuleAction objects  
 */
export function cleanRuleActions(actions: any[]): any[] {
  return actions.map(action => ({
    type: action.type,
    value: action.value,
    metadata: action.metadata || null,
  }));
}

/**
 * Cleans a complete pricing rule object for mutation input
 */
export function cleanPricingRuleForMutation(rule: any): any {
  return {
    name: rule.name,
    description: rule.description,
    category: rule.category,
    conditions: cleanRuleConditions(rule.conditions || []),
    actions: cleanRuleActions(rule.actions || []),
    priority: rule.priority,
    isActive: rule.isActive,
    validFrom: rule.validFrom,
    validUntil: rule.validUntil,
  };
}