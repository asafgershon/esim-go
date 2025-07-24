import { createLogger } from "../lib/logger";
import type {
  AppliedRule,
  CreatePricingRuleInput,
  PricingRule,
  PricingRuleCalculation,
} from "../types";
import { ActionType, RuleType } from "../types";
import { ActionExecutor, type PricingState } from "./actions";
import { ConditionEvaluator } from "./conditions";
import {
  PricingStepType,
  type BundleSelectionStep,
  type CompletedStep,
  type FinalCalculationStep,
  type InitializationStep,
  type PricingStep,
  type ProfitValidationStep,
  type RuleApplicationStep,
  type RuleEvaluationStep,
  type SubtotalCalculationStep,
  type UnusedDaysCalculationStep,
} from "./pricing-steps";
import type { Bundle, PricingContext } from "./types";

export class PricingRuleEngine {
  private rules: PricingRule[] = [];
  private systemRules: PricingRule[] = [];
  private businessRules: PricingRule[] = [];
  private conditionEvaluator: ConditionEvaluator;
  private actionExecutor: ActionExecutor;
  private logger = createLogger({
    component: "PricingRuleEngine",
    operationType: "rule-evaluation",
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
    rules.forEach((rule) => this.addRule(rule));
    return this;
  }

  addSystemRules(rules: (PricingRule | CreatePricingRuleInput)[]): this {
    rules.forEach((rule) => {
      // Convert CreatePricingRuleInput to PricingRule if needed
      const pricingRule: PricingRule = this.ensurePricingRule(rule);
      pricingRule.isEditable = false;
      this.addRule(pricingRule);
    });
    return this;
  }

  private ensurePricingRule(
    rule: PricingRule | CreatePricingRuleInput
  ): PricingRule {
    if ("id" in rule && "createdAt" in rule) {
      return rule as PricingRule;
    }

    // Convert CreatePricingRuleInput to PricingRule
    const input = rule as CreatePricingRuleInput;
    const now = new Date().toISOString();
    return {
      __typename: "PricingRule" as const,
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
      createdBy: "system",
      createdAt: now,
      updatedAt: now,
    };
  }

  async *calculatePriceSteps(
    context: PricingContext
  ): AsyncGenerator<PricingStep, PricingRuleCalculation, undefined> {
    // First, select the optimal bundle
    const selectedBundle = this.selectOptimalBundle(context);

    // Yield bundle selection step
    yield {
      type: PricingStepType.BUNDLE_SELECTION,
      timestamp: new Date(),
      message: `Selected ${selectedBundle.duration}-day bundle for ${context.requestedDuration}-day request`,
      data: {
        requestedDuration: context.requestedDuration,
        availableBundles: context.availableBundles.map((b) => ({
          id: b.id,
          name: b.name,
          duration: b.duration,
          cost: b.cost,
        })),
        selectedBundle: {
          id: selectedBundle.id,
          name: selectedBundle.name,
          duration: selectedBundle.duration,
          reason:
            selectedBundle.duration === context.requestedDuration
              ? "exact_match"
              : "next_available",
        },
        unusedDays: selectedBundle.duration - context.requestedDuration,
      },
    } as BundleSelectionStep;

    // Update context with selected bundle
    context.bundle = selectedBundle;
    context.country = selectedBundle.countryId;
    context.region = selectedBundle.region;
    context.bundleGroup = selectedBundle.group;
    context.duration = selectedBundle.duration;

    if (!context.bundle) {
      throw new Error("No bundle found for context");
    }

    this.logger.info("Starting price calculation with selected bundle", {
      bundleId: selectedBundle.id,
      countryId: selectedBundle.countryId,
      duration: selectedBundle.duration,
      requestedDuration: context.requestedDuration,
      operationType: "price-calculation",
    });

    // Validate that required system rules are configured
    this.validateRequiredSystemRules();

    // Yield initialization step
    yield {
      type: PricingStepType.INITIALIZATION,
      timestamp: new Date(),
      message: `Initializing pricing for ${context.bundle.name}`,
      data: {
        baseCost: context.bundle.cost,
        bundleId: context.bundle.id,
        duration: context.bundle.duration,
        country: context.bundle.countryId,
      },
    } as InitializationStep;

    // Initialize pricing state - no hardcoded defaults, must come from rules
    const state: PricingState = {
      baseCost: context.bundle.cost,
      markup: 0,
      subtotal: context.bundle.cost,
      discounts: [],
      processingRate: 0, // Will be set by system rules
      discountPerUnusedDay: 0, // Will be set by system rules
      unusedDays: this.calculateUnusedDays(context),
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
          reason: matches ? "All conditions met" : "Conditions not met",
        },
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
            impact:
              state.markup - previousMarkup ||
              (state.processingRate - previousRate) * 100,
            newState: {
              markup: state.markup,
              processingRate: state.processingRate,
            },
          },
        } as RuleApplicationStep;
      }
    }

    // Recalculate subtotal after markup
    state.subtotal = state.baseCost + state.markup;

    // Yield subtotal calculation
    yield {
      type: PricingStepType.SUBTOTAL_CALCULATION,
      timestamp: new Date(),
      message: "Calculated subtotal after markup",
      data: {
        baseCost: state.baseCost,
        markup: state.markup,
        subtotal: state.subtotal,
      },
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
          reason: matches ? "All conditions met" : "Conditions not met",
        },
      } as RuleEvaluationStep;

      if (matches) {
        const previousDiscounts = [...state.discounts];

        this.applyRule(rule, state, appliedRules);

        // Find new discounts
        const newDiscounts = state.discounts.filter(
          (d) => !previousDiscounts.some((pd) => pd.ruleName === d.ruleName)
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
              discounts: state.discounts,
            },
          },
        } as RuleApplicationStep;
      }
    }

    // Apply unused days discount if applicable using markup-based formula
    if ((state.unusedDays || 0) > 0) {
      try {
        // Calculate dynamic discount per day based on markup differences
        // Get available durations from context bundles
        const availableDurations = context.availableBundles
          .map((b) => b.duration)
          .filter((value, index, self) => self.indexOf(value) === index) // unique durations
          .sort((a, b) => a - b);

        const discountPerDay = await this.calculateUnusedDayDiscount(
          state.markup,
          context.bundle!.duration,
          context.requestedDuration,
          context.bundle!.group,
          availableDurations
        );

        if (discountPerDay > 0) {
          const unusedDaysDiscount = discountPerDay * (state.unusedDays || 0);

          yield {
            type: PricingStepType.UNUSED_DAYS_CALCULATION,
            timestamp: new Date(),
            message: `Calculating unused days discount using markup formula (${
              state.unusedDays
            } days @ $${discountPerDay.toFixed(2)}/day)`,
            data: {
              unusedDays: state.unusedDays,
              discountPerDay: discountPerDay,
              totalDiscount: unusedDaysDiscount,
              calculationMethod: "markup-based",
            },
          } as UnusedDaysCalculationStep;

          state.discounts.push({
            ruleName: "Unused Days Discount (Markup-Based)",
            amount: unusedDaysDiscount,
            type: "fixed",
          });
        }
      } catch (error) {
        // Fallback to simple percentage if markup calculation fails
        this.logger.warn(
          "Markup-based discount calculation failed, using fallback",
          {
            error: (error as Error).message,
            unusedDays: state.unusedDays,
            operationType: "unused-days-discount",
          }
        );

        // No fallback rate - if markup calculation fails, no discount is applied
        this.logger.warn(
          "No unused days discount applied - markup calculation failed and no fallback configured",
          {
            unusedDays: state.unusedDays,
            operationType: "unused-days-discount",
          }
        );
        // Skip the unused days discount if no valid calculation method available

        yield {
          type: PricingStepType.UNUSED_DAYS_CALCULATION,
          timestamp: new Date(),
          message: `No unused days discount applied - calculation failed`,
          data: {
            unusedDays: state.unusedDays,
            discountPerDay: 0,
            totalDiscount: 0,
            calculationMethod: "none-failed",
          },
        } as UnusedDaysCalculationStep;
      }
    }

    // Calculate final pricing
    const totalDiscount = state.discounts.reduce((sum, d) => sum + d.amount, 0);
    // Use minimum price from system rules or 0 if not configured
    const minimumPrice = this.getMinimumPrice();
    const priceAfterDiscount = Math.max(
      minimumPrice,
      state.subtotal - totalDiscount
    );
    const processingFee = priceAfterDiscount * state.processingRate;
    const finalPrice = priceAfterDiscount + processingFee;

    // Revenue calculations as per requirements:
    // - Final revenue should be what we get (final payment - cost)
    // - Revenue after processing is the bottom line (what we actually receive)
    const revenueAfterProcessing = finalPrice - processingFee - state.baseCost; // Bottom line: what we get after payment processing and costs
    const finalRevenue = finalPrice - state.baseCost; // What we get from final payment minus cost
    const profit = revenueAfterProcessing; // Net profit after all deductions

    // Yield final calculation step
    yield {
      type: PricingStepType.FINAL_CALCULATION,
      timestamp: new Date(),
      message: "Calculating final price",
      data: {
        totalDiscount,
        priceAfterDiscount,
        processingFee,
        finalPrice,
        profit,
      },
    } as FinalCalculationStep;

    // Calculate recommendations - minimum profit margin should come from business rules
    const MINIMUM_PROFIT_MARGIN = this.getMinimumProfitMargin() || 0;
    const maxRecommendedPrice = state.baseCost + MINIMUM_PROFIT_MARGIN;

    // Calculate max discount percentage while maintaining minimum profit
    // To maintain $1.50 minimum profit after processing fees:
    // Required revenue after processing = baseCost + $1.50
    // Required price after discount = (baseCost + $1.50) / (1 - processingRate)
    // Note: We use (1 - processingRate) because processing fee is deducted from price after discount
    const requiredRevenueAfterProcessing =
      state.baseCost + MINIMUM_PROFIT_MARGIN;
    const requiredPriceAfterDiscount =
      requiredRevenueAfterProcessing / (1 - state.processingRate);
    const maxDiscountAmount = Math.max(
      0,
      state.subtotal - requiredPriceAfterDiscount
    );
    const maxDiscountPercentage =
      state.subtotal > 0 ? (maxDiscountAmount / state.subtotal) * 100 : 0;

    // Validate minimum profit margin
    const isProfitValid = profit >= MINIMUM_PROFIT_MARGIN;

    yield {
      type: PricingStepType.PROFIT_VALIDATION,
      timestamp: new Date(),
      message: isProfitValid
        ? "Profit margin validated"
        : "Warning: Low profit margin",
      data: {
        profit,
        minimumRequired: MINIMUM_PROFIT_MARGIN,
        isValid: isProfitValid,
        warning: isProfitValid
          ? undefined
          : `Profit ${profit.toFixed(
              2
            )} is below minimum ${MINIMUM_PROFIT_MARGIN}`,
      },
    } as ProfitValidationStep;

    if (!isProfitValid) {
      this.logger.warn("Calculated price below minimum profit margin", {
        profit,
        minimumRequired: MINIMUM_PROFIT_MARGIN,
        finalPrice,
        operationType: "profit-validation",
      });
    }

    const result: PricingRuleCalculation = {
      baseCost: state.baseCost,
      markup: state.markup,
      subtotal: state.subtotal,
      discounts: state.discounts.map((d) => ({
        ruleName: d.ruleName,
        amount: d.amount,
        type: d.type,
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
      appliedRules,
      selectedBundle: {
        id: context.bundle?.id || "",
        name: context.bundle?.name || "",
        duration: context.bundle?.duration || 0,
        reason:
          context.bundle?.duration === context.requestedDuration
            ? "exact_match"
            : "next_available",
      },
      metadata: {
        discountPerUnusedDay: state.discountPerUnusedDay,
        unusedDays: state.unusedDays,
      },
    };

    // Yield completed step
    yield {
      type: PricingStepType.COMPLETED,
      timestamp: new Date(),
      message: "Price calculation completed",
      data: {
        finalPrice,
        appliedRulesCount: appliedRules.length,
      },
    } as CompletedStep;

    this.logger.info("Price calculation completed", {
      finalPrice,
      profit,
      appliedRulesCount: appliedRules.length,
      operationType: "price-calculation",
    });

    return result;
  }

  // Convenience method that collects all steps and returns final result
  async calculatePrice(
    context: PricingContext
  ): Promise<PricingRuleCalculation> {
    // Use the generator to consume all steps and get the final result
    const generator = this.calculatePriceSteps(context);
    let iterResult = await generator.next();

    // Consume all steps until the generator is done
    while (!iterResult.done) {
      iterResult = await generator.next();
    }

    // The final return value contains the pricing calculation result
    if (!iterResult.value) {
      throw new Error(
        "Failed to calculate price - no result returned from pricing engine"
      );
    }

    return iterResult.value;
  }

  // Stream pricing steps for real-time updates
  async *streamPricing(
    context: PricingContext
  ): AsyncGenerator<PricingStep | PricingRuleCalculation> {
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

  private applyRule(
    rule: PricingRule,
    state: PricingState,
    appliedRules: AppliedRule[]
  ): void {
    let totalImpact = 0;

    for (const action of rule.actions) {
      const result = this.actionExecutor.execute(action, state, rule.name);
      totalImpact += result.appliedValue || 0;
    }

    appliedRules.push({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      impact: totalImpact,
    });

    this.logger.debug("Applied pricing rule", {
      ruleId: rule.id,
      ruleName: rule.name,
      impact: totalImpact,
      operationType: "rule-application",
    });
  }

  private categorizeRule(rule: PricingRule): void {
    if (
      rule.type === RuleType.SystemMarkup ||
      rule.type === RuleType.SystemProcessing ||
      rule.type === RuleType.SystemMinimumPrice
    ) {
      this.systemRules.push(rule);
    } else {
      this.businessRules.push(rule);
    }
  }

  private sortRules(): void {
    // Sort by priority (higher priority first)
    const sortByPriority = (a: PricingRule, b: PricingRule) =>
      b.priority - a.priority;

    this.systemRules.sort(sortByPriority);
    this.businessRules.sort(sortByPriority);
    this.rules.sort(sortByPriority);
  }

  private calculateUnusedDays(context: PricingContext): number {
    if (
      !context.requestedDuration ||
      context.requestedDuration >= context.bundle.duration
    ) {
      return 0;
    }
    return context.bundle.duration - context.requestedDuration;
  }

  // Validate that required system rules are configured
  private validateRequiredSystemRules(): void {
    const hasProcessingRule = this.systemRules.some(
      (rule) =>
        rule.type === RuleType.SystemProcessing &&
        rule.isActive &&
        rule.actions.some((a) => a.type === ActionType.SetProcessingRate)
    );

    if (!hasProcessingRule) {
      throw new Error(
        "No active processing rate rule configured. System requires at least one SYSTEM_PROCESSING rule with SET_PROCESSING_RATE action."
      );
    }

    // Note: Markup rules are optional as they may be country/bundle specific
  }

  // Get minimum profit margin from business rules or return 0 if not configured
  private getMinimumProfitMargin(): number {
    const profitRule = this.businessRules.find(
      (rule) =>
        rule.type === RuleType.BusinessMinimumProfit &&
        rule.isActive &&
        rule.actions.some((a) => a.type === ActionType.SetMinimumProfit)
    );

    if (profitRule) {
      const profitAction = profitRule.actions.find(
        (a) => a.type === ActionType.SetMinimumProfit
      );
      return profitAction ? profitAction.value : 0;
    }

    return 0; // No minimum profit configured
  }

  // Get minimum price from system rules or return 0 if not configured
  private getMinimumPrice(): number {
    const priceRule = this.systemRules.find(
      (rule) =>
        rule.type === RuleType.SystemMinimumPrice &&
        rule.isActive &&
        rule.actions.some((a) => a.type === ActionType.SetMinimumPrice)
    );

    if (priceRule) {
      const priceAction = priceRule.actions.find(
        (a) => a.type === ActionType.SetMinimumPrice
      );
      return priceAction ? priceAction.value : 0;
    }

    return 0; // No minimum price configured
  }

  // Calculate discount per unused day based on markup difference formula
  async calculateUnusedDayDiscount(
    selectedBundleMarkup: number,
    selectedBundleDuration: number,
    requestedDuration: number,
    bundleGroup: string,
    availableDurations: number[]
  ): Promise<number> {
    // Find the previous duration bundle (e.g., for 13 days request with 15 day bundle, find 10 day bundle)
    const previousDuration = this.findPreviousDuration(
      requestedDuration,
      availableDurations
    );
    if (!previousDuration) return 0;

    // Get markup for previous duration bundle
    const previousMarkup = await this.getMarkupForDuration(
      bundleGroup,
      previousDuration
    );
    if (!previousMarkup) return 0;

    // Formula: (selectedBundleMarkup - previousBundleMarkup) / daysDifference
    const markupDifference = selectedBundleMarkup - previousMarkup;
    const daysDifference = selectedBundleDuration - previousDuration;

    if (daysDifference <= 0) return 0;

    return markupDifference / daysDifference;
  }

  private selectOptimalBundle(context: PricingContext): Bundle {
    const { availableBundles, requestedDuration } = context;

    if (!availableBundles || availableBundles.length === 0) {
      throw new Error("No bundles available for pricing calculation");
    }

    // 1. Try exact match first
    const exactMatch = availableBundles.find(
      (b) => b.duration === requestedDuration
    );
    if (exactMatch) {
      this.logger.info("Found exact duration match", {
        bundleId: exactMatch.id,
        duration: exactMatch.duration,
        requestedDuration,
        operationType: "bundle-selection",
      });
      return exactMatch;
    }

    // 2. Find eligible bundles (duration >= requested)
    const eligibleBundles = availableBundles
      .filter((b) => b.duration >= requestedDuration)
      .sort((a, b) => a.duration - b.duration);

    if (eligibleBundles.length === 0) {
      throw new Error(
        `No bundles available for ${requestedDuration} days or longer`
      );
    }

    // 3. Return the smallest eligible bundle (next available)
    const selectedBundle = eligibleBundles[0];
    this.logger.info("Selected next available bundle", {
      bundleId: selectedBundle.id,
      bundleDuration: selectedBundle.duration,
      requestedDuration,
      unusedDays: selectedBundle.duration - requestedDuration,
      operationType: "bundle-selection",
    });

    return selectedBundle;
  }

  private findPreviousDuration(
    requestedDuration: number,
    availableDurations: number[]
  ): number | null {
    // Sort durations in ascending order
    const sortedDurations = [...availableDurations].sort((a, b) => a - b);

    // Find the largest duration that is less than or equal to requested duration
    for (let i = sortedDurations.length - 1; i >= 0; i--) {
      if (sortedDurations[i] <= requestedDuration) {
        return sortedDurations[i];
      }
    }

    return null;
  }

  private async getMarkupForDuration(
    bundleGroup: string,
    duration: number
  ): Promise<number | null> {
    // Find system markup rule for this bundle group and duration
    const markupRule = this.systemRules.find(
      (rule) =>
        rule.type === "SYSTEM_MARKUP" &&
        rule.conditions.some(
          (c) => c.field === "bundleGroup" && c.value === bundleGroup
        ) &&
        rule.conditions.some(
          (c) => c.field === "duration" && c.value === duration
        )
    );

    if (!markupRule) return null;

    // Extract markup value from actions
    const markupAction = markupRule.actions.find(
      (a) => a.type === "ADD_MARKUP"
    );
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

    this.rules = this.rules.filter((r) => r.id !== ruleId);
    this.systemRules = this.systemRules.filter((r) => r.id !== ruleId);
    this.businessRules = this.businessRules.filter((r) => r.id !== ruleId);

    return this.rules.length < initialLength;
  }

  // Validation and testing methods
  validateRule(rule: PricingRule): string[] {
    const errors: string[] = [];

    if (!rule.name) {
      errors.push("Rule name is required");
    }

    if (!rule.type) {
      errors.push("Rule type is required");
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push("At least one condition is required");
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push("At least one action is required");
    }

    if (rule.priority < 0 || rule.priority > 1000) {
      errors.push("Priority must be between 0 and 1000");
    }

    return errors;
  }

  findConflicts(newRule: PricingRule): PricingRule[] {
    const conflicts: PricingRule[] = [];

    for (const existingRule of this.rules) {
      if (existingRule.id === newRule.id) continue;

      // Check for exact same conditions with different actions
      if (
        this.haveSameConditions(newRule, existingRule) &&
        this.haveDifferentActions(newRule, existingRule)
      ) {
        conflicts.push(existingRule);
      }
    }

    return conflicts;
  }

  private haveSameConditions(rule1: PricingRule, rule2: PricingRule): boolean {
    if (rule1.conditions.length !== rule2.conditions.length) return false;

    return rule1.conditions.every((c1) =>
      rule2.conditions.some(
        (c2) =>
          c1.field === c2.field &&
          c1.operator === c2.operator &&
          JSON.stringify(c1.value) === JSON.stringify(c2.value)
      )
    );
  }

  private haveDifferentActions(
    rule1: PricingRule,
    rule2: PricingRule
  ): boolean {
    if (rule1.actions.length !== rule2.actions.length) return true;

    return !rule1.actions.every((a1) =>
      rule2.actions.some((a2) => a1.type === a2.type && a1.value === a2.value)
    );
  }
}
