import type { RuleCondition } from '../../types';
import type { PricingContext } from '../types';
import { BaseConditionEvaluator } from './base';

export class TemporalConditionEvaluator extends BaseConditionEvaluator {
  evaluate(condition: RuleCondition, context: PricingContext): boolean {
    const currentDate = context.currentDate || new Date();
    
    switch (condition.field) {
      case 'currentDate':
      case 'date':
        return this.evaluateDateCondition(condition, currentDate);
      
      default:
        // Check if it's a date field by trying to parse it
        const fieldValue = this.getFieldValue(condition.field, context);
        if (fieldValue && this.isDateString(fieldValue)) {
          return this.evaluateDateCondition(condition, new Date(fieldValue));
        }
        
        return this.evaluateOperator(condition.operator, fieldValue, condition.value);
    }
  }
  
  private evaluateDateCondition(condition: RuleCondition, date: Date): boolean {
    switch (condition.operator) {
      case 'BETWEEN':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          const [startStr, endStr] = condition.value;
          const start = new Date(startStr);
          const end = new Date(endStr);
          return date >= start && date <= end;
        }
        return false;
      
      case 'GREATER_THAN':
        return date > new Date(condition.value);
      
      case 'LESS_THAN':
        return date < new Date(condition.value);
      
      case 'EQUALS':
        // For date equality, compare only the date part (not time)
        const compareDate = new Date(condition.value);
        return date.toDateString() === compareDate.toDateString();
      
      case 'NOT_EQUALS':
        const notEqualDate = new Date(condition.value);
        return date.toDateString() !== notEqualDate.toDateString();
      
      default:
        return false;
    }
  }
  
  private isDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    // Check for ISO date format
    if (value.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    
    return false;
  }
}