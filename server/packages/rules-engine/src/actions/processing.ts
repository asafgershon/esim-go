import type { RuleAction } from '../types';
import { BaseActionExecutor, type ActionResult, type PricingState } from './base';

export class ProcessingActionExecutor extends BaseActionExecutor {
  execute(action: RuleAction, state: PricingState, ruleName: string): ActionResult {
    switch (action.type) {
      case 'SET_PROCESSING_RATE':
        return this.setProcessingRate(action, state);
      
      default:
        throw new Error(`Unknown processing action type: ${action.type}`);
    }
  }
  
  private setProcessingRate(action: RuleAction, state: PricingState): ActionResult {
    const previousRate = state.processingRate;
    
    // Processing rate is stored as percentage in action but as decimal in state
    state.processingRate = action.value / 100;
    
    return {
      type: action.type,
      value: action.value,
      appliedValue: state.processingRate,
      metadata: {
        previousRate: previousRate * 100,
        newRate: action.value,
        decimal: state.processingRate
      }
    };
  }
}