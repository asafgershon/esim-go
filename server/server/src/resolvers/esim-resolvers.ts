import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { supabaseAdmin } from "../context/supabase-auth";
import {
  mapBundle,
  mapESIM,
  mapOrder,
} from "../schemas/transformations";
import type { Resolvers } from "../types";
import { createLogger } from "../lib/logger";
import { generateInstallationLinks } from "../utils/esim.utils";

const logger = createLogger({
  name: "esim-resolvers",
});

export const esimResolvers: Partial<Resolvers> = {
  Query: {
    // Admin queries
    getAllESIMs: async (_, __, context: Context) => {
      try {
        // Get all eSIMs with order data
        const { data: esims, error } = await supabaseAdmin
          .from('esims')
          .select(`
            *,
            esim_orders!esims_order_id_fkey (
              id,
              reference,
              plan_data
            )
          `)
          .order('created_at', { ascending: false })
          .limit(1000); // Reasonable limit for admin view

        if (error) {
          logger.error("Error fetching all eSIMs", error);
          throw new GraphQLError("Failed to fetch eSIMs", {
            extensions: { code: "INTERNAL_ERROR" },
          });
        }

        // Transform the data to match AdminESIM type
        const transformedESIMs = await Promise.all(
          (esims || []).map(async (esim) => {
            // Try to get real-time status from API
            let apiStatus = esim.status;
            let usage = null;
            
            try {
              const apiESIM = await context.dataSources.esims.getESIM(esim.iccid);
              if (apiESIM) {
                apiStatus = apiESIM.status;
                const apiUsage = await context.dataSources.esims.getESIMUsage(esim.iccid);
                usage = {
                  totalUsed: apiUsage.totalUsed / (1024 * 1024),
                  totalRemaining: apiUsage.totalRemaining ? apiUsage.totalRemaining / (1024 * 1024) : null,
                  activeBundles: apiUsage.activeBundles
                };
              }
            } catch (error) {
              // Log but don't fail if API call fails
              logger.debug("Could not fetch API data for eSIM", { iccid: esim.iccid });
            }

            return {
              id: esim.id,
              iccid: esim.iccid,
              userId: esim.user_id,
              orderId: esim.order_id,
              status: esim.status,
              apiStatus,
              customerRef: esim.customer_ref,
              assignedDate: esim.assigned_date,
              activationCode: esim.activation_code,
              qrCodeUrl: esim.qr_code_url,
              smdpAddress: esim.smdp_address,
              matchingId: esim.matching_id,
              lastAction: esim.last_action,
              actionDate: esim.action_date,
              createdAt: esim.created_at || "",
              updatedAt: esim.updated_at || "",
              usage,
              user: null, // Will be populated below
              order: esim.esim_orders ? {
                id: esim.esim_orders.id,
                reference: esim.esim_orders.reference,
                bundleName: esim.esim_orders.plan_data?.name || null
              } : null
            };
          })
        );

        // Fetch user profiles
        const userIds = [...new Set(transformedESIMs.map(esim => esim.userId))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .in('id', userIds);
          
          const profileMap = new Map(
            (profiles || []).map(profile => [profile.id, profile])
          );

          // Try to fetch emails from auth users
          try {
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const emailMap = new Map(
              authUsers?.users
                .filter(user => userIds.includes(user.id))
                .map(user => [user.id, user.email]) || []
            );

            // Update esims with user data
            transformedESIMs.forEach(esim => {
              const profile = profileMap.get(esim.userId);
              if (profile) {
                esim.user = {
                  id: profile.id,
                  email: emailMap.get(profile.id) || '',
                  firstName: profile.first_name,
                  lastName: profile.last_name
                };
              }
            });
          } catch (error) {
            // If we can't get emails, just use profile data
            transformedESIMs.forEach(esim => {
              const profile = profileMap.get(esim.userId);
              if (profile) {
                esim.user = {
                  id: profile.id,
                  email: '',
                  firstName: profile.first_name,
                  lastName: profile.last_name
                };
              }
            });
          }
        }

        return transformedESIMs;
      } catch (error) {
        logger.error("Error in getAllESIMs resolver", error as Error);
        throw new GraphQLError("Failed to fetch eSIMs", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    getCustomerESIMs: async (_, { userId }, context: Context) => {
      // Check admin authorization
      if (!context.auth?.isAuthenticated) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      
      // The @auth directive will handle the role check

      try {
        // Get all eSIMs for the user
        const esims = await context.repositories.esim.getESIMsWithBundles(userId);
        
        // Enhance with real-time data from eSIM Go API
        const enhancedESIMs = await Promise.all(
          esims.map(async (esim) => {
            try {
              const apiESIM = await context.dataSources.esims.getESIM(esim.iccid);
              const usage = await context.dataSources.esims.getESIMUsage(esim.iccid);
              
              return {
                ...esim,
                apiStatus: apiESIM?.status || esim.status,
                usage: {
                  totalUsed: usage.totalUsed / (1024 * 1024),
                  totalRemaining: usage.totalRemaining ? usage.totalRemaining / (1024 * 1024) : null,
                  activeBundles: usage.activeBundles
                }
              };
            } catch (error) {
              logger.error("Error fetching eSIM details from API", error as Error, {
                iccid: esim.iccid
              });
              return esim;
            }
          })
        );
        
        return enhancedESIMs;
      } catch (error) {
        logger.error("Error fetching customer eSIMs", error as Error);
        throw new GraphQLError("Failed to fetch customer eSIMs", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    getAdminESIMDetails: async (_, { iccid }, context: Context) => {
      // Check admin authorization
      if (!context.auth?.isAuthenticated) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      
      // The @auth directive will handle the role check

      try {
        // Get eSIM from database
        const dbESIM = await context.repositories.esim.getByICCID(iccid);
        if (!dbESIM) {
          throw new GraphQLError("eSIM not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        // Get full details from API
        const apiESIM = await context.dataSources.esims.getESIM(iccid);
        const usage = await context.dataSources.esims.getESIMUsage(iccid);
        
        // Get order details
        const order = await context.repositories.orders.getOrderWithESIMs(dbESIM.order_id);
        
        return {
          ...dbESIM,
          apiDetails: apiESIM,
          usage: {
            totalUsed: usage.totalUsed / (1024 * 1024),
            totalRemaining: usage.totalRemaining ? usage.totalRemaining / (1024 * 1024) : null,
            activeBundles: usage.activeBundles
          },
          order
        };
      } catch (error) {
        logger.error("Error fetching admin eSIM details", error as Error);
        throw new GraphQLError("Failed to fetch eSIM details", {
          extensions: { code: "INTERNAL_ERROR" },
        });
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
              .eq("id", dbESIM.esim_orders.data_plan_id || "")
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

    orderDetails: async (_, { id }, context: Context) => {
      try {
        const order = await context.repositories.orders.getOrderWithESIMs(id);
        if (!order) {
          throw new GraphQLError("Order not found", {
            extensions: { code: "ORDER_NOT_FOUND" },
          });
        }
        
        // Transform eSIMs to map qr_code_url to qrCode and include activation fields
        const transformedEsims = order.esims.map((esim) => {
          
          // Generate installation links if we have the required data
          let installationLinks = null;
          if (esim.smdp_address && esim.matching_id) {
            installationLinks = generateInstallationLinks({
              smDpAddress: esim.smdp_address,
              activationCode: esim.matching_id,
              confirmationCode: null // eSIM Go doesn't use confirmation codes
            });
          }
          
          return {
            ...esim,
            qrCode: esim.qr_code_url,
            smdpAddress: esim.smdp_address,
            matchingId: esim.matching_id,
            installationLinks
          };
        });
        

        // Convert snake_case to camelCase for the main order object
        const camelCaseOrder = Object.fromEntries(
          Object.entries(order).map(([key, value]) => {
            if (key === "esims") {
              // Use the transformed eSIMs with qrCode field
              return [key, transformedEsims];
            }
            return [
              key.replace(/([-_][a-z])/gi, (match) =>
                match.toUpperCase().replace("-", "").replace("_", "")
              ),
              value,
            ];
          })
        );

        
        const response = camelCaseOrder as Order;
        logger.debug("Order response processed", {
          orderId: response.id,
          operationType: "order-processing",
        });

        return response;
      } catch (error) {
        logger.error("Error fetching order details", error as Error, {
          operationType: "order-processing",
        });
        throw new GraphQLError("Failed to fetch order details", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    
  },

  Mutation: {
    // eSIM purchase
    purchaseESIM: async (_, { planId, input }, context: Context) => {
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
          .eq("id", dbESIM.esim_orders.data_plan_id || "")
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

    activateESIM: async (_, { esimId }, context: Context) => {
      // This will be protected by @auth directive
      // TODO: Implement actual eSIM activation
      return {
        success: false,
        error: "Not implemented yet",
        esim: null,
      };
    },
  },

  Subscription: {
    // TODO: Implement real-time eSIM status updates
    esimStatusUpdated: {
      subscribe: () => {
        throw new Error("Subscriptions not implemented yet");
      },
    },
  },
};
