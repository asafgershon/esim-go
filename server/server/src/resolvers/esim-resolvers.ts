import { GraphQLError } from "graphql";
import { supabaseAdmin } from "../context/supabase-auth";
import type { Context } from "../context/types";
import {
  mapBundle,
  mapDataPlan,
  mapESIM,
  mapOrder,
} from "../schemas/transformations";
import type { Resolvers } from "../types";

export const esimResolvers: Partial<Resolvers> = {
  Query: {
    // Data plan browsing (public, no auth required)
    dataPlans: async (_, { filter }, context: Context) => {
      try {
        const limit = filter?.limit || 50;
        const offset = filter?.offset || 0;
        
        const response = await context.dataSources.catalogue.searchPlans({
          region: filter?.region || undefined,
          country: filter?.country || undefined,
          duration: filter?.duration || undefined,
          maxPrice: filter?.maxPrice || undefined,
          bundleGroup: filter?.bundleGroup || undefined,
          search: filter?.search || undefined,
          limit,
          offset,
        });

        // Map plans directly from API (filtering now handled in datasource)
        const filteredPlans = (response.bundles || []).map((plan) => mapDataPlan(plan));
        
        // Calculate pagination metadata
        const totalCount = response.totalCount || 0;
        const hasNextPage = offset + limit < totalCount;
        const hasPreviousPage = offset > 0;
        const pages = Math.ceil(totalCount / limit);
        const currentPage = Math.floor(offset / limit) + 1;
        
        return {
          items: filteredPlans,
          totalCount,
          hasNextPage,
          hasPreviousPage,
          pageInfo: {
            limit,
            offset,
            total: totalCount,
            pages,
            currentPage,
          },
          lastFetched: (response as any).lastFetched || null,
        };
      } catch (error) {
        console.error("Error fetching data plans:", error);
        console.error("Filter parameters:", filter);
        
        // Check if it's a catalog empty error
        if (error instanceof Error && error.message.includes('Catalog data is not available')) {
          throw new GraphQLError("Catalog data is not available. Please run catalog sync to populate the database with eSIM bundles.", {
            extensions: {
              code: "CATALOG_EMPTY",
              hint: "Run the catalog sync process to populate the database",
            },
          });
        }
        
        // Pass through the actual error details for debugging
        throw new GraphQLError(`Failed to fetch data plans: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: {
            code: "DATA_PLANS_FETCH_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },

    dataPlan: async (_, { id }, context: Context) => {
      try {
        // First try to get from database
        const { data: dbPlan } = await supabaseAdmin
          .from("data_plans")
          .select("*")
          .eq("id", id)
          .single();

        if (!dbPlan) {
          return null;
        }

        // Get full details from eSIM Go API
        const plan = await context.dataSources.catalogue.getPlanByName(
          dbPlan.name
        );
        if (!plan) {
          return null;
        }

        return mapDataPlan(plan, dbPlan);
      } catch (error) {
        console.error("Error fetching data plan:", error);
        return null;
      }
    },

    // Order queries (auth required)
    myOrders: async (_, { filter }, context: Context) => {
      try {
        // Get orders from database
        let query = supabaseAdmin
          .from("esim_orders")
          .select("*")
          .eq("user_id", context.auth.user!.id)
          .order("created_at", { ascending: false });

        if (filter?.status) {
          query = query.eq("status", filter.status);
        }
        if (filter?.fromDate) {
          query = query.gte("created_at", filter.fromDate);
        }
        if (filter?.toDate) {
          query = query.lte("created_at", filter.toDate);
        }

        const { data: dbOrders } = await query;
        if (!dbOrders || dbOrders.length === 0) {
          return [];
        }

        return dbOrders;
        // Get order details from eSIM Go API
        const orders = await Promise.all(
          dbOrders.map(async (dbOrder) => {
            const apiOrder = await context.dataSources.orders.getOrder(
              dbOrder.reference
            );
            if (!apiOrder) return null;

            // Get data plan
            const { data: dbPlan } = await supabaseAdmin
              .from("data_plans")
              .select("*")
              .eq("id", dbOrder.data_plan_id)
              .single();

            const plan = await context.dataSources.catalogue.getPlanByName(
              dbPlan.name
            );

            return mapOrder(apiOrder, dbOrder, plan);
          })
        );

        return orders.filter(Boolean);
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw new GraphQLError("Failed to fetch orders", {
          extensions: {
            code: "ORDERS_FETCH_ERROR",
          },
        });
      }
    },
    // eSIM queries
    myESIMs: async (_, __, context: Context) => {
      if (!context.auth?.isAuthenticated) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      try {
        // Get eSIMs from database
        const { data: dbESIMs } = await supabaseAdmin
          .from("esims")
          .select("*, esim_orders!inner(*)")
          .eq("user_id", context.auth.user!.id)
          .order("created_at", { ascending: false });

        if (!dbESIMs || dbESIMs.length === 0) {
          return [];
        }

        // Get eSIM details from API
        const esims = await Promise.all(
          dbESIMs.map(async (dbESIM) => {
            const apiESIM = await context.dataSources.esims.getESIM(
              dbESIM.iccid
            );
            if (!apiESIM) return null;

            // Get order details
            const order = await context.dataSources.orders.getOrder(
              dbESIM.esim_orders.reference
            );

            // Get data plan
            const { data: dbPlan } = await supabaseAdmin
              .from("data_plans")
              .select("*")
              .eq("id", dbESIM.esim_orders.data_plan_id)
              .single();

            const plan = await context.dataSources.catalogue.getPlanByName(
              dbPlan.name
            );

            const mappedESIM = mapESIM(
              apiESIM,
              dbESIM,
              mapOrder(order, dbESIM.esim_orders, plan),
              plan
            );

            // Calculate usage
            const usage = await context.dataSources.esims.getESIMUsage(
              dbESIM.iccid
            );
            mappedESIM.usage = {
              totalUsed: usage.totalUsed / (1024 * 1024), // Convert to MB
              totalRemaining:
                usage.totalRemaining !== null
                  ? usage.totalRemaining / (1024 * 1024)
                  : null,
              activeBundles: usage.activeBundles.map(mapBundle),
            };

            return mappedESIM;
          })
        );

        return esims.filter(Boolean);
      } catch (error) {
        console.error("Error fetching eSIMs:", error);
        throw new GraphQLError("Failed to fetch eSIMs", {
          extensions: {
            code: "ESIMS_FETCH_ERROR",
          },
        });
      }
    },

    esimDetails: async (_, { id }, context: Context) => {
      if (!context.auth?.isAuthenticated) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      try {
        // Get eSIM from database
        const { data: dbESIM } = await supabaseAdmin
          .from("esims")
          .select("*, esim_orders!inner(*)")
          .eq("id", id)
          .eq("user_id", context.auth.user!.id)
          .single();

        if (!dbESIM) {
          return null;
        }

        // Get eSIM details from API
        const apiESIM = await context.dataSources.esims.getESIM(dbESIM.iccid);
        if (!apiESIM) {
          return null;
        }

        // Get order details
        const order = await context.dataSources.orders.getOrder(
          dbESIM.esim_orders.reference
        );

        // Get data plan
        const { data: dbPlan } = await supabaseAdmin
          .from("data_plans")
          .select("*")
          .eq("id", dbESIM.esim_orders.data_plan_id)
          .single();

        const plan = await context.dataSources.catalogue.getPlanByName(
          dbPlan.name
        );

        const mappedESIM = mapESIM(
          apiESIM,
          dbESIM,
          mapOrder(order, dbESIM.esim_orders, plan),
          plan
        );

        // Calculate usage
        const usage = await context.dataSources.esims.getESIMUsage(
          dbESIM.iccid
        );
        mappedESIM.usage = {
          totalUsed: usage.totalUsed / (1024 * 1024), // Convert to MB
          totalRemaining:
            usage.totalRemaining !== null
              ? usage.totalRemaining / (1024 * 1024)
              : null,
          activeBundles: usage.activeBundles.map(mapBundle),
        };

        return mappedESIM;
      } catch (error) {
        console.error("Error fetching eSIM details:", error);
        return null;
      }
    },
  },

  Mutation: {
    // eSIM purchase
    purchaseESIM: async (_, { planId, input }, context: Context) => {
      if (!context.auth?.isAuthenticated) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      try {
        // Get data plan from database
        const { data: dbPlan } = await supabaseAdmin
          .from("data_plans")
          .select("*")
          .eq("id", planId)
          .single();

        if (!dbPlan) {
          return {
            success: false,
            error: "Data plan not found",
            order: null,
          };
        }

        // Create order in eSIM Go
        const orderReference = `ORD-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const apiOrder = await context.dataSources.orders.createOrder({
          bundleName: dbPlan.name,
          quantity: input.quantity || 1,
          customerReference: input.customerReference || orderReference,
          autoActivate: input.autoActivate || false,
        });

        // Create order in database
        const { data: dbOrder, error: dbError } = await supabaseAdmin
          .from("esim_orders")
          .insert({
            user_id: context.auth.user!.id,
            reference: apiOrder.reference,
            status: apiOrder.status,
            data_plan_id: planId,
            quantity: apiOrder.quantity,
            total_price: apiOrder.totalPrice,
            esim_go_order_ref: apiOrder.id,
          })
          .select()
          .single();

        if (dbError) {
          console.error("Error creating order in database:", dbError);
          throw new GraphQLError("Failed to create order", {
            extensions: {
              code: "ORDER_CREATION_ERROR",
            },
          });
        }

        // Get plan details for response
        const plan = await context.dataSources.catalogue.getPlanByName(
          dbPlan.name
        );

        return {
          success: true,
          error: null,
          order: mapOrder(apiOrder, dbOrder, plan),
        };
      } catch (error) {
        console.error("Error purchasing eSIM:", error);
        return {
          success: false,
          error:
            error instanceof GraphQLError
              ? error.message
              : "Failed to purchase eSIM",
          order: null,
        };
      }
    },

    // eSIM actions
    suspendESIM: async (_, { esimId }, context: Context) => {
      if (!context.auth?.isAuthenticated) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      try {
        // Get eSIM from database
        const { data: dbESIM } = await supabaseAdmin
          .from("esims")
          .select("*, esim_orders!inner(*)")
          .eq("id", esimId)
          .eq("user_id", context.auth.user!.id)
          .single();

        if (!dbESIM) {
          return {
            success: false,
            error: "eSIM not found",
            esim: null,
          };
        }

        // Suspend eSIM via API
        const apiESIM = await context.dataSources.esims.suspendESIM(
          dbESIM.iccid
        );

        // Update database
        await supabaseAdmin
          .from("esims")
          .update({
            status: apiESIM.status,
            last_action: apiESIM.lastAction,
            action_date: apiESIM.actionDate,
          })
          .eq("id", esimId);

        // Get full details for response
        const order = await context.dataSources.orders.getOrder(
          dbESIM.esim_orders.reference
        );
        const { data: dbPlan } = await supabaseAdmin
          .from("data_plans")
          .select("*")
          .eq("id", dbESIM.esim_orders.data_plan_id)
          .single();
        const plan = await context.dataSources.catalogue.getPlanByName(
          dbPlan.name
        );

        return {
          success: true,
          error: null,
          esim: mapESIM(
            apiESIM,
            dbESIM,
            mapOrder(order, dbESIM.esim_orders, plan),
            plan
          ),
        };
      } catch (error) {
        console.error("Error suspending eSIM:", error);
        return {
          success: false,
          error:
            error instanceof GraphQLError
              ? error.message
              : "Failed to suspend eSIM",
          esim: null,
        };
      }
    },

    restoreESIM: async (_, { esimId }, context: Context) => {
      // Similar implementation to suspendESIM but calling restoreESIM
      // ... implementation similar to above
      return {
        success: false,
        error: "Not implemented yet",
        esim: null,
      };
    },

    cancelESIM: async (_, { esimId }, context: Context) => {
      // Similar implementation to suspendESIM but calling cancelESIM
      // ... implementation similar to above
      return {
        success: false,
        error: "Not implemented yet",
        esim: null,
      };
    },

    updateESIMReference: async (_, { esimId, reference }, context: Context) => {
      // Similar implementation to suspendESIM but updating customer reference
      // ... implementation similar to above
      return {
        success: false,
        error: "Not implemented yet",
        esim: null,
      };
    },
  },
};
