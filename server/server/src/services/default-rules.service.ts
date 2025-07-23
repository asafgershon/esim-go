import type { CreatePricingRuleInput, RuleType, ConditionOperator, ActionType } from '../types';
import { createLogger } from '../lib/logger';

const logger = createLogger({ 
  component: 'DefaultRulesService',
  operationType: 'rule-initialization'
});

/**
 * Service to create default system rules when none exist
 * This replaces the hardcoded values with configurable rules
 */
export class DefaultRulesService {
  
  /**
   * Get default system rules that replace hardcoded values
   */
  static getDefaultSystemRules(): CreatePricingRuleInput[] {
    return [
      // Default processing rate for Israeli cards
      {
        type: RuleType.SystemProcessing,
        name: 'Israeli Card Processing Rate',
        description: 'Default processing rate for Israeli payment cards',
        conditions: [
          {
            field: 'customer.paymentMethod',
            operator: ConditionOperator.Equals,
            value: 'israeli_card'
          }
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.014 // 1.4%
          }
        ],
        priority: 100,
        isActive: true
      },
      
      // Default processing rate for foreign cards
      {
        type: RuleType.SystemProcessing,
        name: 'Foreign Card Processing Rate',
        description: 'Default processing rate for foreign payment cards',
        conditions: [
          {
            field: 'customer.paymentMethod',
            operator: ConditionOperator.Equals,
            value: 'foreign_card'
          }
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.045 // 4.5%
          }
        ],
        priority: 100,
        isActive: true
      },
      
      // Default processing rate for Bit
      {
        type: RuleType.SystemProcessing,
        name: 'Bit Processing Rate',
        description: 'Processing rate for Bit payments',
        conditions: [
          {
            field: 'customer.paymentMethod',
            operator: ConditionOperator.Equals,
            value: 'bit'
          }
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.014 // 1.4%
          }
        ],
        priority: 100,
        isActive: true
      },
      
      // Default processing rate for Amex
      {
        type: RuleType.SystemProcessing,
        name: 'Amex Processing Rate',
        description: 'Processing rate for American Express',
        conditions: [
          {
            field: 'customer.paymentMethod',
            operator: ConditionOperator.Equals,
            value: 'amex'
          }
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.035 // 3.5%
          }
        ],
        priority: 100,
        isActive: true
      },
      
      // Default processing rate for Diners
      {
        type: RuleType.SystemProcessing,
        name: 'Diners Processing Rate', 
        description: 'Processing rate for Diners Club',
        conditions: [
          {
            field: 'customer.paymentMethod',
            operator: ConditionOperator.Equals,
            value: 'diners'
          }
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.035 // 3.5%
          }
        ],
        priority: 100,
        isActive: true
      },
      
      // Default minimum price rule
      {
        type: RuleType.SystemMinimumPrice,
        name: 'Minimum Price Floor',
        description: 'Ensures prices never go below $0.01',
        conditions: [
          {
            field: 'bundle.id',
            operator: ConditionOperator.NotEquals,
            value: '' // Apply to all bundles
          }
        ],
        actions: [
          {
            type: ActionType.SetMinimumPrice,
            value: 0.01
          }
        ],
        priority: 1000, // Highest priority
        isActive: true
      },
      
      // Default minimum profit rule
      {
        type: RuleType.BusinessMinimumProfit,
        name: 'Minimum Profit Margin',
        description: 'Ensures minimum profit of $1.50 per bundle',
        conditions: [
          {
            field: 'bundle.id',
            operator: ConditionOperator.NotEquals,
            value: '' // Apply to all bundles
          }
        ],
        actions: [
          {
            type: ActionType.SetMinimumProfit,
            value: 1.50
          }
        ],
        priority: 900,
        isActive: true
      },
      
      // Default unused days discount configuration
      {
        type: RuleType.BusinessDiscount,
        name: 'Unused Days Discount Rate',
        description: 'Default discount rate per unused day (10%)',
        conditions: [
          {
            field: 'bundle.id',
            operator: ConditionOperator.NotEquals,
            value: '' // Apply to all bundles
          }
        ],
        actions: [
          {
            type: ActionType.SetDiscountPerUnusedDay,
            value: 0.10 // 10% per day
          }
        ],
        priority: 200,
        isActive: true
      }
    ];
  }
  
  /**
   * Create system rules to replace hardcoded values
   */
  static createSystemRulesFromDefaults(): CreatePricingRuleInput[] {
    const rules = this.getDefaultSystemRules();
    
    logger.info('Created default system rules', {
      ruleCount: rules.length,
      ruleTypes: rules.map(r => r.type),
      operationType: 'rule-initialization'
    });
    
    return rules;
  }
}