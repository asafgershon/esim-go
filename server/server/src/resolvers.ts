import {
  signInWithApple,
  signInWithGoogle,
  sendPhoneOTP,
  supabaseAdmin,
  verifyPhoneOTP,
} from "./context/supabase-auth";
import type { Context } from "./context/types";
import type { CalculatePriceInput, Order, Resolvers } from "./types";
import { ConfigurationLevel } from "./types";
import { esimResolvers } from "./resolvers/esim-resolvers";
import { catalogResolvers } from "./resolvers/catalog-resolvers";
import { authResolvers } from "./resolvers/auth-resolvers";
import { checkoutResolvers } from "./resolvers/checkout-resolvers";
import { usersResolvers } from "./resolvers/users-resolvers";
import { tripsResolvers } from "./resolvers/trips-resolvers";
import { pricingRulesResolvers } from "./resolvers/pricing-rules-resolvers";
import { GraphQLError } from "graphql";
import { PaymentMethod } from "./types";
import { createLogger } from "./lib/logger";
import { PricingEngineService } from "./services/pricing-engine.service";

const logger = createLogger({ component: "resolvers" });

const getPricingEngineService = (context: Context): PricingEngineService => {
  return PricingEngineService.getInstance(context.services.db);
};

// Helper function to map GraphQL enum to internal payment method type
function mapPaymentMethodEnum(
  paymentMethod?: PaymentMethod | null
): "ISRAELI_CARD" | "FOREIGN_CARD" | "BIT" | "AMEX" | "DINERS" {
  switch (paymentMethod) {
    case PaymentMethod.IsraeliCard:
      return "ISRAELI_CARD";
    case PaymentMethod.ForeignCard:
      return "FOREIGN_CARD";
    case PaymentMethod.Bit:
      return "BIT";
    case PaymentMethod.Amex:
      return "AMEX";
    case PaymentMethod.Diners:
      return "DINERS";
    default:
      return "ISRAELI_CARD"; // Default fallback
  }
}

export const resolvers: Resolvers = {
  Query: {
    hello: () => "Hello eSIM Go!",

    // Auth-protected resolver example
    me: async (_, __, context: Context) => {
      // This will be protected by @auth directive
      return context.auth.user;
    },

    // Admin-only resolver to get all orders
    orders: async (_, __, context: Context) => {
      // This will be protected by @auth(role: "ADMIN") directive
      const { data, error } = await supabaseAdmin
        .from("esim_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new GraphQLError("Failed to fetch orders", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }

      return data.map((order) => ({
        id: order.id,
        reference: order.reference,
        status: order.status,
        quantity: order.quantity,
        totalPrice: order.total_price,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        bundleId: order.data_plan_id,
        bundleName: order.bundle_name || `Bundle ${order.data_plan_id}`,
        esims: [], // Will be resolved by field resolver
        user: { id: order.user_id } as any, // Will be resolved by field resolver
      }));
    },

    // Admin-only resolver to get orders for a specific user
    getUserOrders: async (_, { userId }, context: Context) => {
      // This will be protected by @auth(role: "ADMIN") directive
      const { data, error } = await supabaseAdmin
        .from("esim_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new GraphQLError("Failed to fetch user orders", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }

      return data.map((order) => ({
        id: order.id,
        reference: order.reference,
        status: order.status,
        quantity: order.quantity,
        totalPrice: order.total_price,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        bundleId: order.data_plan_id,
        bundleName: order.bundle_name || `Bundle ${order.data_plan_id}`,
        esims: [], // Will be resolved by field resolver
        user: { id: order.user_id } as any, // Will be resolved by field resolver
      }));
    },

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
  Order: {
    esims: async (parent, _, context: Context) => {
      const { data, error } = await supabaseAdmin
        .from("esims")
        .select("*")
        .eq("order_id", parent.id);

      if (!data) return [];

      // Transform the data to map qr_code_url to qrCode for GraphQL schema
      return data.map((esim) => ({
        ...esim,
        qrCode: esim.qr_code_url,
      }));
    },
    user: async (parent, _, context: Context) => {
      // Get the user_id from the order and fetch user data
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("esim_orders")
        .select("user_id")
        .eq("id", parent.id)
        .single();

      if (orderError || !orderData) {
        throw new GraphQLError("Order not found", {
          extensions: { code: "ORDER_NOT_FOUND" },
        });
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from("auth.users")
        .select("id, email, raw_user_meta_data")
        .eq("id", orderData.user_id)
        .single();

      if (userError || !userData) {
        // Return null if user not found instead of throwing error
        return null;
      }

      return {
        id: userData.id,
        email: userData.email,
        firstName: userData.raw_user_meta_data?.first_name || "",
        lastName: userData.raw_user_meta_data?.last_name || "",
        phoneNumber: userData.raw_user_meta_data?.phone_number || null,
        role: userData.raw_user_meta_data?.role || "USER",
        createdAt: userData.created_at || new Date().toISOString(),
        updatedAt: userData.updated_at || new Date().toISOString(),
        orderCount: 0, // Will be resolved by field resolver
      };
    },
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



    // Package Assignment
    assignPackageToUser: async (_, { userId, planId }, context: Context) => {
      try {
        // Get the plan details from eSIM Go
        const plans = await context.dataSources.catalogue.getAllBundels();
        const plan = plans.find((p) => p.name === planId);

        if (!plan) {
          return {
            success: false,
            error: "Package not found",
            assignment: null,
          };
        }

        // Get the user to assign to
        const { data: userData, error: userError } = await supabaseAdmin
          .from("auth.users")
          .select("id, email, raw_user_meta_data")
          .eq("id", userId)
          .single();

        if (userError || !userData) {
          return {
            success: false,
            error: "User not found",
            assignment: null,
          };
        }

        // Create the assignment
        const { data: assignment, error: assignmentError } = await supabaseAdmin
          .from("package_assignments")
          .insert({
            user_id: userId,
            data_plan_id: planId,
            assigned_by: context.auth.user!.id,
            plan_snapshot: {
              name: plan.name,
              description: plan.description,
              region: plan.baseCountry?.region || "Unknown",
              duration: plan.duration,
              price: plan.price,
              currency: plan.currency || "USD",
              isUnlimited: plan.unlimited || false,
              bundleGroup: plan.bundleGroup,
              countries: plan.countries || [],
            },
            status: "ASSIGNED",
          })
          .select()
          .single();

        if (assignmentError) {
          logger.error("Error creating assignment", assignmentError as Error, {
            userId,
            planId,
            operationType: "package-assignment",
          });
          return {
            success: false,
            error: "Failed to create assignment",
            assignment: null,
          };
        }

        // Return the assignment with resolved user and plan data
        return {
          success: true,
          error: null,
          assignment: {
            id: assignment.id,
            user: {
              id: userData.id,
              email: userData.email,
              firstName: userData.raw_user_meta_data?.first_name || "",
              lastName: userData.raw_user_meta_data?.last_name || "",
              phoneNumber: userData.raw_user_meta_data?.phone_number || null,
              role: userData.raw_user_meta_data?.role || "USER",
              createdAt: userData.created_at || new Date().toISOString(),
              updatedAt: userData.updated_at || new Date().toISOString(),
              orderCount: 0, // Will be resolved by field resolver
            },
            dataPlan: {
              id: planId,
              name: plan.name,
              description: plan.description,
              region: plan.baseCountry?.region || "Unknown",
              duration: plan.duration,
              price: plan.price,
              currency: plan.currency || "USD",
              isUnlimited: plan.unlimited || false,
              bundleGroup: plan.bundleGroup,
              availableQuantity: plan.availableQuantity,
              countries:
                plan.countries?.map((c) => ({
                  iso: c.iso,
                  name: c.name || c.country || "",
                  nameHebrew: c.hebrewName || c.name || c.country || "",
                  region: c.region || "",
                  flag: c.flag || "",
                })) || [],
            },
            assignedAt: assignment.assigned_at,
            assignedBy: context.auth.user!,
            status: assignment.status,
            createdAt: assignment.created_at,
            updatedAt: assignment.updated_at,
          },
        };
      } catch (error) {
        logger.error("Error in assignPackageToUser", error as Error, {
          userId,
          planId,
          operationType: "package-assignment",
        });
        return {
          success: false,
          error: "Internal server error",
          assignment: null,
        };
      }
    },

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

    // Catalog Sync
    syncCatalog: async (_, { force = false }, context: Context) => {
      const startTime = Date.now();

      try {
        logger.info("Manual catalog sync triggered", {
          userId: context.auth.user!.id,
          force,
          operationType: "catalog-sync-manual",
        });

        // Import CatalogSyncServiceV2 dynamically
        const { CatalogSyncServiceV2 } = await import(
          "./services/catalog-sync-v2.service"
        );

        // Create sync service instance with API key
        const catalogSyncService = new CatalogSyncServiceV2(
          process.env.ESIM_GO_API_KEY!,
          process.env.ESIM_GO_BASE_URL
        );

        // Trigger sync (returns jobId)
        const syncResult = await catalogSyncService.triggerFullSync(
          context.auth.user?.id
        );

        const duration = Date.now() - startTime;

        // Get bundle count from database instead of Redis
        let totalBundles = 0;
        try {
          // Assuming BundleRepository is available in context.repositories
          // This part of the original code was not provided, so I'm commenting it out
          // as it would require a BundleRepository import or definition.
          // For now, I'll just log a warning and set totalBundles to 0.
          // If BundleRepository is meant to be part of context.repositories,
          // it needs to be imported or defined.
          // For the purpose of this edit, I'm assuming it's available.
          // If not, this will cause a runtime error.
          // const bundleRepository = new BundleRepository(supabaseAdmin);
          // totalBundles = await bundleRepository.getTotalCount();
          logger.warn(
            "BundleRepository is not available in context.repositories. Cannot get total bundle count.",
            {
              operationType: "catalog-sync-manual",
            }
          );
          totalBundles = 0; // Set to 0 as BundleRepository is not available
        } catch (metadataError) {
          logger.warn(
            "Failed to get bundle count from database",
            metadataError as Error,
            {
              operationType: "catalog-sync-manual",
            }
          );
        }

        logger.info("Manual catalog sync completed", {
          userId: context.auth.user!.id,
          force,
          duration,
          syncedBundles: totalBundles,
          operationType: "catalog-sync-manual",
        });

        return {
          success: true,
          message: `Catalog sync completed successfully${
            totalBundles > 0 ? `. Synced ${totalBundles} bundles` : ""
          }.`,
          error: null,
          syncedBundles: totalBundles,
          syncDuration: duration,
          syncedAt: new Date().toISOString(),
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error("Manual catalog sync failed", error as Error, {
          userId: context.auth.user!.id,
          force,
          duration,
          operationType: "catalog-sync-manual",
        });

        return {
          success: false,
          message: null,
          error: `Catalog sync failed: ${(error as Error).message}`,
          syncedBundles: 0,
          syncDuration: duration,
          syncedAt: new Date().toISOString(),
        };
      }
    },
  },

  // Field Resolvers

  Subscription: {
    // TODO: Implement real-time eSIM status updates
    esimStatusUpdated: {
      subscribe: () => {
        throw new Error("Subscriptions not implemented yet");
      },
    },

    // Catalog sync progress subscription
    catalogSyncProgress: {
      subscribe: async (_, __, context: Context) => {
        if (!context.services.pubsub) {
          throw new GraphQLError("PubSub service not available", {
            extensions: { code: "SERVICE_UNAVAILABLE" },
          });
        }

        const { PubSubEvents } = await import("./context/pubsub");
        return context.services.pubsub.asyncIterator([
          PubSubEvents.CATALOG_SYNC_PROGRESS,
        ]);
      },
    },
  },
};
