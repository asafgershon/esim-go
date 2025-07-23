import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import type { Resolvers } from "../types";
import { supabaseAdmin } from "../context/supabase-auth";
import { createLogger } from "../lib/logger";

const logger = createLogger({ component: "orders-resolvers" });

export const ordersResolvers: Partial<Resolvers> = {
  Query: {
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
        status: order.status as any,
        quantity: order.quantity,
        totalPrice: order.total_price,
        createdAt: order.created_at || new Date().toISOString(),
        updatedAt: order.updated_at || new Date().toISOString(),
        bundleId: order.data_plan_id,
        bundleName: `Bundle ${order.data_plan_id}`, // Fallback since bundle_name doesn't exist in schema
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
        status: order.status as any,
        quantity: order.quantity,
        totalPrice: order.total_price,
        createdAt: order.created_at || new Date().toISOString(),
        updatedAt: order.updated_at || new Date().toISOString(),
        bundleId: order.data_plan_id,
        bundleName: `Bundle ${order.data_plan_id}`, // Fallback since bundle_name doesn't exist in schema
        esims: [], // Will be resolved by field resolver
        user: { id: order.user_id } as any, // Will be resolved by field resolver
      }));
    },
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
      })) as any;
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

      // Use profiles table instead of auth.users since it's not accessible
      const { data: userData, error: userError } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", orderData.user_id)
        .single();

      if (userError || !userData) {
        // Return null if user not found instead of throwing error
        return null;
      }

      return {
        id: userData.id,
        email: "", // Not available in profiles table
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        phoneNumber: null, // Not available in profiles table
        role: "USER", // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orderCount: 0, // Will be resolved by field resolver
      };
    },
  },
}; 