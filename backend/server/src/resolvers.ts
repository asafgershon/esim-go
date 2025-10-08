import { GraphQLError } from "graphql";
import { supabaseAdmin } from "./context/supabase-auth";
import type { Context } from "./context/types";
import { createLogger } from "./lib/logger";
import { authResolvers } from "./resolvers/auth.resolvers";
import { bundlesResolvers } from "./resolvers/bundles.resolvers";
import { catalogResolvers } from "./resolvers/catalog.resolvers";
import { checkoutResolvers } from "./resolvers/checkout.resolvers";
import { checkoutSubscriptionResolvers } from "./resolvers/checkout-subscription.resolvers";
import { esimResolvers } from "./resolvers/esim.resolvers";
import { ordersResolvers } from "./resolvers/orders.resolvers";
import { pricingResolvers } from "./resolvers/pricing.resolvers";
import { tripsResolvers } from "./resolvers/trips.resolvers";
import { usersResolvers } from "./resolvers/users.resolvers";
import { airHaloResolvers } from "./resolvers/airhalo.resolvers";
import { pricingManagementResolvers } from "./resolvers/pricing-management.resolvers";
import { strategiesResolvers } from "./resolvers/strategies.resolvers";
import { tenantResolvers } from "./resolvers/tenant.resolvers";
import { pricingSubscriptionResolvers } from "./resolvers/pricing-subscription.resolvers";
import { batchPricingSubscriptionResolvers } from "./resolvers/batch-pricing-subscription";
import type { Resolvers } from "./types";
import { checkoutSubscriptionsV2 } from "./resolvers/checkout/subscriptions";
import { checkoutMutationsV2 } from "./resolvers/checkout";

const logger = createLogger({ component: "resolvers" });

export const resolvers: Resolvers = {
  Query: {
    hello: () => "Hello eSIM Go!",
    ...authResolvers.Query!,
    ...ordersResolvers.Query!,
    ...usersResolvers.Query!,
    ...tripsResolvers.Query!,
    ...pricingResolvers.Query!,
    ...esimResolvers.Query!,
    ...bundlesResolvers.Query!,
    ...catalogResolvers.Query!,
    ...checkoutResolvers.Query!,
    ...airHaloResolvers.Query!,
    ...pricingManagementResolvers.Query!,
    ...strategiesResolvers.Query!,
    ...tenantResolvers.Query!,

    // FIX: Added 'any' type to unused parameters
    countries: async (_: any, __: any, context: Context) => {
      try {
        const countryIsosWithBundles = await context.repositories.bundles.getCountries();
        console.log("[DEBUG] Total countries from DB:", countryIsosWithBundles.length);

        if (!countryIsosWithBundles || countryIsosWithBundles.length === 0) {
          return [];
        }

        const { data: countriesData, error } = await supabaseAdmin
          .from("catalog_countries")
          .select("*")
          .in("iso2", countryIsosWithBundles);

        if (error) {
          logger.error("Error fetching country details", error, {
            operationType: "countries-query-details",
          });
          throw new GraphQLError("Failed to fetch country details");
        }

        const countries = countriesData.map((country) => ({
          iso: country.iso2,
          name: country.name,
          nameHebrew: country.name_hebrew || country.name,
          region: country.region,
          flag: country.flag_emoji || "🌍",
        }));

        countries.sort((a, b) => (a.nameHebrew || a.name).localeCompare(b.nameHebrew || b.name, 'he'));

        logger.info("Countries fetched from new database structure", {
          count: countries.length,
          operationType: "countries-query",
        });

        return countries;
      } catch (error) {
        logger.error("Error fetching countries", error as Error, {
          operationType: "countries-query",
        });
        throw new GraphQLError("Failed to fetch countries");
      }
    },
  },
  Mutation: {
    ...checkoutResolvers.Mutation!,
    ...checkoutMutationsV2,
    ...usersResolvers.Mutation!,
    ...tripsResolvers.Mutation!,
    ...esimResolvers.Mutation!,
    ...catalogResolvers.Mutation!,
    ...authResolvers.Mutation!,
    ...pricingManagementResolvers.Mutation!,
    ...tenantResolvers.Mutation!,
    // FIX: Added explicit types for parameters
    toggleHighDemandCountry: async (_: any, { countryId }: { countryId: string }, context: Context) => {
      try {
        const result =
          await context.repositories.highDemandCountries.toggleHighDemandCountry(
            countryId,
            context.auth.user!.id
          );

        if (!result.success) {
          throw new GraphQLError(
            result.error || "Failed to toggle high demand country",
            {
              extensions: { code: "TOGGLE_FAILED" },
            }
          );
        }

        return {
          success: result.success,
          countryId,
          isHighDemand: result.isHighDemand,
          error: null,
        };
      } catch (error) {
        logger.error("Error toggling high demand country", error as Error, {
          countryId,
          userId: context.auth.user!.id,
          operationType: "high-demand-toggle",
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        return {
          success: false,
          countryId,
          isHighDemand: false,
          error: (error as Error).message,
        };
      }
    },
  },
  User: {
    orderCount: async (parent: any, _: any, context: Context) => {
      const { data, error } = await supabaseAdmin
        .from("esim_orders")
        .select("id")
        .eq("user_id", parent.id);

      if (error) {
        logger.error("Error fetching order count", error as Error, {
          userId: parent.id,
          operationType: "order-count-fetch",
        });
        return 0;
      }

      return data?.length || 0;
    },
  },
  Trip: {
    countries: async (parent: any, _: any, context: Context) => {
      if (!parent.countryIds || parent.countryIds.length === 0) {
        return [];
      }
      return [];
    },
  },
  Order: {
    ...ordersResolvers.Order!,
  },
  Country: {
    name: (parent: any) => parent.name || "",
    nameHebrew: (parent: any) => parent.nameHebrew || parent.name,
    region: (parent: any) => parent.region,
    flag: (parent: any) => parent.flag,
    iso: (parent: any) => parent.iso,
  },
  CountryBundle: {
    ...catalogResolvers.CountryBundle!,
  },
  CatalogBundle: {
    ...catalogResolvers.CatalogBundle!,
  },
  PricingBreakdown: {
    ...catalogResolvers.PricingBreakdown!,
  },
  Subscription: {
    ...esimResolvers.Subscription!,
    ...catalogResolvers.Subscription!,
    ...pricingSubscriptionResolvers.Subscription!,
    ...checkoutSubscriptionResolvers.Subscription!,
    ...checkoutSubscriptionsV2,
    ...batchPricingSubscriptionResolvers,
  },
  BundlesByCountry: {
    ...bundlesResolvers.BundlesByCountry,
  },
  BundlesByRegion: {
    ...bundlesResolvers.BundlesByRegion,
  },
  BundlesByGroup: {
    ...bundlesResolvers.BundlesByGroup,
  },
  Bundle: {
    ...bundlesResolvers.Bundle!,
  },
  CustomerBundle: {
    ...bundlesResolvers.CustomerBundle!,
    ...catalogResolvers.CustomerBundle!,
  },
  Tenant: {
    ...tenantResolvers.Tenant!,
  },
  PricingStrategy: {
    ...strategiesResolvers.PricingStrategy!,
  },
} as any;

