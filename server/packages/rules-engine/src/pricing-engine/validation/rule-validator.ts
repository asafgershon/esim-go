import type { PricingRule } from "../../rules-engine-types";
import { ValidationError, ErrorFactory } from "../errors";
import type { ValidationResult } from "./input-validator";

/**
 * Rule validator for pricing engine rules
 */
export class RuleValidator {
  private errors: ValidationError[] = [];
  private warnings: string[] = [];
  
  /**
   * Validate a single pricing rule
   */
  validateRule(rule: PricingRule): ValidationResult {
    this.errors = [];
    this.warnings = [];
    
    this.validateBasicFields(rule);
    this.validateConditions(rule);
    this.validateActions(rule);
    this.validatePriority(rule);
    this.validateDates(rule);
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
  
  /**
   * Validate multiple rules for conflicts
   */
  validateRules(rules: PricingRule[]): ValidationResult {
    this.errors = [];
    this.warnings = [];
    
    // Validate individual rules
    rules.forEach(rule => {
      const ruleValidation = this.validateRule(rule);
      this.errors.push(...ruleValidation.errors);
      this.warnings.push(...ruleValidation.warnings);
    });
    
    // Check for conflicts between rules
    this.validateRuleConflicts(rules);
    this.validatePriorityConflicts(rules);
    this.validateCategoryConsistency(rules);
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
  
  /**
   * Validate basic rule fields
   */
  private validateBasicFields(rule: PricingRule): void {
    if (!rule.id) {
      this.addError("Rule ID is required", "id", rule.id, rule.id);
    }
    
    if (!rule.name) {
      this.addError("Rule name is required", "name", rule.name, rule.id);
    }
    
    if (!rule.category) {
      this.addError("Rule category is required", "category", rule.category, rule.id);
    }
    
    if (typeof rule.priority !== 'number') {
      this.addError("Rule priority must be a number", "priority", rule.priority, rule.id);
    }
    
    if (rule.isActive !== undefined && typeof rule.isActive !== 'boolean') {
      this.addError("Rule isActive must be a boolean", "isActive", rule.isActive, rule.id);
    }
  }
  
  /**
   * Validate rule conditions
   */
  private validateConditions(rule: PricingRule): void {
    if (!rule.conditions || !Array.isArray(rule.conditions)) {
      this.addWarning(`Rule ${rule.name} has no conditions - it will always apply`);
      return;
    }
    
    if (rule.conditions.length === 0) {
      this.addWarning(`Rule ${rule.name} has empty conditions array - it will always apply`);
      return;
    }
    
    rule.conditions.forEach((condition, index) => {
      if (!condition.field) {
        this.addError("Condition field is required", `conditions[${index}].field`, condition.field, rule.id);
      }
      
      if (!condition.operator) {
        this.addError("Condition operator is required", `conditions[${index}].operator`, condition.operator, rule.id);
      } else if (!this.isValidOperator(condition.operator)) {
        this.addError("Invalid condition operator", `conditions[${index}].operator`, condition.operator, rule.id);
      }
      
      if (condition.value === undefined || condition.value === null) {
        this.addError("Condition value is required", `conditions[${index}].value`, condition.value, rule.id);
      }
    });
  }
  
  /**
   * Validate rule actions
   */
  private validateActions(rule: PricingRule): void {
    if (!rule.actions || !Array.isArray(rule.actions)) {
      this.addError("Rule actions are required", "actions", rule.actions, rule.id);
      return;
    }
    
    if (rule.actions.length === 0) {
      this.addError("Rule must have at least one action", "actions", rule.actions, rule.id);
      return;
    }
    
    rule.actions.forEach((action, index) => {
      if (!action.type) {
        this.addError("Action type is required", `actions[${index}].type`, action.type, rule.id);
      } else if (!this.isValidActionType(action.type)) {
        this.addError("Invalid action type", `actions[${index}].type`, action.type, rule.id);
      }
      
      if (typeof action.value !== 'number') {
        this.addError("Action value must be a number", `actions[${index}].value`, action.value, rule.id);
      } else {
        this.validateActionValue(action.type, action.value, rule.id);
      }
    });
  }
  
  /**
   * Validate rule priority
   */
  private validatePriority(rule: PricingRule): void {
    if (rule.priority < 0) {
      this.addError("Rule priority must be non-negative", "priority", rule.priority, rule.id);
    }
    
    if (rule.priority > 1000) {
      this.addWarning(`Rule ${rule.name} has very high priority (${rule.priority}) - this may cause unexpected behavior`);
    }
  }
  
  /**
   * Validate rule dates
   */
  private validateDates(rule: PricingRule): void {
    if (rule.validFrom && rule.validUntil) {
      const validFromDate = new Date(rule.validFrom);
      const validUntilDate = new Date(rule.validUntil);
      
      if (validFromDate >= validUntilDate) {
        this.addError("Rule validFrom must be before validUntil", "validFrom", rule.validFrom, rule.id);
      }
    }
    
    if (rule.validUntil) {
      const validUntilDate = new Date(rule.validUntil);
      if (validUntilDate < new Date()) {
        this.addWarning(`Rule ${rule.name} has expired (validUntil: ${rule.validUntil})`);
      }
    }
  }
  
  /**
   * Validate conflicts between rules
   */
  private validateRuleConflicts(rules: PricingRule[]): void {
    const duplicateIds = this.findDuplicateIds(rules);
    duplicateIds.forEach(id => {
      this.addError("Duplicate rule ID found", "id", id);
    });
    
    const duplicateNames = this.findDuplicateNames(rules);
    duplicateNames.forEach(name => {
      this.addWarning(`Duplicate rule name found: ${name}`);
    });
  }
  
  /**
   * Validate priority conflicts
   */
  private validatePriorityConflicts(rules: PricingRule[]): void {
    const categoryGroups = this.groupRulesByCategory(rules);
    
    Object.entries(categoryGroups).forEach(([category, categoryRules]) => {
      const priorities = categoryRules.map(r => r.priority);
      const duplicatePriorities = priorities.filter((p, i) => priorities.indexOf(p) !== i);
      
      if (duplicatePriorities.length > 0) {
        this.addWarning(`Category ${category} has rules with duplicate priorities: ${[...new Set(duplicatePriorities)].join(', ')}`);
      }
    });
  }
  
  /**
   * Validate category consistency
   */
  private validateCategoryConsistency(rules: PricingRule[]): void {
    const validCategories = ['DISCOUNT', 'MARKUP', 'FEE', 'CONSTRAINT'];
    
    rules.forEach(rule => {
      if (rule.category && !validCategories.includes(rule.category.toUpperCase())) {
        this.addWarning(`Rule ${rule.name} has unknown category: ${rule.category}`);
      }
    });
  }
  
  /**
   * Check if operator is valid
   */
  private isValidOperator(operator: string): boolean {
    const validOperators = [
      'EQUALS', 'NOT_EQUALS',
      'GREATER_THAN', 'LESS_THAN',
      'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL',
      'IN', 'NOT_IN'
    ];
    return validOperators.includes(operator);
  }
  
  /**
   * Check if action type is valid
   */
  private isValidActionType(actionType: string): boolean {
    const validActionTypes = [
      'ADD_MARKUP', 'APPLY_DISCOUNT_PERCENTAGE', 'APPLY_DISCOUNT_FIXED',
      'SET_PROCESSING_RATE', 'ADD_PROCESSING_FEE',
      'SET_MINIMUM_PROFIT', 'SET_MINIMUM_PRICE'
    ];
    return validActionTypes.includes(actionType);
  }
  
  /**
   * Validate action value based on action type
   */
  private validateActionValue(actionType: string, value: number, ruleId: string): void {
    switch (actionType) {
      case 'APPLY_DISCOUNT_PERCENTAGE':
        if (value < 0 || value > 100) {
          this.addError("Discount percentage must be between 0 and 100", "actions.value", value, ruleId);
        }
        break;
      case 'SET_PROCESSING_RATE':
        if (value < 0 || value > 100) {
          this.addError("Processing rate must be between 0 and 100", "actions.value", value, ruleId);
        }
        break;
      case 'ADD_MARKUP':
        if (value < 0) {
          this.addError("Markup value must be non-negative", "actions.value", value, ruleId);
        }
        break;
      case 'APPLY_DISCOUNT_FIXED':
        if (value < 0) {
          this.addError("Fixed discount must be non-negative", "actions.value", value, ruleId);
        }
        break;
    }
  }
  
  /**
   * Find duplicate rule IDs
   */
  private findDuplicateIds(rules: PricingRule[]): string[] {
    const ids = rules.map(r => r.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  }
  
  /**
   * Find duplicate rule names
   */
  private findDuplicateNames(rules: PricingRule[]): string[] {
    const names = rules.map(r => r.name);
    return names.filter((name, index) => names.indexOf(name) !== index);
  }
  
  /**
   * Group rules by category
   */
  private groupRulesByCategory(rules: PricingRule[]): Record<string, PricingRule[]> {
    return rules.reduce((groups, rule) => {
      const category = rule.category || 'UNKNOWN';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(rule);
      return groups;
    }, {} as Record<string, PricingRule[]>);
  }
  
  /**
   * Add validation error
   */
  private addError(message: string, field: string, value: any, ruleId?: string): void {
    this.errors.push(ErrorFactory.validation(message, field, value, ruleId));
  }
  
  /**
   * Add validation warning
   */
  private addWarning(message: string): void {
    this.warnings.push(message);
  }
}