import {
  signInWithApple,
  signInWithGoogle,
  sendPhoneOTP,
  supabaseAdmin,
  verifyPhoneOTP,
} from "./context/supabase-auth";
import type { Context } from "./context/types";
import type { DataPlan, Order, Resolvers } from "./types";
import { esimResolvers } from "./resolvers/esim-resolvers";
import { checkoutResolvers } from "./resolvers/checkout-resolvers";
import { GraphQLError } from "graphql";

export const resolvers: Resolvers = {
  Query: {
    hello: () => "Hello eSIM Go!",

    // Auth-protected resolver example
    me: async (_, __, context: Context) => {
      // This will be protected by @auth directive
      return context.auth.user;
    },

    // eSIM resolvers are merged from esim-resolvers.ts
    ...esimResolvers.Query!,
    myESIMs: async (_, __, context: Context) => {
      // This will be protected by @auth directive
      // TODO: Implement actual eSIM fetching
      return [];
    },

    esimDetails: async (_, { id }, context: Context) => {
      // This will be protected by @auth directive
      // TODO: Implement actual eSIM details fetching
      return null;
    },
    orderDetails: async (_, { id }, context: Context) => {
      const { data, error } = await supabaseAdmin
        .from("esim_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching order details:", error);
        throw new Error("Failed to fetch order details");
      }

      const camelCaseData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key.replace(/([-_][a-z])/gi, (match) =>
            match.toUpperCase().replace("-", "").replace("_", "")
          ),
          value,
        ])
      );
      return camelCaseData as Order;
    },
    countries: async (_, __, context: Context) => {
      const countries = await context.dataSources.countries.getCountries();
      return countries.map((country) => ({
        iso: country.iso,
        name: country.country,
        nameHebrew: country.hebrewName,
        region: country.region,
        flag: country.flag,
      }));
    },
    trips: async (_, __, context: Context) => {
      const regions = context.dataSources.regions.getRegions();
      return regions.map((region) => ({
        name: region.name,
        description: `${region.nameHebrew} - ${region.countryIds.length} countries`,
        regionId: region.name.toLowerCase().replace(/\s+/g, "-"),
        countryIds: region.countryIds,
        countries: [], // Placeholder - will be resolved by field resolver
      }));
    },
    calculatePrice: async (
      _,
      { numOfDays, regionId, countryId },
      context: Context
    ) => {
      return context.services.pricing.calculatePrice(
        numOfDays,
        regionId,
        countryId,
        context.dataSources.catalogue
      ).then((pricing) => pricing.finalPrice);
    },
    ...checkoutResolvers.Query!,
  },
  Order: {
    esims: async (parent, _, context: Context) => {
      const { data, error } = await supabaseAdmin
        .from("esims")
        .select("*")
        .eq("order_id", parent.id);
      return data || [];
    },
    dataPlan: async (parent, _, context: Context) => {
      const dataPlanId = parent.dataPlan?.id;

      if (!dataPlanId) {
        throw new GraphQLError("Data plan ID not found", {
          extensions: {
            code: "DATA_PLAN_ID_NOT_FOUND",
          },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("data_plans")
        .select("*")
        .eq("id", parent.dataPlan.id);

      if (!data) {
        throw new Error("Data plan not found");
      }

      return data[0] as unknown as DataPlan;
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
        isos: parent.countryIds
      });
      
      return countries.map((country) => ({
        iso: country.iso,
        name: country.country,
        nameHebrew: country.hebrewName,
        region: country.region,
        flag: country.flag,
      }));
    },
  },

  Mutation: {
    ...checkoutResolvers.Mutation!,
    signUp: async (_, { input }) => {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          user_metadata: {
            first_name: input.firstName,
            last_name: input.lastName,
            phone_number: input.phoneNumber,
            role: "USER", // Default role
          },
          email_confirm: false, // Set to true if you want email confirmation
        });

        if (error) {
          return {
            success: false,
            error: error.message,
            user: null,
            sessionToken: null,
            refreshToken: null,
          };
        }

        // Generate session for the new user
        const { data: sessionData, error: sessionError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email: input.email,
            password: input.password,
          });

        if (sessionError) {
          return {
            success: false,
            error: sessionError.message,
            user: null,
            sessionToken: null,
            refreshToken: null,
          };
        }

        // Map to your User type
        const user = {
          id: data.user!.id,
          email: data.user!.email!,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          createdAt: data.user!.created_at,
          updatedAt: data.user!.updated_at || data.user!.created_at,
        };

        return {
          success: true,
          error: null,
          user,
        };
      } catch (error) {
        return {
          success: false,
          error: "An unexpected error occurred during signup",
          user: null,
          sessionToken: null,
          refreshToken: null,
        };
      }
    },

    signIn: async (_, { input }) => {
      try {
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        if (error) {
          return {
            success: false,
            error: error.message,
            user: null,
            sessionToken: null,
            refreshToken: null,
          };
        }

        // Map to your User type
        const user = {
          id: data.user!.id,
          email: data.user!.email!,
          firstName: data.user!.user_metadata?.first_name || "",
          lastName: data.user!.user_metadata?.last_name || "",
          phoneNumber:
            data.user!.phone || data.user!.user_metadata?.phone_number || null,
          createdAt: data.user!.created_at,
          updatedAt: data.user!.updated_at || data.user!.created_at,
        };

        return {
          success: true,
          error: null,
          user,
          sessionToken: data.session?.access_token || null,
          refreshToken: data.session?.refresh_token || null,
        };
      } catch (error) {
        return {
          success: false,
          error: "An unexpected error occurred during sign in",
          user: null,
          sessionToken: null,
          refreshToken: null,
        };
      }
    },

    // Social Authentication
    signInWithApple: async (_, { input }) => {
      try {
        const result = await signInWithApple(
          input.idToken,
          input.firstName || "",
          input.lastName || ""
        );

        if (!result.success) {
          return {
            success: false,
            error: result.error,
            user: null,
            sessionToken: null,
            refreshToken: null,
          };
        }

        // Map Supabase user to GraphQL User type
        const user = {
          id: result.user!.id,
          email: result.user!.email || "",
          firstName:
            result.user!.user_metadata?.first_name || input.firstName || "",
          lastName:
            result.user!.user_metadata?.last_name || input.lastName || "",
          phoneNumber: result.user!.phone || null,
          createdAt: result.user!.created_at,
          updatedAt: result.user!.updated_at || result.user!.created_at,
        };

        return {
          success: true,
          error: null,
          user,
          sessionToken: result.session?.access_token || null,
          refreshToken: result.session?.refresh_token || null,
        };
      } catch (error) {
        return {
          success: false,
          error: "Apple sign-in failed",
          user: null,
          sessionToken: null,
          refreshToken: null,
        };
      }
    },

    signInWithGoogle: async (_, { input }) => {
      try {
        const result = await signInWithGoogle(
          input.idToken || "",
          input.firstName || "",
          input.lastName || ""
        );

        if (!result.success) {
          return {
            success: false,
            error: result.error,
            user: null,
            sessionToken: null,
            refreshToken: null,
          };
        }

        // Map Supabase user to GraphQL User type
        const user = {
          id: result.user!.id,
          email: result.user!.email || "",
          firstName:
            result.user!.user_metadata?.first_name || input.firstName || "",
          lastName:
            result.user!.user_metadata?.last_name || input.lastName || "",
          phoneNumber: result.user!.phone || null,
          createdAt: result.user!.created_at,
          updatedAt: result.user!.updated_at || result.user!.created_at,
        };

        return {
          success: true,
          error: null,
          user,
          sessionToken: result.session?.access_token || null,
          refreshToken: result.session?.refresh_token || null,
        };
      } catch (error) {
        return {
          success: false,
          error: "Google sign-in failed",
          user: null,
          sessionToken: null,
          refreshToken: null,
        };
      }
    },

    // Phone Authentication
    sendPhoneOTP: async (_, { phoneNumber }) => {
      try {
        const result = await sendPhoneOTP(phoneNumber);

        return {
          success: result.success,
          error: result.error,
          messageId: result.messageId,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to send OTP",
          messageId: null,
        };
      }
    },

    verifyPhoneOTP: async (_, { input }) => {
      try {
        const result = await verifyPhoneOTP(
          input.phoneNumber,
          input.otp,
          input.firstName || "",
          input.lastName || ""
        );

        if (!result.success) {
          return {
            success: false,
            error: result.error,
            user: null,
            sessionToken: null,
            refreshToken: null,
          };
        }

        // Map Supabase user to GraphQL User type
        const user = {
          id: result.user!.id,
          email: result.user!.email || "",
          firstName:
            result.user!.user_metadata?.first_name || input.firstName || "",
          lastName:
            result.user!.user_metadata?.last_name || input.lastName || "",
          phoneNumber: result.user!.phone || input.phoneNumber,
          createdAt: result.user!.created_at,
          updatedAt: result.user!.updated_at || result.user!.created_at,
        };

        return {
          success: true,
          error: null,
          user,
          sessionToken: result.session?.access_token || null,
          refreshToken: result.session?.refresh_token || null,
        };
      } catch (error) {
        return {
          success: false,
          error: "Phone verification failed",
          user: null,
          sessionToken: null,
          refreshToken: null,
        };
      }
    },

    // TODO: Implement eSIM Go mutations
    purchaseESIM: async (_, { planId, input }, context: Context) => {
      // This will be protected by @auth directive
      // TODO: Implement actual eSIM purchase
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

    // eSIM resolvers are merged from esim-resolvers.ts
    ...esimResolvers.Mutation!,
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
