import { describe, it, expect, beforeEach } from 'vitest';
import { RuleBuilder } from '../src/rule-builder';
import { RuleType, ActionType, ConditionOperator } from '../src/generated/types';

describe('RuleBuilder', () => {
  let builder: RuleBuilder;

  beforeEach(() => {
    builder = new RuleBuilder();
  });

  describe('Basic rule building', () => {
    it('should build a simple discount rule with fluent API', () => {
      const rule = builder
        .name('10% Israel Discount')
        .description('10% discount for all orders in Israel')
        .category(RuleCategory.Discount)
        .priority(100)
        .when()
          .country().equals('IL')
        .then()
          .applyDiscountPercentage(10)
        .build();

      expect(rule).toMatchObject({
        name: '10% Israel Discount',
        description: '10% discount for all orders in Israel',
        category: RuleCategory.Discount,
        priority: 100,
        isActive: true,
        conditions: [{
          field: 'country',
          operator: ConditionOperator.Equals,
          value: 'IL'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 10
        }]
      });
    });

    it('should build a markup rule with multiple conditions', () => {
      const rule = builder
        .name('Premium Bundle Markup')
        .category(RuleCategory.BundleAdjustment)
        .when()
          .bundleGroup().equals('Premium')
          .and()
          .duration().greaterThan(15)
        .then()
          .addMarkup(25.00)
        .build();

      expect(rule.conditions).toHaveLength(2);
      expect(rule.conditions[0]).toMatchObject({
        field: 'bundleGroup',
        operator: ConditionOperator.Equals,
        value: 'Premium'
      });
      expect(rule.conditions[1]).toMatchObject({
        field: 'duration',
        operator: ConditionOperator.GreaterThan,
        value: 15
      });
    });

    it('should handle complex nested conditions', () => {
      const rule = builder
        .name('Complex Regional Rule')
        .category(RuleCategory.Discount)
        .when()
          .region().equals('Europe')
          .and()
          .duration().between(7, 30)
          .and()
          .paymentMethod().in(['FOREIGN_CARD', 'AMEX'])
        .then()
          .applyDiscountPercentage(15)
        .build();

      expect(rule.conditions).toHaveLength(4); // region + duration min/max + payment method
      expect(rule.conditions.find(c => c.field === 'region')).toMatchObject({
        field: 'region',
        operator: ConditionOperator.Equals,
        value: 'Europe'
      });
      expect(rule.conditions.filter(c => c.field === 'duration')).toHaveLength(2);
      expect(rule.conditions.find(c => c.field === 'paymentMethod')).toMatchObject({
        field: 'paymentMethod',
        operator: ConditionOperator.In,
        value: ['FOREIGN_CARD', 'AMEX']
      });
    });
  });

  describe('Validation and error handling', () => {
    it('should throw error when building without required fields', () => {
      expect(() => {
        builder.build();
      }).toThrow('Rule name is required');

      expect(() => {
        builder.name('Test Rule').build();
      }).toThrow('Rule category is required');

      expect(() => {
        builder.name('Test Rule').category(RuleCategory.Discount).build();
      }).toThrow('At least one action is required');
    });

    it('should validate priority range', () => {
      expect(() => {
        builder
          .name('Test Rule')
          .category(RuleCategory.Discount)
          .priority(-1)
          .when().country().equals('US')
          .then().applyDiscountPercentage(10)
          .build();
      }).toThrow('Priority must be between 0 and 1000');

      expect(() => {
        builder
          .name('Test Rule')
          .category(RuleCategory.Discount)
          .priority(1001)
          .when().country().equals('US')
          .then().applyDiscountPercentage(10)
          .build();
      }).toThrow('Priority must be between 0 and 1000');
    });

    it('should validate discount percentage range', () => {
      expect(() => {
        builder
          .name('Invalid Discount')
          .category(RuleCategory.Discount)
          .when().country().equals('US')
          .then().applyDiscountPercentage(101)
          .build();
      }).toThrow('Discount percentage must be between 0 and 100');

      expect(() => {
        builder
          .name('Invalid Discount')
          .category(RuleCategory.Discount)
          .when().country().equals('US')
          .then().applyDiscountPercentage(-5)
          .build();
      }).toThrow('Discount percentage must be between 0 and 100');
    });

    it('should validate processing rate range', () => {
      expect(() => {
        builder
          .name('Invalid Processing')
          .category(RuleCategory.Fee)
          .when().paymentMethod().equals('FOREIGN_CARD')
          .then().setProcessingRate(101)
          .build();
      }).toThrow('Processing rate must be between 0 and 100');
    });
  });

  describe('Temporal conditions', () => {
    it('should handle date-based validity periods', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const rule = builder
        .name('Holiday Season Discount')
        .category(RuleCategory.Discount)
        .validFrom(startDate)
        .validUntil(endDate)
        .when()
          .country().equals('US')
        .then()
          .applyDiscountPercentage(20)
        .build();

      expect(rule.validFrom).toBe(startDate.toISOString());
      expect(rule.validUntil).toBe(endDate.toISOString());
    });

    it('should accept string dates', () => {
      const rule = builder
        .name('Q1 Promotion')
        .category(RuleCategory.Discount)
        .validFrom('2024-01-01T00:00:00.000Z')
        .validUntil('2024-03-31T23:59:59.999Z')
        .when().region().equals('North America')
        .then().applyFixedDiscount(5.00)
        .build();

      expect(rule.validFrom).toBe('2024-01-01T00:00:00.000Z');
      expect(rule.validUntil).toBe('2024-03-31T23:59:59.999Z');
    });
  });

  describe('Multiple actions', () => {
    it('should support multiple actions in a single rule', () => {
      const rule = builder
        .name('Premium Processing')
        .category(RuleCategory.Fee)
        .when()
          .paymentMethod().equals('AMEX')
        .then()
          .setProcessingRate(5.5)
          .addMarkup(2.00)
        .build();

      expect(rule.actions).toHaveLength(2);
      expect(rule.actions[0]).toMatchObject({
        type: ActionType.SetProcessingRate,
        value: 5.5
      });
      expect(rule.actions[1]).toMatchObject({
        type: ActionType.AddMarkup,
        value: 2.00
      });
    });
  });

  describe('Condition chaining', () => {
    it('should support various condition operators', () => {
      const rule = builder
        .name('Complex Condition Rule')
        .category(RuleCategory.Discount)
        .when()
          .custom('bundle.isUnlimited').equals(true)
          .and()
          .duration().lessThan(30)
          .and()
          .cost().greaterThanOrEqual(50)
          .and()
          .region().notEquals('Asia')
          .and()
          .bundleGroup().contains('Premium')
        .then()
          .applyDiscountPercentage(25)
        .build();

      expect(rule.conditions).toHaveLength(5);
      
      const conditions = rule.conditions;
      expect(conditions.find(c => c.field === 'bundle.isUnlimited')).toMatchObject({
        operator: ConditionOperator.Equals,
        value: true
      });
      expect(conditions.find(c => c.field === 'duration')).toMatchObject({
        operator: ConditionOperator.LessThan,
        value: 30
      });
      expect(conditions.find(c => c.field === 'cost')).toMatchObject({
        operator: ConditionOperator.GreaterThanOrEqual,
        value: 50
      });
      expect(conditions.find(c => c.field === 'region')).toMatchObject({
        operator: ConditionOperator.NotEquals,
        value: 'Asia'
      });
      expect(conditions.find(c => c.field === 'bundleGroup')).toMatchObject({
        operator: ConditionOperator.Contains,
        value: 'Premium'
      });
    });
  });

  describe('System rules', () => {
    it('should build system markup rules', () => {
      const rule = builder
        .name('Base System Markup')
        .category(RuleCategory.BundleAdjustment)
        .priority(1000)
        .when()
          .bundleGroup().notEquals('')
        .then()
          .addMarkup(15.00)
        .build();

      expect(rule.category).toBe(RuleCategory.BundleAdjustment);
      expect(rule.priority).toBe(1000);
      expect(rule.actions[0].type).toBe(ActionType.AddMarkup);
    });

    it('should build constraint rules', () => {
      const rule = builder
        .name('Minimum Profit Constraint')
        .category(RuleCategory.Constraint)
        .priority(900)
        .when()
          .custom('profit').lessThan(1.50)
        .then()
          .setMinimumProfit(1.50)
        .build();

      expect(rule.category).toBe(RuleCategory.Constraint);
      expect(rule.conditions[0]).toMatchObject({
        field: 'profit',
        operator: ConditionOperator.LessThan,
        value: 1.50
      });
      expect(rule.actions[0]).toMatchObject({
        type: ActionType.SetMinimumProfit,
        value: 1.50
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string values', () => {
      const rule = builder
        .name('Empty String Test')
        .category(RuleCategory.Discount)
        .when()
          .country().equals('')
        .then()
          .applyDiscountPercentage(5)
        .build();

      expect(rule.conditions[0].value).toBe('');
    });

    it('should handle zero values', () => {
      const rule = builder
        .name('Zero Value Test')
        .category(RuleCategory.BundleAdjustment)
        .when()
          .duration().equals(0)
        .then()
          .addMarkup(0)
        .build();

      expect(rule.conditions[0].value).toBe(0);
      expect(rule.actions[0].value).toBe(0);
    });

    it('should reset builder state after build', () => {
      const rule1 = builder
        .name('First Rule')
        .category(RuleCategory.Discount)
        .when().country().equals('US')
        .then().applyDiscountPercentage(10)
        .build();

      // Builder should be reset, so building again should fail
      expect(() => builder.build()).toThrow('Rule name is required');

      // Should be able to build a completely different rule
      const rule2 = builder
        .name('Second Rule')
        .category(RuleCategory.Fee)
        .when().paymentMethod().equals('AMEX')
        .then().setProcessingRate(3.5)
        .build();

      expect(rule2.name).toBe('Second Rule');
      expect(rule2.conditions).not.toEqual(rule1.conditions);
    });
  });

  describe('Custom field conditions', () => {
    it('should support deep nested field paths', () => {
      const rule = builder
        .name('Nested Field Rule')
        .category(RuleCategory.Discount)
        .when()
          .custom('bundle.metadata.tags').contains('promotional')
          .and()
          .custom('customer.profile.tier').equals('premium')
        .then()
          .applyDiscountPercentage(30)
        .build();

      expect(rule.conditions).toHaveLength(2);
      expect(rule.conditions[0]).toMatchObject({
        field: 'bundle.metadata.tags',
        operator: ConditionOperator.Contains,
        value: 'promotional'
      });
      expect(rule.conditions[1]).toMatchObject({
        field: 'customer.profile.tier',
        operator: ConditionOperator.Equals,
        value: 'premium'
      });
    });
  });
});