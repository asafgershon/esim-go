import {
  PricingEngine,
  type PricingEngineInput,
  type PricingEngineOutput,
} from "@hiilo/rules-engine";
import {
  calculatePricing as calculatePricingV2,
  type RequestFacts,
  type PricingEngineV2Result,
} from "@hiilo/rules-engine-2";
import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import type {
  Bundle,
  CalculatePriceInput,
  Country,
  PaymentMethod,
  PricingBreakdown,
  PricingRule,
  QueryResolvers,
} from "../types";

const logger = createLogger({
  component: "PricingResolvers",
  operationType: "graphql-resolver",
});

// Create a pricing engine instance
const pricingEngine = new PricingEngine();

// Helper function to map payment method enum
const mapPaymentMethodEnum = (paymentMethod: any): PaymentMethod => {
  return paymentMethod || "ISRAELI_CARD";
};

// Helper function to generate correlation ID
const generateCorrelationId = (): string => {
  return `pricing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Helper function to normalize group names for consistency between bundles and rules
const normalizeGroupName = (groupName: string): string => {
  if (!groupName) return "";

  // Remove any hyphens and normalize whitespace
  // This ensures consistency between bundle data and rule conditions
  return groupName
    .replace(/-/g, "") // Remove hyphens
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

// Helper function to get correlation ID from context or generate new one
const getCorrelationId = (context: Context): string => {
  // Check for correlation ID in request headers
  const headerCorrelationId =
    context.req?.headers?.["x-correlation-id"] ||
    context.req?.get?.("x-correlation-id");

  if (headerCorrelationId) {
    logger.debug("Using client-provided correlation ID", {
      correlationId: headerCorrelationId,
      operationType: "correlation-id",
    });
    return headerCorrelationId;
  }

  // Generate new one if not provided
  const newCorrelationId = generateCorrelationId();
  logger.debug("Generated new correlation ID", {
    correlationId: newCorrelationId,
    operationType: "correlation-id",
  });
  return newCorrelationId;
};

/**
 * Get active pricing rules using repository
 */
async function getActivePricingRules(context: Context): Promise<PricingRule[]> {
  try {
    const rules = await context.repositories.pricingRules.findActiveRules();
    return rules;
  } catch (error) {
    logger.error("Failed to fetch pricing rules", error as Error, {
      operationType: "fetch-pricing-rules",
    });
    return [];
  }
}

/**
 * Shared function to calculate pricing for a single bundle
 * This is the single source of truth for all pricing calculations
 */
export async function calculatePricingForBundle(
  bundle: Bundle,
  paymentMethod: PaymentMethod,
  context: Context,
  correlationId?: string
): Promise<PricingBreakdown> {
  const finalCorrelationId = correlationId || getCorrelationId(context);

  try {
    logger.info("Calculating pricing for bundle", {
      bundleName: bundle.name,
      paymentMethod,
      correlationId: finalCorrelationId,
      operationType: "calculate-bundle-pricing",
    });

    // 1. Get active pricing rules
    const rules = await getActivePricingRules(context);

    // 2. Clear and add rules to engine
    pricingEngine.clearRules();
    pricingEngine.addRules(rules);

    // 3. Create pricing engine input
    const engineInput: PricingEngineInput = {
      context: {
        bundles: [bundle],
        customer: {
          id: context.auth?.user?.id || "anonymous",
          segment: "default",
        },
        payment: {
          method: paymentMethod,
          promo: undefined,
        },
        rules,
        date: new Date(),
      },
      request: {
        duration: bundle.validityInDays,
        paymentMethod,
        countryISO: bundle.countries?.[0] || "",
        dataType: (bundle.isUnlimited ? "unlimited" : "fixed") as
          | "unlimited"
          | "fixed",
      },
      metadata: {
        correlationId: finalCorrelationId,
        timestamp: new Date(),
        userId: context.auth?.user?.id,
      },
    };

    // Also log what will be available in the engine state structure
    logger.info("Engine input structure for field matching", {
      bundleName: bundle.name,
      bundleGroups: bundle.groups,
      normalizedGroup: normalizeGroupName(bundle.groups?.[0] || ""),
      contextBundles: engineInput.context.bundles.map((b) => ({
        name: b.name,
        groups: b.groups,
        isUnlimited: b.isUnlimited,
        validityInDays: b.validityInDays,
      })),
      correlationId: finalCorrelationId,
      operationType: "engine-state-debug",
    });

    // 5. Calculate pricing
    const result = await pricingEngine.calculatePrice(engineInput);

    // 6. Map to GraphQL PricingBreakdown
    return mapEngineToPricingBreakdown(result, bundle);
  } catch (error) {
    logger.error("Failed to calculate bundle pricing", error as Error, {
      bundleName: bundle.name,
      correlationId: finalCorrelationId,
      operationType: "calculate-bundle-pricing",
    });
    throw new GraphQLError("Failed to calculate pricing", {
      extensions: { code: "PRICING_CALCULATION_FAILED" },
    });
  }
}

/**
 * Core function that maps PricingEngineOutput to PricingBreakdown
 * This is the single source of truth for pricing data transformation
 */
function mapEngineToPricingBreakdown(
  engineOutput: PricingEngineOutput,
  bundleOrInput: Bundle | CalculatePriceInput
): PricingBreakdown {
  // Log basic engine output structure for debugging
  logger.debug("Engine output structure", {
    hasResponse: !!engineOutput.response,
    hasProcessing: !!engineOutput.processing,
    appliedRulesCount: engineOutput.response?.appliedRules?.length || 0,
    stepsCount: engineOutput.processing?.steps?.length || 0,
    operationType: "engine-output-summary",
  });

  const pricing = engineOutput.response.pricing;
  const selectedBundle = engineOutput.response.selectedBundle;

  // Extract bundle selection reason from pipeline steps
  const bundleSelectionStep = engineOutput.processing.steps?.find(
    (step: any) => step.name === "BUNDLE_SELECTION"
  );
  const selectedReason = bundleSelectionStep?.debug?.reason || "calculated";

  // Determine country based on input type
  const countryIso =
    "countryId" in bundleOrInput
      ? (bundleOrInput as CalculatePriceInput).countryId || ""
      : (bundleOrInput as Bundle).countries?.[0] || "";

  const duration =
    "numOfDays" in bundleOrInput
      ? bundleOrInput.numOfDays
      : bundleOrInput.validityInDays;

  if (!countryIso) {
    throw new GraphQLError("Country not found", {
      extensions: { code: "COUNTRY_NOT_FOUND", countryId: countryIso },
    });
  }

  return {
    __typename: "PricingBreakdown",

    // Bundle Information - Public
    bundle: {
      __typename: "CountryBundle",
      id: selectedBundle?.name || `bundle_${countryIso}_${duration}d`,
      name: selectedBundle?.name || `${duration} Day Plan`,
      duration: selectedBundle?.validityInDays || duration || 1,
      data: selectedBundle?.dataAmountMB || null,
      isUnlimited: selectedBundle?.isUnlimited || false,
      currency: selectedBundle?.currency || "USD",
      group: selectedBundle?.groups?.[0] || null, // Add the group field
      country: {
        iso: countryIso || "",
        name: countryIso || "", // Will be resolved by country resolver
        region: selectedBundle?.region || "",
      } as Country,
    },

    country: {
      iso: countryIso || "",
      name: countryIso || "",
      region: selectedBundle?.region || "",
    },

    duration: duration || 1,
    currency: selectedBundle?.currency || "USD",

    // Public pricing fields (what users pay)
    totalCost: pricing?.totalCost || 0, // Total cost (cost + markup) before discounts
    discountValue: pricing?.discountValue || 0, // Total discount amount
    priceAfterDiscount: pricing?.priceAfterDiscount || 0, // Final price users pay

    // Admin-only business sensitive fields (auto-hidden by @auth directive)
    cost: pricing?.cost || 0, // Base cost from supplier
    markup: pricing?.markup || 0, // Markup amount added to cost
    discountRate: pricing?.discountRate || 0, // Discount percentage
    processingRate: pricing?.processingRate || 0, // Processing fee percentage
    processingCost: pricing?.processingCost || 0, // Processing fee amount
    finalRevenue: pricing?.finalRevenue || 0, // What customer pays
    revenueAfterProcessing: pricing?.revenueAfterProcessing || 0, // What we receive after processing fees
    netProfit: pricing?.netProfit || 0, // Final profit
    discountPerDay: pricing?.discountPerDay || 0, // Per-day discount rate

    // Rule-based pricing breakdown - Admin only
    appliedRules: (() => {
      // Get applied rules from the engine response (this is where the engine places them)
      const rules = engineOutput.response?.appliedRules || [];

      logger.info("Applied rules mapping", {
        rulesCount: rules.length,
        ruleNames: rules.map((r: PricingRule) => r.name || "Unknown"),
        ruleCategories: rules.map((r: PricingRule) => r.category || "Unknown"),
        operationType: "applied-rules-mapping",
      });

      // Calculate impact for each rule based on its actions
      return rules.map((rule: PricingRule) => {
        let impact = 0;

        // Calculate impact from rule actions
        if (rule.actions) {
          for (const action of rule.actions) {
            switch (action.type) {
              case "ADD_MARKUP":
                impact += action.value || 0;
                break;
              case "APPLY_DISCOUNT_PERCENTAGE":
                // Negative impact for discounts
                impact -= action.value || 0;
                break;
              case "APPLY_FIXED_DISCOUNT":
                // Negative impact for fixed discounts
                impact -= action.value || 0;
                break;
              case "SET_PROCESSING_RATE":
                // Processing rate impact (calculated as percentage of total)
                impact +=
                  ((pricing?.priceAfterDiscount || 0) * (action.value || 0)) /
                  100;
                break;
              default:
                // For other action types, use the value as-is
                impact += action.value || 0;
            }
          }
        }

        return {
          id: rule.id,
          name: rule.name,
          category: rule.category,
          impact: Math.round(impact * 100) / 100, // Round to 2 decimal places
        };
      });
    })(),

    discounts:
      pricing.discounts?.map((discount) => ({
        ruleName: discount.ruleName || "Unknown",
        amount: discount.amount || 0,
        type: discount.type || "fixed",
      })) || [],

    // Pipeline metadata - Admin only
    unusedDays: engineOutput.response.unusedDays || 0,
    selectedReason,

    // Additional pricing engine fields - Admin only
    totalCostBeforeProcessing: pricing?.priceAfterDiscount || 0, // Price before processing fees

    // Internal field used by field resolvers - cache the pricing calculation data
    _pricingCalculation: {
      appliedRules:
        engineOutput.response?.appliedRules?.map((rule: PricingRule) => {
          let impact = 0;

          // Calculate impact from rule actions
          if (rule.actions) {
            for (const action of rule.actions) {
              switch (action.type) {
                case "ADD_MARKUP":
                  impact += action.value || 0;
                  break;
                case "APPLY_DISCOUNT_PERCENTAGE":
                  // Negative impact for discounts
                  impact -= action.value || 0;
                  break;
                case "APPLY_FIXED_DISCOUNT":
                  // Negative impact for fixed discounts
                  impact -= action.value || 0;
                  break;
                case "SET_PROCESSING_RATE":
                  // Processing rate impact (calculated as percentage of total)
                  impact +=
                    ((pricing?.priceAfterDiscount || 0) * (action.value || 0)) /
                    100;
                  break;
                default:
                  // For other action types, use the value as-is
                  impact += action.value || 0;
              }
            }
          }

          return {
            id: rule.id,
            name: rule.name,
            category: rule.category,
            impact: Math.round(impact * 100) / 100, // Round to 2 decimal places
          };
        }) || [],
      discounts: pricing.discounts || [],
    },
  } as PricingBreakdown;
}

// Payment method configurations - single source of truth
const PAYMENT_METHODS_CONFIG = [
  {
    value: "ISRAELI_CARD" as PaymentMethod,
    label: "Israeli Card",
    description: "1.4% processing fee",
    processingRate: 0.014,
    icon: "credit-card",
    isActive: true,
  },
  {
    value: "FOREIGN_CARD" as PaymentMethod,
    label: "Foreign Card",
    description: "3.9% processing fee",
    processingRate: 0.039,
    icon: "credit-card",
    isActive: true,
  },
  {
    value: "BIT" as PaymentMethod,
    label: "Bit Payment",
    description: "0.7% processing fee",
    processingRate: 0.007,
    icon: "smartphone",
    isActive: true,
  },
  {
    value: "AMEX" as PaymentMethod,
    label: "American Express",
    description: "5.7% processing fee",
    processingRate: 0.057,
    icon: "credit-card",
    isActive: true,
  },
  {
    value: "DINERS" as PaymentMethod,
    label: "Diners Club",
    description: "6.4% processing fee",
    processingRate: 0.064,
    icon: "credit-card",
    isActive: true,
  },
];

// Unified pricing resolvers
export const pricingQueries: QueryResolvers = {
  /**
   * Single pricing calculation - returns PricingBreakdown with all fields
   * Field-level auth directives control access to sensitive data
   */
  calculatePrice: async (
    _,
    { numOfDays, countryId, paymentMethod, regionId, groups },
    context: Context
  ): Promise<PricingBreakdown> => {
    const correlationId = getCorrelationId(context);

    try {
      logger.info("Calculating single price", {
        countryId,
        numOfDays,
        paymentMethod,
        correlationId,
        operationType: "calculate-price",
      });

      // 1. Get available bundles from catalog
      const catalogResponse = await context.repositories.bundles.search({
        countries: [countryId || ""],
        minValidityInDays: 1,
        groups: groups?.filter(Boolean) || [],
      });

      if (!catalogResponse.data || catalogResponse.data.length === 0) {
        throw new GraphQLError("No bundles found for the specified country", {
          extensions: { code: "NO_BUNDLES_FOUND", countryId },
        });
      }

      // 2. Convert catalog bundles to GraphQL Bundle format
      const bundles = catalogResponse.data.map(
        (catalogBundle) =>
          ({
            name: catalogBundle.esim_go_name || "Unknown Bundle",
            description: catalogBundle.description,
            groups: catalogBundle.groups || [],
            validityInDays: catalogBundle.validity_in_days || 1,
            dataAmountMB: catalogBundle.data_amount_mb,
            dataAmountReadable: catalogBundle.data_amount_readable || "Unknown",
            isUnlimited: Boolean(catalogBundle.is_unlimited),
            countries: [countryId],
            region: catalogBundle.region,
            speed: [],
            basePrice: catalogBundle.price || 0,
            currency: "USD",
            pricingBreakdown: undefined,
          } satisfies Bundle)
      );

      // 3. Get active rules and configure engine
      const rules = await getActivePricingRules(context);

      // Debug logging
      logger.info("DEBUG: Pricing calculation context", {
        correlationId,
        totalBundles: bundles.length,
        requestedDays: numOfDays,
        groups: groups,
        totalRules: rules.length,
        operationType: "calculate-price-debug",
      });

      pricingEngine.clearRules();
      pricingEngine.addRules(rules);

      // 4. Create engine input with all bundles
      const engineInput: PricingEngineInput = {
        context: {
          bundles,
          customer: {
            id: context.auth?.user?.id || "anonymous",
            segment: "default",
          },
          payment: {
            method: mapPaymentMethodEnum(paymentMethod),
            promo: undefined,
          },
          rules,
          date: new Date(),
        },
        request: {
          duration: numOfDays,
          paymentMethod: mapPaymentMethodEnum(paymentMethod),
          countryISO: countryId || "",
          dataType:
            groups
              ?.map((g) => g.toLowerCase().includes("unlimited"))
              ?.includes(true) || false
              ? "unlimited"
              : ("fixed" as "unlimited" | "fixed"),
        },
        metadata: {
          correlationId,
          timestamp: new Date(),
          userId: context.auth?.user?.id,
        },
      };

      // 5. Let engine select best bundle and calculate pricing
      const result = await pricingEngine.calculatePrice(engineInput);

      // Debug log engine result
      logger.info("DEBUG: Pricing engine result", {
        correlationId,
        selectedBundleName: result.response.selectedBundle?.name,
        selectedBundleGroups: result.response.selectedBundle?.groups,
        processingGroup: result.processing.group,
        appliedRulesCount: result.response.appliedRules?.length || 0,
        appliedRuleNames:
          result.response.appliedRules?.map((r: PricingRule) => r.name) || [],
        pricing: {
          cost: result.response.pricing?.cost,
          markup: result.response.pricing?.markup,
          totalCost: result.response.pricing?.totalCost,
        },
        operationType: "engine-result-debug",
      });

      // 6. Map result to GraphQL format
      const pricingBreakdown = mapEngineToPricingBreakdown(result, {
        numOfDays,
        countryId,
        paymentMethod,
        regionId,
        groups,
      });

      // Debug log for mapped result (single pricing)
      logger.info("DEBUG: Single mapped pricing breakdown for unused days", {
        correlationId,
        unusedDays: pricingBreakdown.unusedDays,
        discountPerDay: pricingBreakdown.discountPerDay,
        operationType: "unused-days-debug-single",
      });

      logger.info("Single price calculated successfully", {
        countryId,
        numOfDays,
        finalPrice: pricingBreakdown.priceAfterDiscount,
        selectedBundle: result.response.selectedBundle?.name,
        correlationId,
        operationType: "calculate-price",
      });

      return pricingBreakdown;
    } catch (error) {
      logger.error("Failed to calculate single price", error as Error, {
        countryId,
        numOfDays,
        correlationId,
        operationType: "calculate-price",
      });

      // Preserve specific error codes and messages for better debugging
      if (error instanceof GraphQLError) {
        throw error;
      }

      throw new GraphQLError("Failed to calculate price", {
        extensions: {
          code: "CALCULATION_FAILED",
          originalError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },

  /**
   * Batch pricing calculation - returns PricingBreakdown[] with all fields
   * Field-level auth directives control access to sensitive data
   */
  calculatePrices: async (
    _,
    { inputs },
    context: Context
  ): Promise<PricingBreakdown[]> => {
    const correlationId = getCorrelationId(context);

    try {
      logger.info("Calculating batch prices", {
        requestCount: inputs.length,
        correlationId,
        operationType: "calculate-prices",
      });

      // Get active rules once for all calculations
      const rules = await getActivePricingRules(context);
      pricingEngine.clearRules();
      pricingEngine.addRules(rules);

      const results: PricingBreakdown[] = [];

      // Process each request
      for (const input of inputs) {
        // Use the same logic as calculatePrice
        const catalogResponse = await context.repositories.bundles.search({
          countries: [input.countryId || ""],
          minValidityInDays: 1,
          groups: input.groups || [],
        });

        if (!catalogResponse.data || catalogResponse.data.length === 0) {
          throw new GraphQLError(
            `No bundles found for country: ${input.countryId}`,
            {
              extensions: {
                code: "NO_BUNDLES_FOUND",
                countryId: input.countryId,
              },
            }
          );
        }

        // Create engine input
        const engineInput: PricingEngineInput = {
          context: {
            bundles: catalogResponse.data.map((b) => {
              return {
                basePrice: b.price || 0,
                countries: b.countries || [],
                currency: "USD",
                dataAmountReadable: b.data_amount_readable || "Unknown",
                groups: b.groups || [],
                isUnlimited: b.is_unlimited || false,
                name: b.esim_go_name || "Unknown",
                region: b.region,
                speed: [],
                validityInDays: b.validity_in_days || 1,
                dataAmountMB: b.data_amount_mb,
              };
            }),
            customer: {
              id: context.auth?.user?.id || "anonymous",
              segment: "default",
            },
            payment: {
              method: mapPaymentMethodEnum(input.paymentMethod),
              promo: undefined,
            },
            rules,
            date: new Date(),
          },
          request: {
            duration: input.numOfDays,
            paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
            countryISO: input.countryId || "",
            dataType:
              input.groups?.includes("Standard Unlimited Essential") ||
              input.groups?.includes("Standard Unlimited Plus") ||
              input.groups?.includes("Standard Unlimited Lite")
                ? "unlimited"
                : ("fixed" as "unlimited" | "fixed"),
          },
          metadata: {
            correlationId: `${correlationId}-${results.length}`,
            timestamp: new Date(),
            userId: context.auth?.user?.id,
          },
        };

        const result = await pricingEngine.calculatePrice(engineInput);

        // Debug log for unused days
        logger.info("DEBUG: Pricing engine result for unused days", {
          correlationId: `${correlationId}-${results.length}`,
          requestedDuration: input.numOfDays,
          selectedBundleDuration:
            result.response.selectedBundle?.validityInDays,
          unusedDays: result.response.unusedDays,
          discountPerDay: result.response.pricing?.discountPerDay,
          operationType: "unused-days-debug",
        });

        const pricingBreakdown = mapEngineToPricingBreakdown(result, input);

        // Debug log for mapped result
        logger.info("DEBUG: Mapped pricing breakdown for unused days", {
          correlationId: `${correlationId}-${results.length}`,
          unusedDays: pricingBreakdown.unusedDays,
          discountPerDay: pricingBreakdown.discountPerDay,
          operationType: "unused-days-debug",
        });

        results.push(pricingBreakdown);
      }

      logger.info("Batch prices calculated successfully", {
        requestCount: inputs.length,
        correlationId,
        operationType: "calculate-prices",
      });

      return results;
    } catch (error) {
      logger.error("Failed to calculate batch prices", error as Error, {
        requestCount: inputs.length,
        correlationId,
        operationType: "calculate-prices",
      });

      if (error instanceof GraphQLError) {
        throw error;
      }

      throw new GraphQLError("Failed to calculate batch prices", {
        extensions: { code: "BATCH_CALCULATION_FAILED" },
      });
    }
  },

  /**
   * Admin pricing rule simulation - returns PricingBreakdown with simulated rule effects
   */
  simulatePricingRule: async (
    _,
    { rule, testContext },
    context: Context
  ): Promise<PricingBreakdown> => {
    const correlationId = getCorrelationId(context);

    try {
      logger.info("Simulating pricing rule (admin)", {
        ruleName: rule.name,
        ruleType: rule.category,
        correlationId,
        operationType: "simulate-pricing-rule",
      });

      // Get existing rules and add the test rule
      const existingRules = await getActivePricingRules(context);
      const testRuleWithId = {
        ...(rule as PricingRule),
        id: "test-rule-simulation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEditable: false,
        createdBy: context.auth?.user?.id || "system",
      };

      // Configure engine with test rule
      pricingEngine.clearRules();
      pricingEngine.addRules([...existingRules, testRuleWithId]);

      // Use calculatePrice logic with test context
      const input: CalculatePriceInput = {
        numOfDays: testContext.duration || 7,
        countryId: testContext.countryId || "US",
        paymentMethod: testContext.paymentMethod,
      };

      // Get bundles for simulation
      const catalogResponse = await context.repositories.bundles.search({
        countries: [input.countryId || ""].filter(Boolean),
        maxValidityInDays: input.numOfDays * 2,
        minValidityInDays: 1,
      });

      if (!catalogResponse.data || catalogResponse.data.length === 0) {
        throw new GraphQLError("No bundles found for simulation", {
          extensions: { code: "NO_BUNDLES_FOUND", countryId: input.countryId },
        });
      }

      // Create engine input
      const engineInput: PricingEngineInput = {
        context: {
          bundles: catalogResponse.data.map((b) => {
            return {
              basePrice: b.price || 0,
              countries: b.countries || [],
              currency: "USD",
              dataAmountReadable: b.data_amount_readable || "Unknown",
              groups: b.groups || [],
              isUnlimited: b.is_unlimited || false,
              name: b.esim_go_name || "Unknown",
              region: b.region,
              speed: [],
              validityInDays: b.validity_in_days || 1,
              dataAmountMB: b.data_amount_mb,
            };
          }),
          customer: {
            id: context.auth?.user?.id || "anonymous",
            segment: "default",
          },
          payment: {
            method: mapPaymentMethodEnum(input.paymentMethod),
            promo: undefined,
          },
          rules: [...existingRules, testRuleWithId],
          date: new Date(),
        },
        request: {
          duration: input.numOfDays,
          paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
          countryISO: input.countryId || "",
          dataType: "unlimited" as "unlimited" | "fixed",
        },
        metadata: {
          correlationId,
          timestamp: new Date(),
          userId: context.auth?.user?.id,
          isSimulation: true,
        },
      };

      const result = await pricingEngine.calculatePrice(engineInput);
      const pricingBreakdown = mapEngineToPricingBreakdown(result, input);

      logger.info("Pricing rule simulation completed (admin)", {
        ruleName: rule.name,
        finalPrice: pricingBreakdown.priceAfterDiscount,
        appliedRules: result.response.appliedRules?.length || 0,
        correlationId,
        operationType: "simulate-pricing-rule",
      });

      return pricingBreakdown;
    } catch (error) {
      logger.error("Failed to simulate pricing rule (admin)", error as Error, {
        ruleName: rule.name,
        correlationId,
        operationType: "simulate-pricing-rule",
      });
      throw new GraphQLError("Failed to simulate pricing rule", {
        extensions: { code: "RULE_SIMULATION_FAILED" },
      });
    }
  },

  /**
   * Get available payment methods with their processing rates
   * This is the single source of truth for payment method configurations
   */
  paymentMethods: async (_, __, context: Context) => {
    logger.info("Fetching payment methods", {
      operationType: "get-payment-methods",
      hasAuth: !!context.auth,
    });

    // Return the configured payment methods
    // In the future, this will be fetched from the rules system
    return PAYMENT_METHODS_CONFIG;
  },

  /**
   * Calculate pricing using the new rules-engine-2
   * Supports both country and region-based pricing
   */
  calculatePrice2: async (
    _: any,
    { input }: { input: CalculatePriceInput },
    context: Context
  ): Promise<PricingBreakdown> => {
    const correlationId = getCorrelationId(context);

    logger.info("Calculating price with rules-engine-2", {
      input,
      correlationId,
      operationType: "calculate-price-v2",
    });

    try {
      const { numOfDays, countryId, regionId, groups } = input;
      // Validate input
      if (!numOfDays || numOfDays < 1) {
        throw new GraphQLError("Invalid number of days", {
          extensions: { code: "INVALID_INPUT" },
        });
      }

      if (!countryId && !regionId) {
        throw new GraphQLError("Either countryId or regionId is required", {
          extensions: { code: "INVALID_INPUT" },
        });
      }

      // Get the group - for now using the first group or a default
      const group = input.groups?.[0] || "Standard Unlimited Essential";

      // Prepare request facts for the engine
      const requestFacts = {
        group,
        days: numOfDays,
        ...(countryId ? { country: countryId! } : {}),
        ...(regionId ? { region: regionId! } : {}),
      } as RequestFacts;

      // Run the v2 engine
      const result = await calculatePricingV2(requestFacts);

      // Map the result to PricingBreakdown format
      const pricingBreakdown: PricingBreakdown = {
        __typename: "PricingBreakdown",

        // Bundle Information
        bundle: {
          __typename: "CountryBundle",
          id:
            result.selectedBundle?.esim_go_name ||
            `bundle_${countryId || regionId}_${numOfDays}d`,
          name: result.selectedBundle?.esim_go_name || "",
          duration: numOfDays,
          data: result.selectedBundle?.data_amount_mb || 0,
          isUnlimited: result.selectedBundle?.is_unlimited || false,
          currency: "USD",
          group,
          country: {
            __typename: "Country",
            iso: result.selectedBundle?.countries?.[0] || "",
          } as Country,
        },

        country: {
          iso: countryId || "",
          name: countryId || "",
          region: regionId || "",
        },

        duration: input.numOfDays,
        currency: "USD",

        // Public pricing fields
        totalCost: result.pricing.totalCost,
        discountValue: result.pricing.discountValue || 0,
        priceAfterDiscount: result.pricing.priceAfterDiscount,

        // Admin-only fields
        cost: result.pricing.cost || 0,
        markup: result.pricing.markup,
        discountRate: 0,
        processingRate: 0,
        processingCost: result.pricing.processingCost || 0,
        finalRevenue: result.pricing.finalRevenue,
        revenueAfterProcessing: result.pricing.finalRevenue,
        netProfit: result.pricing.finalRevenue - (result.pricing.cost || 0),
        discountPerDay: 0,

        // Rule-based pricing breakdown
        appliedRules: [], // V2 doesn't expose applied rules yet
        discounts: [],

        // Pipeline metadata
        unusedDays: result.unusedDays,
        selectedReason: "calculated",

        // Additional fields
        totalCostBeforeProcessing: result.priceWithMarkup,
      };

      logger.info("Price calculated with rules-engine-2", {
        correlationId,
        selectedBundle: result.selectedBundle,
        finalPrice: result.finalPrice,
        operationType: "calculate-price-v2-success",
      });

      return pricingBreakdown;
    } catch (error) {
      logger.error(
        "Failed to calculate price with rules-engine-2",
        error as Error,
        {
          correlationId,
          input,
          operationType: "calculate-price-v2-error",
        }
      );
      throw new GraphQLError("Failed to calculate pricing", {
        extensions: {
          code: "PRICING_ERROR",
          originalError: (error as Error).message,
        },
      });
    }
  },

  /**
   * Calculate multiple prices using the new rules-engine-2
   * Batch processing for multiple input combinations
   */
  calculatePrices2: async (
    _: any,
    { inputs }: { inputs: CalculatePriceInput[] },
    context: Context
  ): Promise<PricingBreakdown[]> => {
    const correlationId = getCorrelationId(context);

    logger.info("Calculating batch prices with rules-engine-2", {
      requestCount: inputs.length,
      correlationId,
      operationType: "calculate-prices-v2",
    });

    try {
      const results: PricingBreakdown[] = [];

      // Process each input request
      for (const input of inputs) {
        // Validate input
        if (!input.numOfDays || input.numOfDays < 1) {
          logger.warn("Skipping invalid input in batch", {
            input,
            correlationId,
            operationType: "calculate-prices-v2-skip",
          });
          continue;
        }

        if (!input.countryId && !input.regionId) {
          logger.warn("Skipping input without country or region", {
            input,
            correlationId,
            operationType: "calculate-prices-v2-skip",
          });
          continue;
        }

        const group = input.groups?.[0] || "Standard Unlimited Essential";

        // Prepare request facts for the engine
        const requestFacts = {
          group,
          days: input.numOfDays,
          ...(input.countryId ? { country: input.countryId } : {}),
          ...(input.regionId ? { region: input.regionId } : {}),
        } as RequestFacts;

        try {
          // Run the v2 engine for this input
          const result = await calculatePricingV2(requestFacts);

          // Map the result to PricingBreakdown format
          results.push({
            __typename: "PricingBreakdown",

            bundle: {
              __typename: "CountryBundle",
              id:
                result.selectedBundle?.esim_go_name ||
                `bundle_${input.countryId || input.regionId}_${
                  input.numOfDays
                }d` ||
                "",
              name:
                result.selectedBundle?.esim_go_name ||
                `${input.numOfDays} Day Plan`,
              duration: input.numOfDays,
              data: result.selectedBundle?.data_amount_mb || 0,
              isUnlimited: result.selectedBundle?.is_unlimited || false,
              currency: "USD",
              group: group,
              country: {
                iso: input.countryId || "",
                name: input.countryId || "",
                region: input.regionId || "",
              } as Country,
            },

            country: {
              iso: input.countryId || "",
              name: input.countryId || "",
              region: input.regionId || "",
            },

            duration: input.numOfDays,
            currency: "USD",

            totalCost: result.pricing.totalCost,
            discountValue: result.pricing.discountValue || 0,
            priceAfterDiscount: result.pricing.priceAfterDiscount,

            cost: result.pricing.cost || 0,
            markup: result.pricing.markup,
            discountRate: 0,
            processingRate: 0,
            processingCost: result.pricing.processingCost || 0,
            finalRevenue: result.pricing.finalRevenue,
            revenueAfterProcessing: result.pricing.finalRevenue,
            netProfit: result.pricing.finalRevenue - (result.pricing.cost || 0),
            discountPerDay: result.pricing.discountPerDay || 0,

            appliedRules: [],
            discounts: [],

            unusedDays: result.unusedDays,
            selectedReason: "calculated",

            totalCostBeforeProcessing: result.priceWithMarkup,
          });
        } catch (error) {
          logger.error(
            "Failed to calculate price for input in batch",
            error as Error,
            {
              correlationId,
              input,
              operationType: "calculate-prices-v2-item-error",
            }
          );
          // Continue processing other inputs even if one fails
        }
      }

      logger.info("Batch prices calculated with rules-engine-2", {
        correlationId,
        requestCount: inputs.length,
        resultCount: results.length,
        operationType: "calculate-prices-v2-success",
      });

      return results;
    } catch (error) {
      logger.error(
        "Failed to calculate batch prices with rules-engine-2",
        error as Error,
        {
          correlationId,
          inputCount: inputs.length,
          operationType: "calculate-prices-v2-error",
        }
      );
      throw new GraphQLError("Failed to calculate pricing", {
        extensions: {
          code: "PRICING_ERROR",
          originalError: (error as Error).message,
        },
      });
    }
  },
};

// Export unified pricing resolvers
export const pricingResolvers = {
  Query: pricingQueries,
};
