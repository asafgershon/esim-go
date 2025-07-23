import type { RuleAction } from '../../types';
import { BaseActionExecutor, type ActionResult, type PricingState } from './base';

export class SystemActionExecutor extends BaseActionExecutor {
  execute(action: RuleAction, state: PricingState, ruleName: string): ActionResult {
    switch (action.type) {
      case 'SET_MINIMUM_PRICE':
        // This doesn't modify state directly, it's used by the engine for validation
        return {
          type: action.type,
          value: action.value,
          appliedValue: action.value,
          metadata: { minimumPrice: action.value }
        };
        
      case 'SET_MINIMUM_PROFIT':
        // This doesn't modify state directly, it's used by the engine for validation
        return {
          type: action.type,
          value: action.value,
          appliedValue: action.value,
          metadata: { minimumProfit: action.value }
        };
        
      default:
        throw new Error(`Unsupported system action type: ${action.type}`);
    }
  }
}