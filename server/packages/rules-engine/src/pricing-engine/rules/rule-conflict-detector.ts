import type { PricingRule } from "../../rules-engine-types";
import { ValidationError, ErrorFactory } from "../errors";

/**
 * Rule conflict types
 */
export enum ConflictType {
  DUPLICATE_ID = "DUPLICATE_ID",
  PRIORITY_CONFLICT = "PRIORITY_CONFLICT",
  CONTRADICTORY_ACTIONS = "CONTRADICTORY_ACTIONS",
  OVERLAPPING_CONDITIONS = "OVERLAPPING_CONDITIONS",
  CIRCULAR_DEPENDENCY = "CIRCULAR_DEPENDENCY",
}

/**
 * Rule conflict interface
 */
export interface RuleConflict {
  type: ConflictType;
  severity: "ERROR" | "WARNING" | "INFO";
  description: string;
  affectedRules: string[];
  suggestedResolution?: string;
  context?: Record<string, any>;
}

/**
 * Rule conflict detection result
 */
export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: RuleConflict[];
  summary: {
    totalConflicts: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

/**
 * Rule conflict detector
 */
export class RuleConflictDetector {
  private rules: PricingRule[] = [];
  private conflicts: RuleConflict[] = [];
  
  /**
   * Detect conflicts in a set of rules
   */
  detectConflicts(rules: PricingRule[]): ConflictDetectionResult {
    this.rules = rules;
    this.conflicts = [];
    
    // Run all conflict detection checks
    this.detectDuplicateIds();
    this.detectPriorityConflicts();
    this.detectContradictoryActions();
    this.detectOverlappingConditions();
    this.detectCircularDependencies();
    
    // Generate summary
    const summary = this.generateSummary();
    
    return {
      hasConflicts: this.conflicts.length > 0,
      conflicts: this.conflicts,
      summary,
    };
  }
  
  /**
   * Detect duplicate rule IDs
   */
  private detectDuplicateIds(): void {
    const idMap = new Map<string, PricingRule[]>();
    
    this.rules.forEach(rule => {
      if (!idMap.has(rule.id)) {
        idMap.set(rule.id, []);
      }
      idMap.get(rule.id)!.push(rule);
    });
    
    idMap.forEach((rulesWithId, id) => {
      if (rulesWithId.length > 1) {
        this.conflicts.push({
          type: ConflictType.DUPLICATE_ID,
          severity: "ERROR",
          description: `Multiple rules found with ID '${id}'`,
          affectedRules: rulesWithId.map(r => r.id),
          suggestedResolution: "Ensure each rule has a unique ID",
          context: {
            duplicateCount: rulesWithId.length,
            ruleNames: rulesWithId.map(r => r.name),
          },
        });
      }
    });
  }
  
  /**
   * Detect priority conflicts within categories
   */
  private detectPriorityConflicts(): void {
    const categoryGroups = this.groupRulesByCategory();
    
    Object.entries(categoryGroups).forEach(([category, categoryRules]) => {
      const priorityMap = new Map<number, PricingRule[]>();
      
      categoryRules.forEach(rule => {
        if (!priorityMap.has(rule.priority)) {
          priorityMap.set(rule.priority, []);
        }
        priorityMap.get(rule.priority)!.push(rule);
      });
      
      priorityMap.forEach((rulesWithPriority, priority) => {
        if (rulesWithPriority.length > 1) {
          this.conflicts.push({
            type: ConflictType.PRIORITY_CONFLICT,
            severity: "WARNING",
            description: `Multiple ${category} rules have the same priority ${priority}`,
            affectedRules: rulesWithPriority.map(r => r.id),
            suggestedResolution: "Assign unique priorities within each category to ensure predictable execution order",
            context: {
              category,
              priority,
              ruleCount: rulesWithPriority.length,
              ruleNames: rulesWithPriority.map(r => r.name),
            },
          });
        }
      });
    });
  }
  
  /**
   * Detect contradictory actions between rules
   */
  private detectContradictoryActions(): void {
    const categoryGroups = this.groupRulesByCategory();
    
    Object.entries(categoryGroups).forEach(([category, categoryRules]) => {
      // Look for rules that might contradict each other
      for (let i = 0; i < categoryRules.length; i++) {
        for (let j = i + 1; j < categoryRules.length; j++) {
          const rule1 = categoryRules[i];
          const rule2 = categoryRules[j];
          
          const contradiction = this.checkActionContradiction(rule1, rule2);
          if (contradiction) {
            this.conflicts.push({
              type: ConflictType.CONTRADICTORY_ACTIONS,
              severity: "WARNING",
              description: contradiction.description,
              affectedRules: [rule1.id, rule2.id],
              suggestedResolution: contradiction.resolution,
              context: {
                category,
                rule1Name: rule1.name,
                rule2Name: rule2.name,
                actions1: rule1.actions,
                actions2: rule2.actions,
              },
            });
          }
        }
      }
    });
  }
  
  /**
   * Detect overlapping conditions that might cause unexpected behavior
   */
  private detectOverlappingConditions(): void {
    const categoryGroups = this.groupRulesByCategory();
    
    Object.entries(categoryGroups).forEach(([category, categoryRules]) => {
      // Look for rules with very similar or overlapping conditions
      for (let i = 0; i < categoryRules.length; i++) {
        for (let j = i + 1; j < categoryRules.length; j++) {
          const rule1 = categoryRules[i];
          const rule2 = categoryRules[j];
          
          const overlap = this.checkConditionOverlap(rule1, rule2);
          if (overlap.hasOverlap) {
            this.conflicts.push({
              type: ConflictType.OVERLAPPING_CONDITIONS,
              severity: "INFO",
              description: `Rules '${rule1.name}' and '${rule2.name}' have overlapping conditions`,
              affectedRules: [rule1.id, rule2.id],
              suggestedResolution: "Review rule conditions to ensure they target different scenarios",
              context: {
                category,
                overlapPercentage: overlap.percentage,
                overlappingFields: overlap.fields,
              },
            });
          }
        }
      }
    });
  }
  
  /**
   * Detect potential circular dependencies
   */
  private detectCircularDependencies(): void {
    // For now, this is a placeholder for more advanced dependency analysis
    // In a more complex system, this would analyze rule dependencies and execution order
    
    const rulesByCategory = this.groupRulesByCategory();
    
    // Check for rules that might create circular effects
    Object.entries(rulesByCategory).forEach(([category, rules]) => {
      if (rules.length > 10) {
        this.conflicts.push({
          type: ConflictType.CIRCULAR_DEPENDENCY,
          severity: "INFO",
          description: `Category '${category}' contains many rules (${rules.length}) which may create complex interactions`,
          affectedRules: rules.map(r => r.id),
          suggestedResolution: "Consider breaking down complex rule sets into smaller, more manageable groups",
          context: {
            category,
            ruleCount: rules.length,
          },
        });
      }
    });
  }
  
  /**
   * Check if two rules have contradictory actions
   */
  private checkActionContradiction(rule1: PricingRule, rule2: PricingRule): {
    description: string;
    resolution: string;
  } | null {
    const actions1 = rule1.actions || [];
    const actions2 = rule2.actions || [];
    
    // Check for opposite discount/markup actions
    const hasDiscount1 = actions1.some(a => a.type.includes("DISCOUNT"));
    const hasMarkup1 = actions1.some(a => a.type.includes("MARKUP"));
    const hasDiscount2 = actions2.some(a => a.type.includes("DISCOUNT"));
    const hasMarkup2 = actions2.some(a => a.type.includes("MARKUP"));
    
    if ((hasDiscount1 && hasMarkup2) || (hasMarkup1 && hasDiscount2)) {
      return {
        description: `Rule '${rule1.name}' applies ${hasDiscount1 ? 'discounts' : 'markups'} while rule '${rule2.name}' applies ${hasDiscount2 ? 'discounts' : 'markups'}`,
        resolution: "Ensure rule priorities are set correctly to achieve desired behavior",
      };
    }
    
    // Check for conflicting constraint settings
    const hasMinPrice1 = actions1.some(a => a.type === "SET_MINIMUM_PRICE");
    const hasMinPrice2 = actions2.some(a => a.type === "SET_MINIMUM_PRICE");
    
    if (hasMinPrice1 && hasMinPrice2) {
      const minPrice1 = actions1.find(a => a.type === "SET_MINIMUM_PRICE")?.value || 0;
      const minPrice2 = actions2.find(a => a.type === "SET_MINIMUM_PRICE")?.value || 0;
      
      if (minPrice1 !== minPrice2) {
        return {
          description: `Rules set different minimum prices: '${rule1.name}' sets ${minPrice1}, '${rule2.name}' sets ${minPrice2}`,
          resolution: "Use rule priorities to determine which minimum price should take precedence",
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check if two rules have overlapping conditions
   */
  private checkConditionOverlap(rule1: PricingRule, rule2: PricingRule): {
    hasOverlap: boolean;
    percentage: number;
    fields: string[];
  } {
    const conditions1 = rule1.conditions || [];
    const conditions2 = rule2.conditions || [];
    
    if (conditions1.length === 0 || conditions2.length === 0) {
      return { hasOverlap: false, percentage: 0, fields: [] };
    }
    
    const fields1 = new Set(conditions1.map(c => c.field));
    const fields2 = new Set(conditions2.map(c => c.field));
    
    const commonFields = [...fields1].filter(field => fields2.has(field));
    const totalUniqueFields = new Set([...fields1, ...fields2]).size;
    
    const overlapPercentage = (commonFields.length / totalUniqueFields) * 100;
    
    return {
      hasOverlap: overlapPercentage > 50, // Consider >50% overlap as significant
      percentage: overlapPercentage,
      fields: commonFields,
    };
  }
  
  /**
   * Group rules by category
   */
  private groupRulesByCategory(): Record<string, PricingRule[]> {
    return this.rules.reduce((groups, rule) => {
      const category = rule.category || 'UNKNOWN';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(rule);
      return groups;
    }, {} as Record<string, PricingRule[]>);
  }
  
  /**
   * Generate conflict summary
   */
  private generateSummary(): ConflictDetectionResult['summary'] {
    const errorCount = this.conflicts.filter(c => c.severity === "ERROR").length;
    const warningCount = this.conflicts.filter(c => c.severity === "WARNING").length;
    const infoCount = this.conflicts.filter(c => c.severity === "INFO").length;
    
    return {
      totalConflicts: this.conflicts.length,
      errorCount,
      warningCount,
      infoCount,
    };
  }
}