import type { ActionType, RuleAction } from '../generated/types';
import { BaseActionExecutor, type ActionResult, type PricingState } from './base';
import { DiscountActionExecutor } from './discount';
import { MarkupActionExecutor } from './markup';
import { ProcessingActionExecutor } from './processing';
import { SystemActionExecutor } from './system';

export class ActionExecutor {
  private executors: Map<string, BaseActionExecutor> = new Map();
  
  constructor() {
    const discountExecutor = new DiscountActionExecutor();
    const markupExecutor = new MarkupActionExecutor();
    const processingExecutor = new ProcessingActionExecutor();
    const systemExecutor = new SystemActionExecutor();
    
    // Register executors for different action types
    this.executors.set('APPLY_DISCOUNT_PERCENTAGE', discountExecutor);
    this.executors.set('APPLY_FIXED_DISCOUNT', discountExecutor);
    this.executors.set('SET_DISCOUNT_PER_UNUSED_DAY', discountExecutor);
    this.executors.set('ADD_MARKUP', markupExecutor);
    this.executors.set('SET_PROCESSING_RATE', processingExecutor);
    this.executors.set('SET_MINIMUM_PRICE', systemExecutor);
    this.executors.set('SET_MINIMUM_PROFIT', systemExecutor);
  }
  
  execute(action: RuleAction, state: PricingState, ruleName: string): ActionResult {
    const executor = this.executors.get(action.type);
    
    if (!executor) {
      throw new Error(`No executor found for action type: ${action.type}`);
    }
    
    return executor.execute(action, state, ruleName);
  }
}

export { BaseActionExecutor, type ActionResult, type PricingState } from './base';
export { DiscountActionExecutor } from './discount';
export { MarkupActionExecutor } from './markup';
export { ProcessingActionExecutor } from './processing';
export { SystemActionExecutor } from './system';