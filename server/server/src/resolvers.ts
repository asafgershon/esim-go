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
import { usersResolvers } from "./resolvers/users-resolvers";
import { GraphQLError } from "graphql";

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

      return data.map(order => ({
        id: order.id,
        reference: order.reference,
        status: order.status,
        quantity: order.quantity,
        totalPrice: order.total_price,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        dataPlan: { id: order.data_plan_id } as DataPlan, // Will be resolved by field resolver
        esims: [], // Will be resolved by field resolver
      }));
    },

    // Users resolvers are merged from users-resolvers.ts
    ...usersResolvers.Query!,
    
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
      try {
        const order = await context.repositories.orders.getOrderWithESIMs(id);
        if (!order) {
          throw new GraphQLError("Order not found", {
            extensions: { code: "ORDER_NOT_FOUND" },
          });
        }
        // Transform eSIMs to map qr_code_url to qrCode
        const transformedEsims = order.esims.map((esim) => {
          return {
            ...esim,
            qrCode: esim.qr_code_url,
          };
        });

        // Convert snake_case to camelCase for the main order object
        const camelCaseOrder = Object.fromEntries(
          Object.entries(order).map(([key, value]) => {
            if (key === 'esims') {
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
        console.log("response", response);

        return response;
      } catch (error) {
        console.error("Error fetching order details:", error);
        throw new GraphQLError("Failed to fetch order details", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },
    countries: async (_, __, context: Context) => {
      const countries = await context.dataSources.countries.getCountries();
      return countries.map((country) => ({
        iso: country.iso,
        name: country.country,
        nameHebrew: country.hebrewName || country.country,
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
      
      if (!data) return [];
      
      // Transform the data to map qr_code_url to qrCode for GraphQL schema
      return data.map((esim) => ({
        ...esim,
        qrCode: esim.qr_code_url,
      }));
    },
    dataPlan: async (parent, _, context: Context) => {
      return null;
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
        nameHebrew: country.hebrewName || country.country,
        region: country.region,
        flag: country.flag,
      }));
    },
  },

  Mutation: {
    ...checkoutResolvers.Mutation!,
    ...usersResolvers.Mutation!,
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
          role: "USER",
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
          role: data.user!.user_metadata?.role || "USER",
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
          role: result.user!.user_metadata?.role || "USER",
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
          role: result.user!.user_metadata?.role || "USER",
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
          role: result.user!.user_metadata?.role || "USER",
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
    
    // Package Assignment
    assignPackageToUser: async (_, { userId, planId }, context: Context) => {
      try {
        // Get the plan details from eSIM Go
        const plans = await context.dataSources.catalogue.getAllBundels();
        const plan = plans.find(p => p.name === planId);
        
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
              currency: plan.currency,
              isUnlimited: plan.isUnlimited,
              bundleGroup: plan.bundleGroup,
              features: plan.features || [],
              countries: plan.countries || [],
            },
            status: "ASSIGNED",
          })
          .select()
          .single();

        if (assignmentError) {
          console.error("Error creating assignment:", assignmentError);
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
              createdAt: userData.created_at,
              updatedAt: userData.updated_at,
            },
            dataPlan: {
              id: planId,
              name: plan.name,
              description: plan.description,
              region: plan.baseCountry?.region || "Unknown",
              duration: plan.duration,
              price: plan.price,
              currency: plan.currency,
              isUnlimited: plan.isUnlimited,
              bundleGroup: plan.bundleGroup,
              features: plan.features || [],
              availableQuantity: plan.availableQuantity,
              countries: plan.countries?.map(c => ({
                iso: c.iso,
                name: c.country,
                nameHebrew: c.hebrewName || c.country,
                region: c.region,
                flag: c.flag,
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
        console.error("Error in assignPackageToUser:", error);
        return {
          success: false,
          error: "Internal server error",
          assignment: null,
        };
      }
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
