import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import {
  Provider,
  type CalculatePriceInput,
  type Country,
  type PaymentMethod,
  type PricingBreakdown,
  type QueryResolvers,
} from "../types";
import { env } from "../config/env";

const logger = createLogger({
  component: "PricingResolvers",
  operationType: "graphql-resolver",
});

export const pricingQueries: QueryResolvers = {
calculatePrice: async (): Promise<PricingBreakdown> => {
  return {} as PricingBreakdown;
},

  calculatePrices: async () => {
    return [];
  },
};

// Unified pricing resolvers
// export const pricingQueries: QueryResolvers = {
//   /**
//    * Single pricing calculation - returns PricingBreakdown with all fields
//    * Field-level auth directives control access to sensitive data
//    */
//   calculatePrice: async (
//     _,
//     { input }: { input: CalculatePriceInput },
//     context: Context
//   ): Promise<PricingBreakdown> => {
//     const correlationId = getCorrelationId(context);

//     logger.info("Calculating price with database-driven engine", {
//       input,
//       correlationId,
//       operationType: "calculate-price-db",
//     });

//     try {
//       const { numOfDays, countryId, regionId, groups, paymentMethod } = input;

//       // Validate input
//       if (!numOfDays || numOfDays < 1) {
//         throw new GraphQLError("Invalid number of days", {
//           extensions: { code: "INVALID_INPUT" },
//         });
//       }

//       if (!countryId && !regionId) {
//         throw new GraphQLError("Either countryId or regionId is required", {
//           extensions: { code: "INVALID_INPUT" },
//         });
//       }

//       // Get the group - for now using the first group or a default
//       const group = groups?.[0] || "Standard Unlimited Essential";

//       // Prepare request facts for the database-driven engine
//       const requestFacts = {
//         group,
//         days: numOfDays,
//         paymentMethod: mapPaymentMethodEnum(paymentMethod),
//         ...(countryId ? { country: countryId } : {}),
//         ...(regionId ? { region: regionId } : {}),
//         // Add coupon code from promo field
//         ...(input.promo ? { couponCode: input.promo } : {}),
//         // Add user information from context for coupon validation and corporate discounts
//         ...(context.auth?.user?.id ? { userId: context.auth.user.id } : {}),
//         ...(context.auth?.user?.email
//           ? { userEmail: context.auth.user.email }
//           : {}),
//         includeDebugInfo: input.includeDebugInfo || false,
//       } as RequestFacts;

//       // Use enhanced version if we need detailed tracking or debug info
//       const useEnhanced =
//         input.includeDebugInfo || context.auth?.user?.role === "ADMIN";

//       const pricingBreakdown = useEnhanced
//         ? await streamCalculatePricing({
//             ...requestFacts,
//             includeEnhancedData: true,
//             includeDebugInfo: env.isDev,
//           })
//         : await streamCalculatePricing({
//             ...requestFacts,
//             includeEnhancedData: false,
//             includeDebugInfo: false,
//           });

//       // Add __typename to the bundle and country objects
//       pricingBreakdown.__typename = "PricingBreakdown";
//       if (pricingBreakdown.bundle) {
//         pricingBreakdown.bundle.__typename = "CountryBundle";
//         if (pricingBreakdown.bundle.country) {
//           pricingBreakdown.bundle.country.__typename = "Country";
//         }
//       }
//       if (pricingBreakdown.country) {
//         pricingBreakdown.country.__typename = "Country";
//       }

//       logger.info("Price calculated successfully with database engine", {
//         correlationId,
//         selectedBundle: pricingBreakdown.bundle?.name,
//         finalPrice: pricingBreakdown.finalPrice,
//         totalCost: pricingBreakdown.totalCost,
//         markup: pricingBreakdown.markup,
//         operationType: "calculate-price-db-success",
//       });

//       return pricingBreakdown;
//     } catch (error) {
//       logger.error("Failed to calculate single price", error as Error, {
//         input,
//         correlationId,
//         operationType: "calculate-price",
//       });

//       // Preserve specific error codes and messages for better debugging
//       if (error instanceof GraphQLError) {
//         throw error;
//       }

//       throw new GraphQLError("Failed to calculate price", {
//         extensions: {
//           code: "CALCULATION_FAILED",
//           originalError: error instanceof Error ? error.message : String(error),
//         },
//       });
//     }
//   },

//   /**
//    * Batch pricing calculation - returns PricingBreakdown[] with all fields
//    * Field-level auth directives control access to sensitive data
//    */
//   calculatePrices: async (
//     _,
//     { inputs },
//     context: Context
//   ): Promise<PricingBreakdown[]> => {
//     const correlationId = getCorrelationId(context);

//     logger.info("Calculating batch prices with database-driven engine", {
//       requestCount: inputs.length,
//       correlationId,
//       operationType: "calculate-prices-db",
//     });

//     try {
//       const results: PricingBreakdown[] = [];

//       // Process each request using the database-driven engine
//       for (const input of inputs) {
//         try {
//           // Validate input
//           if (!input.numOfDays || input.numOfDays < 1) {
//             throw new GraphQLError("Invalid number of days", {
//               extensions: { code: "INVALID_INPUT" },
//             });
//           }

//           if (!input.countryId && !input.regionId) {
//             throw new GraphQLError("Either countryId or regionId is required", {
//               extensions: { code: "INVALID_INPUT" },
//             });
//           }

//           // Get the group - for now using the first group or a default
//           const group = input.groups?.[0] || "Standard Unlimited Essential";

//           // Prepare request facts for the database-driven engine
//           const requestFacts = {
//             group,
//             days: input.numOfDays,
//             paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
//             ...(input.countryId ? { country: input.countryId } : {}),
//             ...(input.regionId ? { region: input.regionId } : {}),
//             // Add coupon code from promo field
//             ...(input.promo ? { couponCode: input.promo } : {}),
//             // Add user information from context for coupon validation and corporate discounts
//             ...(context.auth?.user?.id ? { userId: context.auth.user.id } : {}),
//             ...(context.auth?.user?.email
//               ? { userEmail: context.auth.user.email }
//               : {}),
//           } as RequestFacts;

//           // Run the database-driven pricing engine
//           const result = await calculatePricing(requestFacts);

//           // Map the result to PricingBreakdown format
//           const pricingBreakdown: PricingBreakdown = {
//             __typename: "PricingBreakdown",

//             ...result.pricing,
//             // Bundle Information
//             bundle: {
//               __typename: "CountryBundle",
//               id:
//                 result.selectedBundle?.esim_go_name ||
//                 `bundle_${input.countryId || input.regionId}_${
//                   input.numOfDays
//                 }d`,
//               name: result.selectedBundle?.esim_go_name || "",
//               duration: input.numOfDays,
//               data: result.selectedBundle?.data_amount_mb || 0,
//               isUnlimited: result.selectedBundle?.is_unlimited || false,
//               currency: "USD",
//               group,
//               provider: result.selectedBundle?.provider! as Provider,
//               country: {
//                 __typename: "Country",
//                 iso:
//                   result.selectedBundle?.countries?.[0] ||
//                   input.countryId ||
//                   "",
//               } as Country,
//             },

//             country: {
//               iso: input.countryId || "",
//               name: input.countryId || "",
//               region: input.regionId || "",
//             },

//             duration: input.numOfDays,

//             // Rule-based pricing breakdown
//             appliedRules: result.appliedRules,

//             // Pipeline metadata
//             unusedDays: result.unusedDays,
//             selectedReason: "calculated",

//             // Additional fields
//             totalCostBeforeProcessing: result.pricing.totalCostBeforeProcessing,
//           };

//           results.push(pricingBreakdown);

//           logger.debug("Batch item calculated", {
//             correlationId: `${correlationId}-${results.length}`,
//             countryId: input.countryId,
//             finalPrice: result.pricing.finalPrice,
//             operationType: "batch-item-success",
//           });
//         } catch (itemError) {
//           logger.error("Failed to calculate batch item", itemError as Error, {
//             correlationId: `${correlationId}-${results.length}`,
//             input,
//             operationType: "batch-item-error",
//           });
//           // Continue processing other items
//           throw itemError; // Re-throw to maintain current behavior
//         }
//       }

//       logger.info("Batch prices calculated successfully", {
//         requestCount: inputs.length,
//         correlationId,
//         operationType: "calculate-prices",
//       });

//       return results;
//     } catch (error) {
//       logger.error("Failed to calculate batch prices", error as Error, {
//         requestCount: inputs.length,
//         correlationId,
//         operationType: "calculate-prices",
//       });

//       if (error instanceof GraphQLError) {
//         throw error;
//       }

//       throw new GraphQLError("Failed to calculate batch prices", {
//         extensions: { code: "BATCH_CALCULATION_FAILED" },
//       });
//     }
//   },

//   /**
//    * Get available payment methods with their processing rates
//    * This is the single source of truth for payment method configurations
//    */
//   paymentMethods: async (_, __, context: Context) => {
//     logger.info("Fetching payment methods", {
//       operationType: "get-payment-methods",
//       hasAuth: !!context.auth,
//     });

//     // Return the configured payment methods
//     // In the future, this will be fetched from the rules system
//     return PAYMENT_METHODS_CONFIG;
//   },
// };

export async function calculatePricingForBundle(): Promise<PricingBreakdown> {
  return {} as PricingBreakdown;
}

// Helper function for catalog resolvers to calculate pricing for a bundle
// export async function calculatePricingForBundle(
//   bundle: any,
//   paymentMethod: PaymentMethod,
//   context: Context
// ): Promise<PricingBreakdown> {
//   // Prepare input for the unified calculatePrice query
//   const input: CalculatePriceInput = {
//     numOfDays: bundle.validityInDays || bundle.duration,
//     countryId: bundle.countries?.[0] || bundle.country?.iso,
//     regionId: bundle.region,
//     paymentMethod,
//     groups: [bundle.group || "Standard Unlimited Essential"],
//   };

//   // Call the calculatePrice function directly (not through the resolver object)
//   const calculatePriceResolver = pricingQueries.calculatePrice as (
//     _: any,
//     args: { input: CalculatePriceInput },
//     context: Context
//   ) => Promise<PricingBreakdown>;

//   return calculatePriceResolver(null, { input }, context);
// }

// Export unified pricing resolvers
export const pricingResolvers = {
  Query: pricingQueries,
};

