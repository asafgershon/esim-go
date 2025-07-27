import {
  ActionType as ActionTypeEnum,
  ConditionOperator as ConditionOperatorEnum,
  type CreatePricingRuleInput,
  type RuleAction,
  type RuleCondition,
  type RuleType,
  RuleType as RuleTypeEnum
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

  type(type: RuleType): this {
    this.rule.type = type;
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
    this.rule.type = RuleTypeEnum.SystemMarkup; // System rules are immutable
    return this;
  }

  addCondition(condition: RuleCondition): this {
    if (!this.rule.conditions) {
      this.rule.conditions = [];
    }
    this.rule.conditions.push(condition);
    return this;
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
    if (!this.rule.type) {
      this.rule.type = RuleTypeEnum.BusinessDiscount; // Default type
    }
    if (!this.rule.conditions || this.rule.conditions.length === 0) {
      throw new Error('At least one condition is required');
    }
    if (!this.rule.actions || this.rule.actions.length === 0) {
      throw new Error('At least one action is required');
    }

    return this.rule as CreatePricingRuleInput;
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
  bundleGroup(): BundleCondition {
    return new BundleCondition(this.builder, 'bundleGroup');
  }

  duration(): NumericCondition {
    return new NumericCondition(this.builder, 'duration');
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
class StringCondition extends BaseCondition<string> {}

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

class GenericCondition extends BaseCondition<any> {
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
}