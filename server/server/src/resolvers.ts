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
import { tripsResolvers } from "./resolvers/trips-resolvers";
import { markupConfigResolvers } from "./resolvers/markup-config-resolvers";
import { GraphQLError } from "graphql";
import { PaymentMethod } from "./types";
import { createLogger } from "./lib/logger";

const logger = createLogger({ component: 'resolvers' });

// Helper function to map GraphQL enum to internal payment method type
function mapPaymentMethodEnum(paymentMethod?: PaymentMethod | null): 'israeli_card' | 'foreign_card' | 'bit' | 'amex' | 'diners' {
  switch (paymentMethod) {
    case PaymentMethod.IsraeliCard:
      return 'israeli_card';
    case PaymentMethod.ForeignCard:
      return 'foreign_card';
    case PaymentMethod.Bit:
      return 'bit';
    case PaymentMethod.Amex:
      return 'amex';
    case PaymentMethod.Diners:
      return 'diners';
    default:
      return 'israeli_card'; // Default fallback
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
        user: { id: order.user_id } as any, // Will be resolved by field resolver
      }));
    },

    // Users resolvers are merged from users-resolvers.ts
    ...usersResolvers.Query!,
    
    // Trips resolvers are merged from trips-resolvers.ts
    ...tripsResolvers.Query!,
    
    // Markup config resolvers are merged from markup-config-resolvers.ts
    ...markupConfigResolvers.Query!,
    
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
        logger.debug('Order response processed', { 
          orderId: response.id,
          operationType: 'order-processing'
        });

        return response;
      } catch (error) {
        logger.error('Error fetching order details', error as Error, { 
          operationType: 'order-processing'
        });
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
    // trips resolver moved to tripsResolvers
    calculatePrice: async (
      _,
      { numOfDays, regionId, countryId, paymentMethod },
      context: Context
    ) => {
      const { PricingService } = await import('./services/pricing.service');
      
      // Get pricing configuration for the bundle (now uses eSIM Go API + configuration rules)
      const { PricingConfigRepository } = await import('./repositories/pricing-configs/pricing-config.repository');
      const configRepository = new PricingConfigRepository();
      const config = await PricingService.getPricingConfig(
        countryId, 
        numOfDays, 
        context.dataSources.catalogue, 
        configRepository,
        mapPaymentMethodEnum(paymentMethod),
        context.dataSources.pricing
      );
      
      // Get bundle and country names
      const bundleName = PricingService.getBundleName(numOfDays);
      const countryName = PricingService.getCountryName(countryId);
      
      // Calculate detailed pricing breakdown
      const pricingBreakdown = PricingService.calculatePricing(
        bundleName,
        countryName,
        numOfDays,
        config
      );

      return pricingBreakdown;
    },
    calculatePrices: async (_, { inputs }, context: Context) => {
      const { PricingService } = await import('./services/pricing.service');
      const { PricingConfigRepository } = await import('./repositories/pricing-configs/pricing-config.repository');
      const configRepository = new PricingConfigRepository();
      
      const results = await Promise.all(
        inputs.map(async (input: { numOfDays: number; regionId: string; countryId: string; paymentMethod?: string }) => {
          try {
            // Get pricing configuration for the bundle
            const config = await PricingService.getPricingConfig(
              input.countryId, 
              input.numOfDays, 
              context.dataSources.catalogue, 
              configRepository,
              mapPaymentMethodEnum(input.paymentMethod),
              context.dataSources.pricing
            );
            
            // Get bundle and country names
            const bundleName = PricingService.getBundleName(input.numOfDays);
            const countryName = PricingService.getCountryName(input.countryId);
            
            // Calculate detailed pricing breakdown
            const pricingBreakdown = PricingService.calculatePricing(
              bundleName,
              countryName,
              input.numOfDays,
              config
            );

            return pricingBreakdown;
          } catch (error) {
            console.error(`Error calculating pricing for ${input.countryId} ${input.numOfDays}d:`, error);
            // Return a fallback pricing breakdown
            return {
              bundleName: PricingService.getBundleName(input.numOfDays),
              countryName: PricingService.getCountryName(input.countryId),
              duration: input.numOfDays,
              cost: 0,
              costPlus: 0,
              totalCost: 0,
              discountRate: 0,
              discountValue: 0,
              priceAfterDiscount: 0,
              processingRate: 0,
              processingCost: 0,
              revenueAfterProcessing: 0,
              finalRevenue: 0,
              currency: 'USD'
            };
          }
        })
      );

      return results;
    },
    pricingConfigurations: async (_, __, context: Context) => {
      const { PricingConfigRepository } = await import('./repositories/pricing-configs/pricing-config.repository');
      const repository = new PricingConfigRepository();
      
      const configurations = await repository.getAllConfigurations();
      return configurations.map(config => ({
        id: config.id,
        name: config.name,
        description: config.description,
        countryId: config.countryId,
        regionId: config.regionId,
        duration: config.duration,
        bundleGroup: config.bundleGroup,
        costSplitPercent: config.costSplitPercent,
        discountRate: config.discountRate,
        processingRate: config.processingRate,
        isActive: config.isActive,
        priority: config.priority,
        createdBy: config.createdBy,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }));
    },

    // Processing Fee Configuration Queries
    currentProcessingFeeConfiguration: async (_, __, context: Context) => {
      const { ProcessingFeeRepository } = await import('./repositories/processing-fees/processing-fee.repository');
      const repository = new ProcessingFeeRepository();
      
      const config = await repository.getCurrentActive();
      if (!config) {
        return null;
      }

      return {
        id: config.id,
        israeliCardsRate: config.israeli_cards_rate,
        foreignCardsRate: config.foreign_cards_rate,
        premiumDinersRate: config.premium_diners_rate,
        premiumAmexRate: config.premium_amex_rate,
        bitPaymentRate: config.bit_payment_rate,
        fixedFeeNIS: config.fixed_fee_nis,
        fixedFeeForeign: config.fixed_fee_foreign,
        monthlyFixedCost: config.monthly_fixed_cost,
        bankWithdrawalFee: config.bank_withdrawal_fee,
        monthlyMinimumFee: config.monthly_minimum_fee,
        setupCost: config.setup_cost,
        threeDSecureFee: config.three_d_secure_fee,
        chargebackFee: config.chargeback_fee,
        cancellationFee: config.cancellation_fee,
        invoiceServiceFee: config.invoice_service_fee,
        appleGooglePayFee: config.apple_google_pay_fee,
        isActive: config.is_active,
        effectiveFrom: config.effective_from,
        effectiveTo: config.effective_to,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
        createdBy: config.created_by,
        notes: config.notes,
      };
    },

    processingFeeConfigurations: async (_, { limit = 10, offset = 0, includeInactive = false }, context: Context) => {
      const { ProcessingFeeRepository } = await import('./repositories/processing-fees/processing-fee.repository');
      const repository = new ProcessingFeeRepository();
      
      const configurations = await repository.getAll(limit, offset, includeInactive);
      
      return configurations.map(config => ({
        id: config.id,
        israeliCardsRate: config.israeli_cards_rate,
        foreignCardsRate: config.foreign_cards_rate,
        premiumDinersRate: config.premium_diners_rate,
        premiumAmexRate: config.premium_amex_rate,
        bitPaymentRate: config.bit_payment_rate,
        fixedFeeNIS: config.fixed_fee_nis,
        fixedFeeForeign: config.fixed_fee_foreign,
        monthlyFixedCost: config.monthly_fixed_cost,
        bankWithdrawalFee: config.bank_withdrawal_fee,
        monthlyMinimumFee: config.monthly_minimum_fee,
        setupCost: config.setup_cost,
        threeDSecureFee: config.three_d_secure_fee,
        chargebackFee: config.chargeback_fee,
        cancellationFee: config.cancellation_fee,
        invoiceServiceFee: config.invoice_service_fee,
        appleGooglePayFee: config.apple_google_pay_fee,
        isActive: config.is_active,
        effectiveFrom: config.effective_from,
        effectiveTo: config.effective_to,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
        createdBy: config.created_by,
        notes: config.notes,
      }));
    },

    processingFeeConfiguration: async (_, { id }, context: Context) => {
      const { ProcessingFeeRepository } = await import('./repositories/processing-fees/processing-fee.repository');
      const repository = new ProcessingFeeRepository();
      
      const config = await repository.getById(id);
      if (!config) {
        return null;
      }

      return {
        id: config.id,
        israeliCardsRate: config.israeli_cards_rate,
        foreignCardsRate: config.foreign_cards_rate,
        premiumDinersRate: config.premium_diners_rate,
        premiumAmexRate: config.premium_amex_rate,
        bitPaymentRate: config.bit_payment_rate,
        fixedFeeNIS: config.fixed_fee_nis,
        fixedFeeForeign: config.fixed_fee_foreign,
        monthlyFixedCost: config.monthly_fixed_cost,
        bankWithdrawalFee: config.bank_withdrawal_fee,
        monthlyMinimumFee: config.monthly_minimum_fee,
        setupCost: config.setup_cost,
        threeDSecureFee: config.three_d_secure_fee,
        chargebackFee: config.chargeback_fee,
        cancellationFee: config.cancellation_fee,
        invoiceServiceFee: config.invoice_service_fee,
        appleGooglePayFee: config.apple_google_pay_fee,
        isActive: config.is_active,
        effectiveFrom: config.effective_from,
        effectiveTo: config.effective_to,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
        createdBy: config.created_by,
        notes: config.notes,
      };
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
        console.error("Error fetching order count:", error);
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
    ...tripsResolvers.Mutation!,
    ...markupConfigResolvers.Mutation!,
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
          orderCount: 0, // Will be resolved by field resolver
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
          orderCount: 0, // Will be resolved by field resolver
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
          orderCount: 0, // Will be resolved by field resolver
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
          orderCount: 0, // Will be resolved by field resolver
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
          orderCount: 0, // Will be resolved by field resolver
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
              currency: plan.currency || 'USD',
              isUnlimited: plan.unlimited || false,
              bundleGroup: plan.bundleGroup,
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
              currency: plan.currency || 'USD',
              isUnlimited: plan.unlimited || false,
              bundleGroup: plan.bundleGroup,
              availableQuantity: plan.availableQuantity,
              countries: plan.countries?.map(c => ({
                iso: c.iso,
                name: c.name || c.country || '',
                nameHebrew: c.hebrewName || c.name || c.country || '',
                region: c.region || '',
                flag: c.flag || '',
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

    // Pricing Configuration Management
    updatePricingConfiguration: async (_, { input }, context: Context) => {
      try {
        const { PricingConfigRepository } = await import('./repositories/pricing-configs/pricing-config.repository');
        const repository = new PricingConfigRepository();

        const configuration = await repository.upsertConfiguration(input, context.auth.user!.id);

        return {
          success: true,
          configuration: {
            id: configuration.id,
            name: configuration.name,
            description: configuration.description,
            countryId: configuration.countryId,
            regionId: configuration.regionId,
            duration: configuration.duration,
            bundleGroup: configuration.bundleGroup,
            costSplitPercent: configuration.costSplitPercent,
            discountRate: configuration.discountRate,
            processingRate: configuration.processingRate,
            isActive: configuration.isActive,
            priority: configuration.priority,
            createdBy: configuration.createdBy,
            createdAt: configuration.createdAt,
            updatedAt: configuration.updatedAt,
          },
          error: null,
        };
      } catch (error) {
        return {
          success: false,
          configuration: null,
          error: (error as Error).message,
        };
      }
    },

    // Processing Fee Configuration Mutations
    createProcessingFeeConfiguration: async (_, { input }, context: Context) => {
      const { ProcessingFeeRepository } = await import('./repositories/processing-fees/processing-fee.repository');
      const repository = new ProcessingFeeRepository();

      const configuration = await repository.create({
        israeli_cards_rate: input.israeliCardsRate,
        foreign_cards_rate: input.foreignCardsRate,
        premium_diners_rate: input.premiumDinersRate,
        premium_amex_rate: input.premiumAmexRate,
        bit_payment_rate: input.bitPaymentRate,
        fixed_fee_nis: input.fixedFeeNIS,
        fixed_fee_foreign: input.fixedFeeForeign,
        monthly_fixed_cost: input.monthlyFixedCost,
        bank_withdrawal_fee: input.bankWithdrawalFee,
        monthly_minimum_fee: input.monthlyMinimumFee,
        setup_cost: input.setupCost,
        three_d_secure_fee: input.threeDSecureFee,
        chargeback_fee: input.chargebackFee,
        cancellation_fee: input.cancellationFee,
        invoice_service_fee: input.invoiceServiceFee,
        apple_google_pay_fee: input.appleGooglePayFee,
        is_active: true, // New configurations are active by default
        effective_from: input.effectiveFrom,
        effective_to: input.effectiveTo,
        created_by: context.auth.user!.id,
        notes: input.notes,
      });

      return {
        id: configuration.id,
        israeliCardsRate: configuration.israeli_cards_rate,
        foreignCardsRate: configuration.foreign_cards_rate,
        premiumDinersRate: configuration.premium_diners_rate,
        premiumAmexRate: configuration.premium_amex_rate,
        bitPaymentRate: configuration.bit_payment_rate,
        fixedFeeNIS: configuration.fixed_fee_nis,
        fixedFeeForeign: configuration.fixed_fee_foreign,
        monthlyFixedCost: configuration.monthly_fixed_cost,
        bankWithdrawalFee: configuration.bank_withdrawal_fee,
        monthlyMinimumFee: configuration.monthly_minimum_fee,
        setupCost: configuration.setup_cost,
        threeDSecureFee: configuration.three_d_secure_fee,
        chargebackFee: configuration.chargeback_fee,
        cancellationFee: configuration.cancellation_fee,
        invoiceServiceFee: configuration.invoice_service_fee,
        appleGooglePayFee: configuration.apple_google_pay_fee,
        isActive: configuration.is_active,
        effectiveFrom: configuration.effective_from,
        effectiveTo: configuration.effective_to,
        createdAt: configuration.created_at,
        updatedAt: configuration.updated_at,
        createdBy: configuration.created_by,
        notes: configuration.notes,
      };
    },

    updateProcessingFeeConfiguration: async (_, { id, input }, context: Context) => {
      const { ProcessingFeeRepository } = await import('./repositories/processing-fees/processing-fee.repository');
      const repository = new ProcessingFeeRepository();

      const configuration = await repository.update(id, {
        israeli_cards_rate: input.israeliCardsRate,
        foreign_cards_rate: input.foreignCardsRate,
        premium_diners_rate: input.premiumDinersRate,
        premium_amex_rate: input.premiumAmexRate,
        bit_payment_rate: input.bitPaymentRate,
        fixed_fee_nis: input.fixedFeeNIS,
        fixed_fee_foreign: input.fixedFeeForeign,
        monthly_fixed_cost: input.monthlyFixedCost,
        bank_withdrawal_fee: input.bankWithdrawalFee,
        monthly_minimum_fee: input.monthlyMinimumFee,
        setup_cost: input.setupCost,
        three_d_secure_fee: input.threeDSecureFee,
        chargeback_fee: input.chargebackFee,
        cancellation_fee: input.cancellationFee,
        invoice_service_fee: input.invoiceServiceFee,
        apple_google_pay_fee: input.appleGooglePayFee,
        effective_from: input.effectiveFrom,
        effective_to: input.effectiveTo,
        notes: input.notes,
      });

      return {
        id: configuration.id,
        israeliCardsRate: configuration.israeli_cards_rate,
        foreignCardsRate: configuration.foreign_cards_rate,
        premiumDinersRate: configuration.premium_diners_rate,
        premiumAmexRate: configuration.premium_amex_rate,
        bitPaymentRate: configuration.bit_payment_rate,
        fixedFeeNIS: configuration.fixed_fee_nis,
        fixedFeeForeign: configuration.fixed_fee_foreign,
        monthlyFixedCost: configuration.monthly_fixed_cost,
        bankWithdrawalFee: configuration.bank_withdrawal_fee,
        monthlyMinimumFee: configuration.monthly_minimum_fee,
        setupCost: configuration.setup_cost,
        threeDSecureFee: configuration.three_d_secure_fee,
        chargebackFee: configuration.chargeback_fee,
        cancellationFee: configuration.cancellation_fee,
        invoiceServiceFee: configuration.invoice_service_fee,
        appleGooglePayFee: configuration.apple_google_pay_fee,
        isActive: configuration.is_active,
        effectiveFrom: configuration.effective_from,
        effectiveTo: configuration.effective_to,
        createdAt: configuration.created_at,
        updatedAt: configuration.updated_at,
        createdBy: configuration.created_by,
        notes: configuration.notes,
      };
    },

    deactivateProcessingFeeConfiguration: async (_, { id }, context: Context) => {
      const { ProcessingFeeRepository } = await import('./repositories/processing-fees/processing-fee.repository');
      const repository = new ProcessingFeeRepository();

      const configuration = await repository.deactivate(id);

      return {
        id: configuration.id,
        israeliCardsRate: configuration.israeli_cards_rate,
        foreignCardsRate: configuration.foreign_cards_rate,
        premiumDinersRate: configuration.premium_diners_rate,
        premiumAmexRate: configuration.premium_amex_rate,
        bitPaymentRate: configuration.bit_payment_rate,
        fixedFeeNIS: configuration.fixed_fee_nis,
        fixedFeeForeign: configuration.fixed_fee_foreign,
        monthlyFixedCost: configuration.monthly_fixed_cost,
        bankWithdrawalFee: configuration.bank_withdrawal_fee,
        monthlyMinimumFee: configuration.monthly_minimum_fee,
        setupCost: configuration.setup_cost,
        threeDSecureFee: configuration.three_d_secure_fee,
        chargebackFee: configuration.chargeback_fee,
        cancellationFee: configuration.cancellation_fee,
        invoiceServiceFee: configuration.invoice_service_fee,
        appleGooglePayFee: configuration.apple_google_pay_fee,
        isActive: configuration.is_active,
        effectiveFrom: configuration.effective_from,
        effectiveTo: configuration.effective_to,
        createdAt: configuration.created_at,
        updatedAt: configuration.updated_at,
        createdBy: configuration.created_by,
        notes: configuration.notes,
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
