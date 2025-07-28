import { describe, it, expect, beforeEach } from "vitest";
import { PricingEngine } from "../src/pricing-engine";
import { PricingEngineInput } from "../src/rules-engine-types";
import {
  ActionType,
  ConditionOperator,
  PaymentMethod,
} from "../src/generated/types";
import { convertToNewInputStructure } from "./test-helpers";

describe("Unlimited Bundle Markup Tests", () => {
  let pricingEngine: PricingEngine;

  const mockRules = [
    {
      id: "11",
      name: "Standard - Unlimited Lite 20% Markup",
      category: "BUNDLE_ADJUSTMENT",
      priority: 200,
      conditions: [
        {
          field: "request.group",
          operator: ConditionOperator.Equals,
          value: "Standard - Unlimited Lite",
        },
      ],
      actions: [
        {
          type: ActionType.AddMarkup,
          value: 20,
          metadata: {},
        },
      ],
      validFrom: new Date("2024-12-23").toISOString(),
      validUntil: null,
    },
    {
      id: "12",
      name: "Standard - Unlimited Essential 25% Markup",
      category: "BUNDLE_ADJUSTMENT",
      priority: 200,
      conditions: [
        {
          field: "request.group",
          operator: "EQUALS",
          value: "Standard - Unlimited Essential",
        },
      ],
      actions: [
        {
          type: ActionType.AddMarkup,
          value: 25,
          metadata: {},
        },
      ],
      validFrom: new Date("2024-12-23").toISOString(),
      validUntil: null,
    },
    {
      id: "13",
      name: "Standard - Unlimited Plus 35% Markup",
      category: "BUNDLE_ADJUSTMENT",
      priority: 200,
      conditions: [
        {
          field: "request.group",
          operator: "EQUALS",
          value: "Standard - Unlimited Plus",
        },
      ],
      actions: [
        {
          type: ActionType.AddMarkup,
          value: 35,
          metadata: {},
        },
      ],
      validFrom: new Date("2024-12-23").toISOString(),
      validUntil: null,
    },
  ];

  beforeEach(() => {
    pricingEngine = new PricingEngine();
    pricingEngine.addRules(mockRules);
  });

  it("should apply 35% markup to 30-day Standard Unlimited Plus bundle", async () => {
    const initialState: PricingEngineInput = convertToNewInputStructure({
      request: {
        duration: 30,
        paymentMethod: PaymentMethod.ForeignCard,
        countryISO: "AL",
        dataType: "unlimited",
        group: "Standard - Unlimited Plus",
      },
      bundles: [
        {
          basePrice: 25,
          countries: ["AL"],
          currency: "USD",
          dataAmountReadable: "30GB",
          groups: ["Standard - Unlimited Plus"],
          isUnlimited: true,
          name: "Standard - Unlimited Plus",
          speed: ["100Mbps"],
          validityInDays: 30,
        },
      ],
      metadata: {
        correlationId: "123",
      },
    });

    const result = await pricingEngine.calculatePrice(initialState);

    // Expected: $35 markup (rule adds fixed amount, not percentage)
    expect(result.response.pricing.markup).toBe(35);
    expect(result.response.pricing.totalCost).toBe(60); // $25 + $35
    expect(result.response.rules).toHaveLength(1);
    expect(result.response.rules[0].name).toBe(
      "Standard - Unlimited Plus 35% Markup"
    );
  });

  it("should apply 20% markup to Standard Unlimited Lite bundle", async () => {
    const initialState: PricingEngineInput = convertToNewInputStructure({
      bundles: [{
        basePrice: 10.0,
        countries: ["US"],
        currency: "USD",
        dataAmountReadable: "Unlimited",
        groups: ["Standard - Unlimited Lite"],
        isUnlimited: true,
        name: "Standard - Unlimited Lite US 7D",
        speed: ["100Mbps"],
        validityInDays: 7,
      }],
      request: {
        duration: 7,
        paymentMethod: PaymentMethod.ForeignCard,
        countryISO: "US",
        dataType: "unlimited",
        group: "Standard - Unlimited Lite",
      },
      metadata: {
        correlationId: "test-lite",
      },
    });

    const result = await pricingEngine.calculatePrice(initialState);

    // Expected: $20 markup (rule adds fixed amount, not percentage)
    expect(result.response.pricing.markup).toBe(20);
    expect(result.response.pricing.totalCost).toBe(30); // $10 + $20
    expect(result.response.rules).toHaveLength(1);
    expect(result.response.rules[0].name).toBe(
      "Standard - Unlimited Lite 20% Markup"
    );
  });

  it("should apply 25% markup to Standard Unlimited Essential bundle", async () => {
    const initialState: PricingEngineInput = convertToNewInputStructure({
      bundles: [{
        basePrice: 20.0,
        countries: ["GB"],
        currency: "USD",
        dataAmountReadable: "Unlimited",
        groups: ["Standard - Unlimited Essential"],
        isUnlimited: true,
        name: "Standard - Unlimited Essential GB 14D",
        speed: ["100Mbps"],
        validityInDays: 14,
      }],
      request: {
        duration: 14,
        paymentMethod: PaymentMethod.ForeignCard,
        countryISO: "GB",
        dataType: "unlimited",
        group: "Standard - Unlimited Essential",
      },
      metadata: {
        correlationId: "test-essential",
      },
    });

    const result = await pricingEngine.calculatePrice(initialState);

    // Expected: $25 markup (rule adds fixed amount, not percentage)
    expect(result.response.pricing.markup).toBe(25);
    expect(result.response.pricing.totalCost).toBe(45); // $20 + $25
    expect(result.response.rules).toHaveLength(1);
    expect(result.response.rules[0].name).toBe(
      "Standard - Unlimited Essential 25% Markup"
    );
  });

  it("should not apply markup to non-unlimited bundles", async () => {
    const initialState: PricingEngineInput = convertToNewInputStructure({
      bundles: [{
        basePrice: 15.0,
        countries: ["FR"],
        currency: "USD",
        dataAmountReadable: "10GB",
        groups: ["Standard Fixed"],
        isUnlimited: false,
        name: "Standard Fixed FR 30D",
        speed: ["4G", "5G"],
        validityInDays: 30,
      }],
      request: {
        duration: 30,
        paymentMethod: PaymentMethod.ForeignCard,
        countryISO: "FR",
        dataType: "fixed",
        group: "Standard Fixed",
      },
      metadata: {
        correlationId: "test-fixed",
      },
    });

    const result = await pricingEngine.calculatePrice(initialState);

    // Expected: No markup for Standard Fixed
    expect(result.response.pricing.markup).toBe(0);
    expect(result.response.pricing.totalCost).toBe(15.0); // No change
    expect(result.response.rules).toHaveLength(0); // No rules applied
  });

  it("should handle group name variations with flexible matching", async () => {
    const testCases = [
      { group: "Standard - Unlimited Plus", expectedMarkup: 35 },
      { group: "Standard-Unlimited Plus", expectedMarkup: 35 },
      { group: "standard - unlimited plus", expectedMarkup: 35 },
      { group: "Standard_Unlimited_Plus", expectedMarkup: 35 },
      { group: "STANDARD - UNLIMITED PLUS", expectedMarkup: 35 },
    ];

    for (const testCase of testCases) {
      const initialState: PricingEngineInput = convertToNewInputStructure({
        bundles: [{
          basePrice: 25.0,
          countries: ["AL"],
          currency: "USD",
          dataAmountReadable: "30GB",
          groups: [testCase.group],
          isUnlimited: true,
          name: "Standard - Unlimited Plus AL 30D",
          speed: ["100Mbps"],
          validityInDays: 30,
        }],
        request: {
          duration: 30,
          paymentMethod: PaymentMethod.ForeignCard,
          countryISO: "AL",
          dataType: "unlimited",
          group: testCase.group,
        },
        metadata: {
          correlationId: `test-flex-${testCase.group}`,
        },
      });

      const result = await pricingEngine.calculatePrice(initialState);

      expect(result.response.pricing.markup).toBe(testCase.expectedMarkup);
      expect(result.response.rules).toHaveLength(1);
      expect(result.response.rules[0].name).toBe(
        "Standard - Unlimited Plus 35% Markup"
      );
    }
  });
});
