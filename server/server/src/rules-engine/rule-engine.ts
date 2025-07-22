import type { 
  PricingRule, 
  RuleType,
  PricingRuleCalculation,
  AppliedRule,
  DiscountApplication,
  CreatePricingRuleInput
} from '../types';
import type { PricingContext } from './types';
import { 
  PricingStepType,
  type PricingStep,
  type InitializationStep,
  type RuleEvaluationStep,
  type RuleApplicationStep,
  type SubtotalCalculationStep,
  type UnusedDaysCalculationStep,
  type FinalCalculationStep,
  type ProfitValidationStep,
  type CompletedStep
} from './pricing-steps';
import { ConditionEvaluator } from './conditions';
import { ActionExecutor, type PricingState } from './actions';
import { createLogger } from '../lib/logger';

export class PricingRuleEngine {
  private rules: PricingRule[] = [];
  private systemRules: PricingRule[] = [];
  private businessRules: PricingRule[] = [];
  private conditionEvaluator: ConditionEvaluator;
  private actionExecutor: ActionExecutor;
  private logger = createLogger({ 
    component: 'PricingRuleEngine',
    operationType: 'rule-evaluation'
  });

  constructor() {
    this.conditionEvaluator = new ConditionEvaluator();
    this.actionExecutor = new ActionExecutor();
  }

  addRule(rule: PricingRule | CreatePricingRuleInput): this {
    const pricingRule = this.ensurePricingRule(rule);
    this.rules.push(pricingRule);
    this.categorizeRule(pricingRule);
    this.sortRules();
    return this;
  }

  addRules(rules: (PricingRule | CreatePricingRuleInput)[]): this {
    rules.forEach(rule => this.addRule(rule));
    return this;
  }

  addSystemRules(rules: (PricingRule | CreatePricingRuleInput)[]): this {
    rules.forEach(rule => {
      // Convert CreatePricingRuleInput to PricingRule if needed
      const pricingRule: PricingRule = this.ensurePricingRule(rule);
      pricingRule.isEditable = false;
      this.addRule(pricingRule);
    });
    return this;
  }

  private ensurePricingRule(rule: PricingRule | CreatePricingRuleInput): PricingRule {
    if ('id' in rule && 'createdAt' in rule) {
      return rule as PricingRule;
    }
    
    // Convert CreatePricingRuleInput to PricingRule
    const input = rule as CreatePricingRuleInput;
    const now = new Date().toISOString();
    return {
      __typename: 'PricingRule' as const,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: input.type,
      name: input.name,
      description: input.description || null,
      conditions: input.conditions,
      actions: input.actions,
      priority: input.priority,
      isActive: input.isActive ?? true,
      isEditable: true,
      validFrom: input.validFrom || null,
      validUntil: input.validUntil || null,
      createdBy: 'system',
      createdAt: now,
      updatedAt: now
    };
  }

  async *calculatePriceSteps(context: PricingContext): AsyncGenerator<PricingStep, PricingRuleCalculation, undefined> {
    this.logger.info('Starting price calculation', {
      bundleId: context.bundle.id,
      countryId: context.bundle.countryId,
      duration: context.bundle.duration,
      operationType: 'price-calculation'
    });

    // Yield initialization step
    yield {
      type: PricingStepType.INITIALIZATION,
      timestamp: new Date(),
      message: `Initializing pricing for ${context.bundle.name}`,
      data: {
        baseCost: context.bundle.cost,
        bundleId: context.bundle.id,
        duration: context.bundle.duration,
        country: context.bundle.countryId
      }
    } as InitializationStep;

    // Initialize pricing state
    const state: PricingState = {
      baseCost: context.bundle.cost,
      markup: 0,
      subtotal: context.bundle.cost,
      discounts: [],
      processingRate: 0.045, // Default 4.5%
      discountPerUnusedDay: 0.10, // Default 10% per day
      unusedDays: this.calculateUnusedDays(context)
    };

    const appliedRules: AppliedRule[] = [];

    // Apply system rules first (markup, processing fees)
    for (const rule of this.systemRules) {
      const matches = this.evaluateRule(rule, context);
      
      // Yield evaluation step
      yield {
        type: PricingStepType.SYSTEM_RULE_EVALUATION,
        timestamp: new Date(),
        message: `Evaluating system rule: ${rule.name}`,
        data: {
          rule,
          matched: matches,
          reason: matches ? 'All conditions met' : 'Conditions not met'
        }
      } as RuleEvaluationStep;
      
      if (matches) {
        const previousMarkup = state.markup;
        const previousRate = state.processingRate;
        
        this.applyRule(rule, state, appliedRules);
        
        // Yield application step
        yield {
          type: PricingStepType.SYSTEM_RULE_APPLICATION,
          timestamp: new Date(),
          message: `Applied system rule: ${rule.name}`,
          data: {
            rule,
            impact: state.markup - previousMarkup || (state.processingRate - previousRate) * 100,
            newState: {
              markup: state.markup,
              processingRate: state.processingRate
            }
          }
        } as RuleApplicationStep;
      }
    }

    // Recalculate subtotal after markup
    state.subtotal = state.baseCost + state.markup;
    
    // Yield subtotal calculation
    yield {
      type: PricingStepType.SUBTOTAL_CALCULATION,
      timestamp: new Date(),
      message: 'Calculated subtotal after markup',
      data: {
        baseCost: state.baseCost,
        markup: state.markup,
        subtotal: state.subtotal
      }
    } as SubtotalCalculationStep;

    // Apply business rules (discounts, promotions)
    for (const rule of this.businessRules) {
      const matches = this.evaluateRule(rule, context);
      
      // Yield evaluation step
      yield {
        type: PricingStepType.BUSINESS_RULE_EVALUATION,
        timestamp: new Date(),
        message: `Evaluating business rule: ${rule.name}`,
        data: {
          rule,
          matched: matches,
          reason: matches ? 'All conditions met' : 'Conditions not met'
        }
      } as RuleEvaluationStep;
      
      if (matches) {
        const previousDiscounts = [...state.discounts];
        
        this.applyRule(rule, state, appliedRules);
        
        // Find new discounts
        const newDiscounts = state.discounts.filter(d => 
          !previousDiscounts.some(pd => pd.ruleName === d.ruleName)
        );
        
        // Yield application step
        yield {
          type: PricingStepType.BUSINESS_RULE_APPLICATION,
          timestamp: new Date(),
          message: `Applied business rule: ${rule.name}`,
          data: {
            rule,
            impact: newDiscounts.reduce((sum, d) => sum + d.amount, 0),
            newState: {
              discounts: state.discounts
            }
          }
        } as RuleApplicationStep;
      }
    }

    // Apply unused days discount if applicable
    if (state.unusedDays > 0 && state.discountPerUnusedDay > 0) {
      const unusedDaysDiscount = state.subtotal * (state.unusedDays * state.discountPerUnusedDay);
      
      yield {
        type: PricingStepType.UNUSED_DAYS_CALCULATION,
        timestamp: new Date(),
        message: `Calculating unused days discount (${state.unusedDays} days)`,
        data: {
          unusedDays: state.unusedDays,
          discountPerDay: state.discountPerUnusedDay,
          totalDiscount: unusedDaysDiscount
        }
      } as UnusedDaysCalculationStep;
      
      state.discounts.push({
        ruleName: 'Unused Days Discount',
        amount: unusedDaysDiscount,
        type: 'percentage'
      });
    }

    // Calculate final pricing
    const totalDiscount = state.discounts.reduce((sum, d) => sum + d.amount, 0);
    const priceAfterDiscount = Math.max(0.01, state.subtotal - totalDiscount);
    const processingFee = priceAfterDiscount * state.processingRate;
    const finalPrice = priceAfterDiscount + processingFee;
    const revenueAfterProcessing = priceAfterDiscount; // This is what we receive after payment processing
    const finalRevenue = revenueAfterProcessing - state.baseCost; // Net revenue after costs
    const profit = revenueAfterProcessing - state.baseCost; // Same as finalRevenue

    // Yield final calculation step
    yield {
      type: PricingStepType.FINAL_CALCULATION,
      timestamp: new Date(),
      message: 'Calculating final price',
      data: {
        totalDiscount,
        priceAfterDiscount,
        processingFee,
        finalPrice,
        profit
      }
    } as FinalCalculationStep;

    // Calculate recommendations
    const MINIMUM_PROFIT_MARGIN = 1.50;
    const maxRecommendedPrice = state.baseCost + MINIMUM_PROFIT_MARGIN;
    
    // Calculate max discount percentage while maintaining minimum profit
    const maxAllowableAfterProcessing = (state.baseCost + MINIMUM_PROFIT_MARGIN) / (1 + state.processingRate);
    const maxDiscountAmount = Math.max(0, state.subtotal - maxAllowableAfterProcessing);
    const maxDiscountPercentage = state.subtotal > 0 ? (maxDiscountAmount / state.subtotal) * 100 : 0;

    // Validate minimum profit margin
    const isProfitValid = profit >= MINIMUM_PROFIT_MARGIN;
    
    yield {
      type: PricingStepType.PROFIT_VALIDATION,
      timestamp: new Date(),
      message: isProfitValid ? 'Profit margin validated' : 'Warning: Low profit margin',
      data: {
        profit,
        minimumRequired: MINIMUM_PROFIT_MARGIN,
        isValid: isProfitValid,
        warning: isProfitValid ? undefined : `Profit ${profit.toFixed(2)} is below minimum ${MINIMUM_PROFIT_MARGIN}`
      }
    } as ProfitValidationStep;

    if (!isProfitValid) {
      this.logger.warn('Calculated price below minimum profit margin', {
        profit,
        minimumRequired: MINIMUM_PROFIT_MARGIN,
        finalPrice,
        operationType: 'profit-validation'
      });
    }

    const result: PricingRuleCalculation = {
      baseCost: state.baseCost,
      markup: state.markup,
      subtotal: state.subtotal,
      discounts: state.discounts.map(d => ({
        ruleName: d.ruleName,
        amount: d.amount,
        type: d.type
      })),
      totalDiscount,
      priceAfterDiscount,
      processingFee,
      processingRate: state.processingRate,
      finalPrice,
      finalRevenue,
      revenueAfterProcessing,
      profit,
      maxRecommendedPrice,
      maxDiscountPercentage,
      appliedRules
    };

    // Yield completed step
    yield {
      type: PricingStepType.COMPLETED,
      timestamp: new Date(),
      message: 'Price calculation completed',
      data: {
        finalPrice,
        appliedRulesCount: appliedRules.length
      }
    } as CompletedStep;

    this.logger.info('Price calculation completed', {
      finalPrice,
      profit,
      appliedRulesCount: appliedRules.length,
      operationType: 'price-calculation'
    });

    return result;
  }
  
  // Convenience method that collects all steps and returns final result
  async calculatePrice(context: PricingContext): Promise<PricingRuleCalculation> {
    let result: PricingRuleCalculation | undefined;
    
    // Iterate through all steps
    for await (const step of this.calculatePriceSteps(context)) {
      // The generator will yield steps, and return the final result
      // We just need to consume all the steps
    }
    
    // The last value from the generator is the result
    // We need to run it again to get the return value
    const generator = this.calculatePriceSteps(context);
    let iterResult = await generator.next();
    
    while (!iterResult.done) {
      iterResult = await generator.next();
    }
    
    if (!iterResult.value) {
      throw new Error('Failed to calculate price');
    }
    
    return iterResult.value;
  }
  
  // Stream pricing steps for real-time updates
  async *streamPricing(context: PricingContext): AsyncGenerator<PricingStep | PricingRuleCalculation> {
    let finalResult: PricingRuleCalculation;
    
    // Yield each step as it happens
    for await (const step of this.calculatePriceSteps(context)) {
      yield step;
    }
    
    // Get the final result
    const generator = this.calculatePriceSteps(context);
    let next = await generator.next();
    while (!next.done) {
      next = await generator.next();
    }
    finalResult = next.value;
    
    // Yield the final calculation
    yield finalResult;
  }

  private evaluateRule(rule: PricingRule, context: PricingContext): boolean {
    // Check if rule is active
    if (!rule.isActive) {
      return false;
    }

    // Check validity dates
    const now = context.currentDate || new Date();
    if (rule.validFrom && new Date(rule.validFrom) > now) {
      return false;
    }
    if (rule.validUntil && new Date(rule.validUntil) < now) {
      return false;
    }

    // Evaluate all conditions (AND logic)
    for (const condition of rule.conditions) {
      if (!this.conditionEvaluator.evaluate(condition, context)) {
        return false;
      }
    }

    return true;
  }

  private applyRule(rule: PricingRule, state: PricingState, appliedRules: AppliedRule[]): void {
    let totalImpact = 0;

    for (const action of rule.actions) {
      const result = this.actionExecutor.execute(action, state, rule.name);
      totalImpact += result.appliedValue || 0;
    }

    appliedRules.push({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      impact: totalImpact
    });

    this.logger.debug('Applied pricing rule', {
      ruleId: rule.id,
      ruleName: rule.name,
      impact: totalImpact,
      operationType: 'rule-application'
    });
  }

  private categorizeRule(rule: PricingRule): void {
    if (rule.type === 'SYSTEM_MARKUP' || rule.type === 'SYSTEM_PROCESSING') {
      this.systemRules.push(rule);
    } else {
      this.businessRules.push(rule);
    }
  }

  private sortRules(): void {
    // Sort by priority (higher priority first)
    const sortByPriority = (a: PricingRule, b: PricingRule) => b.priority - a.priority;
    
    this.systemRules.sort(sortByPriority);
    this.businessRules.sort(sortByPriority);
    this.rules.sort(sortByPriority);
  }

  private calculateUnusedDays(context: PricingContext): number {
    if (!context.requestedDuration || context.requestedDuration >= context.bundle.duration) {
      return 0;
    }
    return context.bundle.duration - context.requestedDuration;
  }
  
  // Calculate discount per unused day based on markup difference formula
  async calculateUnusedDayDiscount(
    selectedBundleMarkup: number, 
    selectedBundleDuration: number,
    requestedDuration: number,
    bundleGroup: string
  ): Promise<number> {
    // Find the previous duration bundle (e.g., for 13 days request with 15 day bundle, find 10 day bundle)
    const previousDuration = this.findPreviousDuration(requestedDuration);
    if (!previousDuration) return 0;
    
    // Get markup for previous duration bundle
    const previousMarkup = await this.getMarkupForDuration(bundleGroup, previousDuration);
    if (!previousMarkup) return 0;
    
    // Formula: (selectedBundleMarkup - previousBundleMarkup) / daysDifference
    const markupDifference = selectedBundleMarkup - previousMarkup;
    const daysDifference = selectedBundleDuration - previousDuration;
    
    if (daysDifference <= 0) return 0;
    
    return markupDifference / daysDifference;
  }
  
  private findPreviousDuration(requestedDuration: number): number | null {
    const standardDurations = [1, 3, 5, 7, 10, 15, 30];
    
    // Find the largest duration that is less than or equal to requested duration
    for (let i = standardDurations.length - 1; i >= 0; i--) {
      if (standardDurations[i] <= requestedDuration) {
        return standardDurations[i];
      }
    }
    
    return null;
  }
  
  private async getMarkupForDuration(bundleGroup: string, duration: number): Promise<number | null> {
    // Find system markup rule for this bundle group and duration
    const markupRule = this.systemRules.find(rule => 
      rule.type === 'SYSTEM_MARKUP' &&
      rule.conditions.some(c => c.field === 'bundleGroup' && c.value === bundleGroup) &&
      rule.conditions.some(c => c.field === 'duration' && c.value === duration)
    );
    
    if (!markupRule) return null;
    
    // Extract markup value from actions
    const markupAction = markupRule.actions.find(a => a.type === 'ADD_MARKUP');
    return markupAction ? markupAction.value : null;
  }

  // Rule management methods
  getRules(): PricingRule[] {
    return [...this.rules];
  }

  getSystemRules(): PricingRule[] {
    return [...this.systemRules];
  }

  getBusinessRules(): PricingRule[] {
    return [...this.businessRules];
  }

  clearRules(): void {
    this.rules = [];
    this.systemRules = [];
    this.businessRules = [];
  }

  removeRule(ruleId: string): boolean {
    const initialLength = this.rules.length;
    
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.systemRules = this.systemRules.filter(r => r.id !== ruleId);
    this.businessRules = this.businessRules.filter(r => r.id !== ruleId);
    
    return this.rules.length < initialLength;
  }

  // Validation and testing methods
  validateRule(rule: PricingRule): string[] {
    const errors: string[] = [];

    if (!rule.name) {
      errors.push('Rule name is required');
    }

    if (!rule.type) {
      errors.push('Rule type is required');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push('At least one action is required');
    }

    if (rule.priority < 0 || rule.priority > 1000) {
      errors.push('Priority must be between 0 and 1000');
    }

    return errors;
  }

  findConflicts(newRule: PricingRule): PricingRule[] {
    const conflicts: PricingRule[] = [];

    for (const existingRule of this.rules) {
      if (existingRule.id === newRule.id) continue;

      // Check for exact same conditions with different actions
      if (this.haveSameConditions(newRule, existingRule) && 
          this.haveDifferentActions(newRule, existingRule)) {
        conflicts.push(existingRule);
      }
    }

    return conflicts;
  }

  private haveSameConditions(rule1: PricingRule, rule2: PricingRule): boolean {
    if (rule1.conditions.length !== rule2.conditions.length) return false;

    return rule1.conditions.every(c1 => 
      rule2.conditions.some(c2 => 
        c1.field === c2.field && 
        c1.operator === c2.operator && 
        JSON.stringify(c1.value) === JSON.stringify(c2.value)
      )
    );
  }

  private haveDifferentActions(rule1: PricingRule, rule2: PricingRule): boolean {
    if (rule1.actions.length !== rule2.actions.length) return true;

    return !rule1.actions.every(a1 => 
      rule2.actions.some(a2 => 
        a1.type === a2.type && 
        a1.value === a2.value
      )
    );
  }
}