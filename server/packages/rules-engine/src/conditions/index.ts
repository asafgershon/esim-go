import { PricingEngineState } from 'src/rules-engine-types';
import type { RuleCondition } from '../generated/types';
import { GenericConditionEvaluator } from './generic';
import { TemporalConditionEvaluator } from './temporal';

export class ConditionEvaluator {
  private genericEvaluator: GenericConditionEvaluator;
  private temporalEvaluator: TemporalConditionEvaluator;
  
  constructor() {
    this.genericEvaluator = new GenericConditionEvaluator();
    this.temporalEvaluator = new TemporalConditionEvaluator();
  }
  
  evaluate(condition: RuleCondition, context: PricingEngineState): boolean {
    // Use temporal evaluator for date-related fields
    if (this.isTemporalCondition(condition)) {
      return this.temporalEvaluator.evaluate(condition, context);
    }
    
    // Use generic evaluator for everything else
    return this.genericEvaluator.evaluate(condition, context);
  }
  
  private isTemporalCondition(condition: RuleCondition): boolean {
    const field = condition.field;
    return field === 'currentDate' || 
           field === 'date' || 
           field.includes('Date') ||
           field === 'validFrom' ||
           field === 'validUntil' ||
           (condition.operator === 'BETWEEN' && Array.isArray(condition.value) && 
            condition.value.length === 2 && 
            this.looksLikeDate(condition.value[0]));
  }
  
  private looksLikeDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}/.test(value);
  }
}

export { BaseConditionEvaluator } from './base';
export { GenericConditionEvaluator } from './generic';
export { TemporalConditionEvaluator } from './temporal';