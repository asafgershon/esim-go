import { GraphQLError } from "graphql";
import {
  supabaseAdmin
} from "./context/supabase-auth";
import type { Context } from "./context/types";
import { createLogger } from "./lib/logger";
import { authResolvers } from "./resolvers/auth-resolvers";
import { catalogResolvers } from "./resolvers/catalog-resolvers";
import { checkoutResolvers } from "./resolvers/checkout-resolvers";
import { esimResolvers } from "./resolvers/esim-resolvers";
import { ordersResolvers } from "./resolvers/orders-resolvers";
import { pricingRulesResolvers } from "./resolvers/pricing-rules-resolvers";
import { tripsResolvers } from "./resolvers/trips-resolvers";
import { usersResolvers } from "./resolvers/users-resolvers";
import type { Resolvers } from "./types";

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

    // Pricing rules resolvers are merged from pricing-rules-resolvers.ts
    ...pricingRulesResolvers.Query!,

    // eSIM resolvers are merged from esim-resolvers.ts
    ...esimResolvers.Query!,
    
    // Catalog resolvers are merged from catalog-resolvers.ts
    ...catalogResolvers.Query!,
    countries: async (_, __, context: Context) => {
      const countries = await context.dataSources.countries.getCountries();

      // List of known regions to filter out from countries list
      const knownRegions = new Set([
        "Africa",
        "Asia",
        "Europe",
        "North America",
        "South America",
        "Oceania",
        "Antarctica",
        "Middle East",
        "Caribbean",
        "Central America",
        "Western Europe",
        "Eastern Europe",
        "Southeast Asia",
        "East Asia",
        "Central Asia",
        "Southern Africa",
        "Northern Africa",
        "Western Africa",
        "Eastern Africa",
        "Central Africa",
      ]);

      return countries
        .filter((country) => {
          // Filter out entries that are actually regions (not valid ISO country codes)
          // Check if the "country" name matches known regions
          return (
            !knownRegions.has(country.country) &&
            country.iso &&
            country.iso.length === 2
          ); // Valid ISO codes are exactly 2 characters
        })
        .map((country) => ({
          iso: country.iso,
          name: country.country,
          nameHebrew: country.hebrewName || country.country,
          region: country.region,
          flag: country.flag,
        }));
    },
    // trips resolver moved to tripsResolvers


  },
  // Field resolvers for User type
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
  // Field resolvers for Trip type
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
      const countries = await context.dataSources.countries.getCountries({
        isos: parent.countryIds,
      });

      return countries.map((country) => ({
        iso: country.iso,
        name: country.country,
        nameHebrew: country.hebrewName || country.country,
        region: country.region,
        flag: country.flag,
      }));
    },
  },

  Mutation: {
    ...checkoutResolvers.Mutation!,
    ...usersResolvers.Mutation!,
    ...tripsResolvers.Mutation!,
    ...pricingRulesResolvers.Mutation!,



    // eSIM resolvers are merged from esim-resolvers.ts
    ...esimResolvers.Mutation!,
    
    // Catalog resolvers are merged from catalog-resolvers.ts
    ...catalogResolvers.Mutation!,
    
    // Auth resolvers are merged from auth-resolvers.ts
    ...authResolvers.Mutation!,





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

  // Field Resolvers
  Order: {
    ...ordersResolvers.Order!,
  },

  Subscription: {
    // eSIM subscriptions are merged from esim-resolvers.ts
    ...esimResolvers.Subscription!,

    // Catalog subscriptions are merged from catalog-resolvers.ts
    ...catalogResolvers.Subscription!,

  },
};
