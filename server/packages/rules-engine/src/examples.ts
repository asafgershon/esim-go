import { RuleBuilder } from './rule-builder';
import { RuleType } from './types';

// Example rules that match your use cases

// 1. 20% discount across country, but markup is per bundle
export const countryDiscountRule = new RuleBuilder()
  .name("Germany 20% Discount")
  .type(RuleType.BusinessDiscount)
  .when()
    .country().equals("DE")
  .then()
    .applyDiscount(20)
  .priority(50)
  .build();

// 2. Discount to all bundles that are unlimited and in Europe
export const europeUnlimitedDiscountRule = new RuleBuilder()
  .name("Europe Unlimited Bundles 15% Off")
  .type(RuleType.BusinessDiscount)
  .when()
    .region().equals("Europe")
  .when()
    .field("bundle.isUnlimited").equals(true)
  .then()
    .applyDiscount(15)
  .priority(40)
  .build();

// 3. A 10-day discount in Kiev (Ukraine)
export const kiev10DayDiscountRule = new RuleBuilder()
  .name("Kiev 10-Day Special")
  .type(RuleType.BusinessDiscount)
  .when()
    .field("bundle.countryName").equals("Ukraine")
  .when()
    .duration().equals(10)
  .then()
    .applyDiscount(25)
  .priority(60)
  .build();

// System rules for markup (these would be migrated from DB)
export const unlimitedLite3DayMarkupRule = new RuleBuilder()
  .name("Standard Unlimited Lite 3-day Markup")
  .type(RuleType.SystemMarkup)
  .when()
    .bundleGroup().equals("Standard - Unlimited Lite")
  .when()
    .duration().equals(3)
  .then()
    .addMarkup(5.00)
  .priority(100)
  .immutable()
  .build();

export const unlimitedLite7DayMarkupRule = new RuleBuilder()
  .name("Standard Unlimited Lite 7-day Markup")
  .type(RuleType.SystemMarkup)
  .when()
    .bundleGroup().equals("Standard - Unlimited Lite")
  .when()
    .duration().equals(7)
  .then()
    .addMarkup(12.00)
  .priority(100)
  .immutable()
  .build();

// Processing fee rules
export const israeliCardProcessingRule = new RuleBuilder()
  .name("Israeli Card Processing Fee")
  .type(RuleType.SystemProcessing)
  .when()
    .field("paymentMethod").equals("ISRAELI_CARD")
  .then()
    .setProcessingRate(1.4)
  .priority(90)
  .immutable()
  .build();

export const foreignCardProcessingRule = new RuleBuilder()
  .name("Foreign Card Processing Fee")
  .type(RuleType.SystemProcessing)
  .when()
    .field("paymentMethod").in(["FOREIGN_CARD", "VISA", "MASTERCARD"])
  .then()
    .setProcessingRate(3.9)
  .priority(90)
  .immutable()
  .build();

// Time-limited promotion
export const blackFridayPromotion = new RuleBuilder()
  .name("Black Friday 30% Off")
  .type(RuleType.Promotion)
  .when()
    .date().between("2024-11-29", "2024-12-02")
  .then()
    .applyDiscount(30)
  .priority(80)
  .validFrom("2024-11-29")
  .validUntil("2024-12-02")
  .build();

// First purchase discount
export const newUserDiscountRule = new RuleBuilder()
  .name("New User Welcome - $5 Off")
  .type(RuleType.Segment)
  .when()
    .user().isFirstPurchase()
  .then()
    .applyFixedDiscount(5)
  .priority(70)
  .build();

// Complex rule: Specific country + duration + unlimited
export const complexRule = new RuleBuilder()
  .name("France Unlimited 7-Day Special")
  .type(RuleType.BusinessDiscount)
  .when()
    .country().equals("FR")
  .when()
    .duration().equals(7)
  .when()
    .field("bundle.isUnlimited").equals(true)
  .then()
    .applyDiscount(18)
  .priority(65)
  .build();

// Rule using deep path access
export const userSegmentRule = new RuleBuilder()
  .name("VIP Customer 10% Discount")
  .type(RuleType.Segment)
  .when()
    .field("user.segment").equals("VIP")
  .then()
    .applyDiscount(10)
  .priority(55)
  .build();