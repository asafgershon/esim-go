import type { Draft } from "immer";
import type { PricingEngineState } from "../../rules-engine-types";
import type { RuleAction } from "../types";

/**
 * Abstract base class for action applicators
 */
export abstract class BaseApplicator {
  abstract readonly actionType: string;
  
  /**
   * Apply the action to the state draft
   */
  abstract apply(draft: Draft<PricingEngineState>, value: number, context?: any): void;
  
  /**
   * Validate that the action is properly formed
   */
  protected validateAction(action: RuleAction): void {
    if (!action.type) {
      throw new Error("Action type is required");
    }
    
    if (typeof action.value !== 'number') {
      throw new Error(`Action value must be a number for type ${action.type}`);
    }
    
    if (action.type !== this.actionType) {
      throw new Error(`Cannot handle action type ${action.type}, expected ${this.actionType}`);
    }
  }
  
  /**
   * Safely update a nested field in the draft
   */
  protected setNestedValue(draft: Draft<PricingEngineState>, path: string, value: any): void {
    const parts = path.split('.');
    let current = draft as any;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  /**
   * Safely get a nested value from the draft
   */
  protected getNestedValue(draft: Draft<PricingEngineState>, path: string): any {
    const parts = path.split('.');
    let current = draft as any;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Check if this applicator can handle the given action type
   */
  canHandle(actionType: string): boolean {
    return this.actionType === actionType;
  }
  
  /**
   * Validate numerical constraints (min/max values)
   */
  protected validateNumericConstraints(value: number, min?: number, max?: number): void {
    if (min !== undefined && value < min) {
      throw new Error(`Value ${value} is below minimum ${min} for action ${this.actionType}`);
    }
    
    if (max !== undefined && value > max) {
      throw new Error(`Value ${value} is above maximum ${max} for action ${this.actionType}`);
    }
  }
}