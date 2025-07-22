import type { RuleAction } from '../../types';
import { BaseActionExecutor, type ActionResult, type PricingState } from './base';

export class MarkupActionExecutor extends BaseActionExecutor {
  execute(action: RuleAction, state: PricingState, ruleName: string): ActionResult {
    switch (action.type) {
      case 'ADD_MARKUP':
        return this.addMarkup(action, state);
      
      default:
        throw new Error(`Unknown markup action type: ${action.type}`);
    }
  }
  
  private addMarkup(action: RuleAction, state: PricingState): ActionResult {
    // Add markup to the existing markup
    state.markup += action.value;
    
    // Recalculate subtotal
    state.subtotal = state.baseCost + state.markup;
    
    return {
      type: action.type,
      value: action.value,
      appliedValue: action.value,
      metadata: {
        previousMarkup: state.markup - action.value,
        newMarkup: state.markup,
        newSubtotal: state.subtotal
      }
    };
  }
}