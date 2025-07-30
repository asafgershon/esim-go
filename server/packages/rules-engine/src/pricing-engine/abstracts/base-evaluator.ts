import type { PricingEngineState, PricingRule } from "../../rules-engine-types";
import type { RuleCondition } from "../types";

/**
 * Abstract base class for condition evaluators
 */
export abstract class BaseEvaluator {
  abstract readonly operator: string;
  
  /**
   * Evaluate a condition against the current state
   */
  abstract evaluate(fieldValue: any, conditionValue: any, state: PricingEngineState): boolean;
  
  /**
   * Validate that the condition is properly formed
   */
  protected validateCondition(condition: RuleCondition): void {
    if (!condition.field) {
      throw new Error(`Condition field is required for operator ${this.operator}`);
    }
    
    if (condition.value === undefined || condition.value === null) {
      throw new Error(`Condition value is required for operator ${this.operator}`);
    }
  }
  
  /**
   * Extract field value from state with proper null handling
   */
  protected getFieldValue(field: string, state: PricingEngineState): any {
    const parts = field.split('.');
    let value = state as any;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Check if this evaluator can handle the given operator
   */
  canHandle(operator: string): boolean {
    return this.operator === operator;
  }
}