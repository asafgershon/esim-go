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
import * as countriesList from "countries-list";
import { checkoutSubscriptionsV2 } from "./resolvers/checkout/subscriptions";
import { checkoutMutationsV2 } from "./resolvers/checkout";

const logger = createLogger({ component: "resolvers" });

export const resolvers: Resolvers = {
  Query: {
    hello: () => "Hello eSIM Go!",
    ...authResolvers.Query!,
    // Orders resolvers are merged from orders-resolvers.ts
    ...ordersResolvers.Query!,

    // Users resolvers are merged from users-resolvers.ts
    ...usersResolvers.Query!,

    // Trips resolvers are merged from trips-resolvers.ts
    ...tripsResolvers.Query!,

    // Unified pricing resolvers (calculatePrice, calculatePrices, etc.)
    ...pricingResolvers.Query!,

    // eSIM resolvers are merged from esim-resolvers.ts
    ...esimResolvers.Query!,

    // Bundle resolvers
    ...bundlesResolvers.Query!,

    // Catalog resolvers
    ...catalogResolvers.Query!,

    // Checkout resolvers (getCheckoutSession, etc.)
    ...checkoutResolvers.Query!,

    // AirHalo resolvers
    ...airHaloResolvers.Query!,

    // Pricing management resolvers (admin only)
    ...pricingManagementResolvers.Query!,

    // Strategies resolvers (admin only)
    ...strategiesResolvers.Query!,

    // Tenant resolvers
    ...tenantResolvers.Query!,

    // Countries resolvers
    countries: async (_, __, context: Context) => {
      try {
        // Import countries-list for enrichment
        const countriesList = await import("countries-list");
        const { getCountryNameHebrew } = await import(
          "./datasources/esim-go/hebrew-names"
        );

        // Get country codes from catalog bundles

        const countries = [];

        for (const iso of Object.keys(countriesList.countries)) {
          const countryData = countriesList.getCountryData(iso as any);
          if (!countryData) {
            logger.warn("Country data not found in countries-list", {
              iso,
              operationType: "countries-query",
            });
            continue;
          }

          countries.push({
            iso,
            name: countryData.name,
            nameHebrew: getCountryNameHebrew(iso) || countryData.name,
            region: countryData.continent,
            flag: countriesList.getEmojiFlag(iso as any) || "🌍",
          });
        }

        countries.sort((a, b) => a!.name.localeCompare(b!.name));

        logger.info("Countries fetched from catalog", {
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

    // eSIM resolvers are merged from esim-resolvers.ts
    ...esimResolvers.Mutation!,

    // Catalog resolvers are merged from catalog-resolvers.ts
    ...catalogResolvers.Mutation!,

    // Auth resolvers are merged from auth-resolvers.ts
    ...authResolvers.Mutation!,

    // Pricing management resolvers (admin only)
    ...pricingManagementResolvers.Mutation!,

    // Tenant resolvers (admin mutations)
    ...tenantResolvers.Mutation!,

    // High demand countries management
    toggleHighDemandCountry: async (_, { countryId }, context: Context) => {
      // This will be protected by @auth(role: "ADMIN") directive
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

        logger.info("High demand country status toggled", {
          countryId,
          isHighDemand: result.isHighDemand,
          userId: context.auth.user!.id,
          operationType: "high-demand-toggle",
        });

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
    orderCount: async (parent, _, context: Context) => {
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
    countries: async (parent, _, context: Context) => {
      // Use the countryIds from the parent Trip object to fetch full country data
      if (!parent.countryIds || parent.countryIds.length === 0) {
        return [];
      }

      // Return empty array to prevent N+1 queries during initial load
      // Frontend can fetch countries separately if needed
      return [];

      // TODO: Implement DataLoader pattern for batching country requests
    },
  },
  Order: {
    ...ordersResolvers.Order!,
  },
  Country: {
    name: async (parent, _, context: Context) => {
      const country = countriesList.getCountryData(parent.iso);
      return country?.name || parent.name || "";
    },
    nameHebrew: async (parent, _, context: Context) => {
      const { getCountryNameHebrew } = await import(
        "./datasources/esim-go/hebrew-names"
      );
      return getCountryNameHebrew(parent.iso) || parent.name;
    },
    region: async (parent) => {
      const region = countriesList.getCountryData(parent.iso).continent;
      return region || parent.region;
    },
    flag: async (parent) => {
      const country = countriesList.getEmojiFlag(parent.iso);
      return country || "";
    },
    iso: (parent) => parent.iso,
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
    // eSIM subscriptions are merged from esim-resolvers.ts
    ...esimResolvers.Subscription!,

    // Catalog subscriptions are merged from catalog-resolvers.ts
    ...catalogResolvers.Subscription!,

    // Pricing subscriptions for real-time step streaming
    ...pricingSubscriptionResolvers.Subscription!,

    // Checkout subscriptions for real-time session updates
    ...checkoutSubscriptionResolvers.Subscription!,
    ...checkoutSubscriptionsV2,

    // Batch pricing subscription for progressive loading
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
};
