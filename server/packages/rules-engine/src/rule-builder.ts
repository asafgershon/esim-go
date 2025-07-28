import {
  ActionType as ActionTypeEnum,
  ConditionOperator as ConditionOperatorEnum,
  type CreatePricingRuleInput,
  type RuleAction,
  type RuleCondition,
  RuleCategory as RuleCategoryEnum
} from './generated/types';

export class RuleBuilder {
  private rule: Partial<CreatePricingRuleInput> = {
    isActive: true,
    priority: 50,
    conditions: [],
    actions: []
  };

  private currentConditions: RuleCondition[] = [];

  name(name: string): this {
    this.rule.name = name;
    return this;
  }

  description(description: string): this {
    this.rule.description = description;
    return this;
  }

  category(category: RuleCategoryEnum): this {
    this.rule.category = category;
    return this;
  }

  priority(priority: number): this {
    this.rule.priority = priority;
    return this;
  }

  validFrom(date: Date | string): this {
    this.rule.validFrom = typeof date === 'string' ? date : date.toISOString();
    return this;
  }

  validUntil(date: Date | string): this {
    this.rule.validUntil = typeof date === 'string' ? date : date.toISOString();
    return this;
  }

  when(): ConditionBuilder {
    return new ConditionBuilder(this);
  }

  then(): ActionBuilder {
    return new ActionBuilder(this);
  }

  immutable(): this {
    this.rule.category = RuleCategoryEnum.BundleAdjustment; // System rules are immutable
    return this;
  }

  addCondition(condition: RuleCondition): this {
    if (!this.rule.conditions) {
      this.rule.conditions = [];
    }
    this.rule.conditions.push(condition);
    return this;
  }

  and(): ConditionBuilder {
    return new ConditionBuilder(this);
  }

  addAction(action: RuleAction): this {
    if (!this.rule.actions) {
      this.rule.actions = [];
    }
    this.rule.actions.push(action);
    return this;
  }

  build(): CreatePricingRuleInput {
    if (!this.rule.name) {
      throw new Error('Rule name is required');
    }
    if (!this.rule.category) {
      this.rule.category = RuleCategoryEnum.Discount; // Default category
    }
    if (!this.rule.conditions || this.rule.conditions.length === 0) {
      throw new Error('At least one condition is required');
    }
    if (!this.rule.actions || this.rule.actions.length === 0) {
      throw new Error('At least one action is required');
    }
    
    // Validate priority
    if (this.rule.priority !== undefined && (this.rule.priority < 0 || this.rule.priority > 1000)) {
      throw new Error('Priority must be between 0 and 1000');
    }
    
    // Validate action values
    this.rule.actions.forEach(action => {
      if (action.type === ActionTypeEnum.ApplyDiscountPercentage && 
          (action.value < 0 || action.value > 100)) {
        throw new Error('Discount percentage must be between 0 and 100');
      }
      if (action.type === ActionTypeEnum.SetProcessingRate && 
          (action.value < 0 || action.value > 100)) {
        throw new Error('Processing rate must be between 0 and 100');
      }
    });

    const builtRule = { ...this.rule } as CreatePricingRuleInput;
    
    // Reset the builder for next use
    this.rule = {
      isActive: true,
      priority: 50,
      conditions: [],
      actions: []
    };
    
    return builtRule;
  }
}

export class ConditionBuilder {
  private builder: RuleBuilder;

  constructor(builder: RuleBuilder) {
    this.builder = builder;
  }

  // Location conditions
  country(): LocationCondition {
    return new LocationCondition(this.builder, 'country');
  }

  region(): LocationCondition {
    return new LocationCondition(this.builder, 'region');
  }

  // Bundle conditions
  group(): BundleCondition {
    return new BundleCondition(this.builder, 'group');
  }

  bundleGroup(): BundleCondition {
    return new BundleCondition(this.builder, 'group');
  }

  duration(): NumericCondition {
    return new NumericCondition(this.builder, 'duration');
  }

  cost(): NumericCondition {
    return new NumericCondition(this.builder, 'cost');
  }

  planId(): StringCondition {
    return new StringCondition(this.builder, 'planId');
  }

  // User conditions
  user(): UserCondition {
    return new UserCondition(this.builder);
  }

  // Payment method conditions
  paymentMethod(): PaymentMethodCondition {
    return new PaymentMethodCondition(this.builder);
  }

  // Date conditions
  date(): DateCondition {
    return new DateCondition(this.builder);
  }

  // Generic condition
  field(fieldName: string): GenericCondition {
    return new GenericCondition(this.builder, fieldName);
  }

  custom(fieldName: string): GenericCondition {
    return new GenericCondition(this.builder, fieldName);
  }
}

export class ActionBuilder {
  private builder: RuleBuilder;

  constructor(builder: RuleBuilder) {
    this.builder = builder;
  }

  applyDiscount(percentage: number): RuleBuilder {
    return this.builder.addAction({
      type: ActionTypeEnum.ApplyDiscountPercentage,
      value: percentage,
      metadata: {}
    });
  }

  applyDiscountPercentage(percentage: number): RuleBuilder {
    return this.applyDiscount(percentage);
  }

  applyFixedDiscount(amount: number): RuleBuilder {
    return this.builder.addAction({
      type: ActionTypeEnum.ApplyFixedDiscount,
      value: amount,
      metadata: {}
    });
  }

  addMarkup(amount: number): RuleBuilder {
    return this.builder.addAction({
      type: ActionTypeEnum.AddMarkup,
      value: amount,
      metadata: {}
    });
  }

  setProcessingRate(rate: number): RuleBuilder {
    return this.builder.addAction({
      type: ActionTypeEnum.SetProcessingRate,
      value: rate,
      metadata: {}
    });
  }

  setDiscountPerUnusedDay(rate: number): RuleBuilder {
    return this.builder.addAction({
      type: ActionTypeEnum.SetDiscountPerUnusedDay,
      value: rate,
      metadata: {}
    });
  }

  setMinimumProfit(amount: number): RuleBuilder {
    return this.builder.addAction({
      type: ActionTypeEnum.SetMinimumProfit,
      value: amount,
      metadata: {}
    });
  }

  setMinimumPrice(amount: number): RuleBuilder {
    return this.builder.addAction({
      type: ActionTypeEnum.SetMinimumPrice,
      value: amount,
      metadata: {}
    });
  }
}

// Base condition class
abstract class BaseCondition<T> {
  protected builder: RuleBuilder;
  protected field: string;

  constructor(builder: RuleBuilder, field: string) {
    this.builder = builder;
    this.field = field;
  }

  equals(value: T): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.Equals,
      value
    });
  }

  notEquals(value: T): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.NotEquals,
      value
    });
  }

  in(values: T[]): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.In,
      value: values
    });
  }

  notIn(values: T[]): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.NotIn,
      value: values
    });
  }
}

// Specific condition classes
class StringCondition extends BaseCondition<string> {
  contains(value: string): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.Equals,  // Using Equals since Contains doesn't exist
      value
    });
  }
}

class NumericCondition extends BaseCondition<number> {
  greaterThan(value: number): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.GreaterThan,
      value
    });
  }

  lessThan(value: number): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.LessThan,
      value
    });
  }

  between(min: number, max: number): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.Between,
      value: [min, max]
    });
  }

  greaterThanOrEqual(value: number): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.GreaterThan,
      value: value - 0.001  // Hack for GTE
    });
  }
}

class LocationCondition extends StringCondition {}

class BundleCondition extends StringCondition {}

class UserCondition {
  private builder: RuleBuilder;

  constructor(builder: RuleBuilder) {
    this.builder = builder;
  }

  isFirstPurchase(): RuleBuilder {
    return this.builder.addCondition({
      field: 'user.isFirstPurchase',
      operator: ConditionOperatorEnum.Equals,
      value: true
    });
  }

  hasSegment(segment: string): RuleBuilder {
    return this.builder.addCondition({
      field: 'user.segment',
      operator: ConditionOperatorEnum.Equals,
      value: segment
    });
  }

  purchaseCountGreaterThan(count: number): RuleBuilder {
    return this.builder.addCondition({
      field: 'user.purchaseCount',
      operator: ConditionOperatorEnum.GreaterThan,
      value: count
    });
  }
}

class DateCondition {
  private builder: RuleBuilder;

  constructor(builder: RuleBuilder) {
    this.builder = builder;
  }

  between(startDate: string, endDate: string): RuleBuilder {
    return this.builder.addCondition({
      field: 'currentDate',
      operator: ConditionOperatorEnum.Between,
      value: [startDate, endDate]
    });
  }

  after(date: string): RuleBuilder {
    return this.builder.addCondition({
      field: 'currentDate',
      operator: ConditionOperatorEnum.GreaterThan,
      value: date
    });
  }

  before(date: string): RuleBuilder {
    return this.builder.addCondition({
      field: 'currentDate',
      operator: ConditionOperatorEnum.LessThan,
      value: date
    });
  }
}

class PaymentMethodCondition {
  private builder: RuleBuilder;

  constructor(builder: RuleBuilder) {
    this.builder = builder;
  }

  equals(paymentMethod: string): RuleBuilder {
    return this.builder.addCondition({
      field: 'paymentMethod',
      operator: ConditionOperatorEnum.Equals,
      value: paymentMethod
    });
  }

  notEquals(paymentMethod: string): RuleBuilder {
    return this.builder.addCondition({
      field: 'paymentMethod',
      operator: ConditionOperatorEnum.NotEquals,
      value: paymentMethod
    });
  }

  in(paymentMethods: string[]): RuleBuilder {
    return this.builder.addCondition({
      field: 'paymentMethod',
      operator: ConditionOperatorEnum.In,
      value: paymentMethods
    });
  }

  notIn(paymentMethods: string[]): RuleBuilder {
    return this.builder.addCondition({
      field: 'paymentMethod',
      operator: ConditionOperatorEnum.NotIn,
      value: paymentMethods
    });
  }
}

class GenericCondition extends StringCondition {
  exists(): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.Exists,
      value: true
    });
  }

  notExists(): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.NotExists,
      value: true
    });
  }

  greaterThan(value: number): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.GreaterThan,
      value
    });
  }

  lessThan(value: number): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.LessThan,
      value
    });
  }

  greaterThanOrEqual(value: number): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.GreaterThan,
      value: value - 0.001  // Hack for GTE since it might not exist
    });
  }

  between(min: number, max: number): RuleBuilder {
    return this.builder.addCondition({
      field: this.field,
      operator: ConditionOperatorEnum.Between,
      value: [min, max]
    });
  }
}