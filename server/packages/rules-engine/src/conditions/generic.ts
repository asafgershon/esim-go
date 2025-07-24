import type { RuleCondition } from '../types';
import type { PricingContext } from '../rules-engine-types';
import { getDeepValue } from '@esim-go/utils';
import { BaseConditionEvaluator } from './base';

export class GenericConditionEvaluator extends BaseConditionEvaluator {
  evaluate(condition: RuleCondition, context: PricingContext): boolean {
    // Handle special cases for common shortcuts
    const contextWithShortcuts = this.addContextShortcuts(context);
    
    // Get the value using deep path access
    const fieldValue = getDeepValue(contextWithShortcuts as any, condition.field);
    
    return this.evaluateOperator(condition.operator, fieldValue, condition.value);
  }
  
  private addContextShortcuts(context: PricingContext): any {
    return {
      ...context,
      // Direct field shortcuts
      country: context.bundle?.countryId,
      countryName: context.bundle?.countryName,
      region: context.bundle?.region,
      regionName: context.bundle?.region, // Using region since regionName doesn't exist
      bundleGroup: context.bundle?.group,
      duration: context.bundle?.duration,
      isUnlimited: context.bundle?.isUnlimited,
      
      // User shortcuts
      isFirstPurchase: context.user?.purchaseCount === 0 || context.user?.isFirstPurchase,
      isNewUser: context.user?.isNew,
      userSegment: context.user?.segment,
      
      // Date shortcuts
      currentDate: context.currentDate || new Date(),
      today: new Date().toISOString().split('T')[0],
    };
  }
}