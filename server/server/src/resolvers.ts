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

// Simple in-memory cache for bundlesByCountry (TTL: 30 minutes)
const bundlesByCountryCache = {
  data: null as any,
  timestamp: 0,
  TTL: 30 * 60 * 1000, // 30 minutes
  
  get() {
    if (this.data && Date.now() - this.timestamp < this.TTL) {
      return this.data;
    }
    return null;
  },
  
  set(data: any) {
    this.data = data;
    this.timestamp = Date.now();
  },
  
  clear() {
    this.data = null;
    this.timestamp = 0;
  }
};

// Helper function to get representative bundles for aggregation calculations
function getSampleBundles(countryBundles: any[], maxSamples: number = 5): any[] {
  if (countryBundles.length === 0) return [];
  
  // If we have few bundles, use all of them
  if (countryBundles.length <= maxSamples) {
    return countryBundles;
  }
  
  // Sort bundles by duration to get representative spread
  const sortedBundles = [...countryBundles].sort((a, b) => a.duration - b.duration);
  
  // Select bundles to cover duration range
  const samples = [];
  const step = Math.floor(sortedBundles.length / maxSamples);
  
  for (let i = 0; i < maxSamples && i * step < sortedBundles.length; i++) {
    const index = Math.min(i * step, sortedBundles.length - 1);
    samples.push(sortedBundles[index]);
  }
  
  // Always include shortest and longest if not already included
  if (!samples.some(b => b.duration === sortedBundles[0].duration)) {
    samples[0] = sortedBundles[0];
  }
  if (!samples.some(b => b.duration === sortedBundles[sortedBundles.length - 1].duration)) {
    samples[samples.length - 1] = sortedBundles[sortedBundles.length - 1];
  }
  
  logger.info('Selected sample bundles for aggregation', {
    totalBundles: countryBundles.length,
    sampleCount: samples.length,
    sampleDurations: samples.map(b => b.duration),
    operationType: 'sample-selection'
  });
  
  return samples;
}

// Helper function to aggregate pricing results with weighted averages
function aggregatePricingResults(pricingResults: any[], totalBundles: number): any {
  if (pricingResults.length === 0) {
    return {
      avgCost: 0,
      avgCostPlus: 0,
      avgTotalCost: 0,
      avgDiscountRate: 0.3,
      totalDiscountValue: 0,
      avgProcessingRate: 0.045,
      avgProcessingCost: 0,
      avgFinalRevenue: 0,
      avgNetProfit: 0,
      avgPricePerDay: 0,
      calculationMethod: 'ESTIMATED'
    };
  }
  
  const sampleSize = pricingResults.length;
  
  // Calculate weighted averages
  const avgCost = pricingResults.reduce((sum, p) => sum + p.cost, 0) / sampleSize;
  const avgCostPlus = pricingResults.reduce((sum, p) => sum + p.costPlus, 0) / sampleSize;
  const avgTotalCost = pricingResults.reduce((sum, p) => sum + p.totalCost, 0) / sampleSize;
  const avgDiscountRate = pricingResults.reduce((sum, p) => sum + p.discountRate, 0) / sampleSize;
  const avgDiscountValue = pricingResults.reduce((sum, p) => sum + (p.totalCost * p.discountRate), 0) / sampleSize;
  const avgProcessingRate = pricingResults.reduce((sum, p) => sum + p.processingRate, 0) / sampleSize;
  const avgProcessingCost = pricingResults.reduce((sum, p) => sum + p.processingCost, 0) / sampleSize;
  const avgFinalRevenue = pricingResults.reduce((sum, p) => sum + p.finalRevenue, 0) / sampleSize;
  const avgNetProfit = pricingResults.reduce((sum, p) => sum + p.netProfit, 0) / sampleSize;
  const avgDuration = pricingResults.reduce((sum, p) => sum + p.duration, 0) / sampleSize;
  
  // Add safety check for division by zero and debugging
  logger.info('Price per day calculation debug', {
    avgTotalCost,
    avgDuration,
    sampleSize,
    durationsInSample: pricingResults.map(p => p.duration),
    operationType: 'price-per-day-debug'
  });
  
  const avgPricePerDay = avgDuration > 0 ? avgTotalCost / avgDuration : 0;
  
  return {
    avgCost: Number(avgCost.toFixed(2)),
    avgCostPlus: Number(avgCostPlus.toFixed(2)),
    avgTotalCost: Number(avgTotalCost.toFixed(2)),
    avgDiscountRate: Number(avgDiscountRate.toFixed(3)),
    totalDiscountValue: Number((avgDiscountValue * totalBundles).toFixed(2)),
    avgProcessingRate: Number(avgProcessingRate.toFixed(3)),
    avgProcessingCost: Number(avgProcessingCost.toFixed(2)),
    avgFinalRevenue: Number(avgFinalRevenue.toFixed(2)),
    avgNetProfit: Number(avgNetProfit.toFixed(2)),
    avgPricePerDay: Number(avgPricePerDay.toFixed(2)),
    calculationMethod: 'SAMPLED'
  };
}

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
        context.services.pricing
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
              context.services.pricing
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
            logger.error(`Error calculating pricing for ${input.countryId} ${input.numOfDays}d`, error as Error, {
              countryId: input.countryId,
              duration: input.numOfDays,
              operationType: 'pricing-calculation'
            });
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
              finalRevenue: 0,
              netProfit: 0,
              currency: 'USD'
            };
          }
        })
      );

      return results;
    },
    
    bundlesByCountry: async (_, __, context: Context) => {
      logger.info('Fetching bundles by country with aggregated pricing', {
        operationType: 'bundles-by-country-fetch'
      });
      
      // Check cache first
      const cachedData = bundlesByCountryCache.get();
      if (cachedData) {
        logger.info('Returning cached bundlesByCountry data', {
          operationType: 'bundles-by-country-fetch',
          source: 'cache'
        });
        return cachedData;
      }
      
      try {
        const configRepository = context.repositories.pricingConfigs;
        
        // Get all countries
        const countries = await context.dataSources.countries.getCountries();
        
        // Use the cached catalogue data instead of making new API calls
        const dataPlansResult = await context.dataSources.catalogue.searchPlans({});
        const dataPlans = dataPlansResult.bundles || [];
        
        logger.info('Using cached catalogue data', {
          totalBundles: dataPlans.length,
          countries: countries.length,
          operationType: 'bundles-by-country-fetch'
        });
        
        // Group bundles by country and calculate aggregates efficiently
        const countryBundleMap = new Map<string, any[]>();
        
        // Build country to bundles mapping
        for (const bundle of dataPlans) {
          if (bundle.countries) {
            for (const country of bundle.countries) {
              if (!countryBundleMap.has(country.iso)) {
                countryBundleMap.set(country.iso, []);
              }
              countryBundleMap.get(country.iso)!.push({
                bundle,
                duration: bundle.duration,
                name: bundle.name,
                price: bundle.price
              });
            }
          }
        }
        
        // Get all pricing configurations in one query
        const allConfigurations = await configRepository.getAllConfigurations();
        const activeConfigsByCountry = new Map<string, boolean>();
        for (const config of allConfigurations) {
          if (config.isActive && config.countryId) {
            activeConfigsByCountry.set(config.countryId, true);
          }
        }
        
        // Calculate aggregated data for each country
        const bundlesByCountry = await Promise.all(
          countries.map(async (country) => {
            const countryBundles = countryBundleMap.get(country.iso) || [];
            const totalBundles = countryBundles.length;
            
            if (totalBundles === 0) {
              return {
                countryName: country.country,
                countryId: country.iso,
                totalBundles: 0,
                avgPricePerDay: 0,
                hasCustomDiscount: activeConfigsByCountry.has(country.iso) || false,
                avgDiscountRate: 0.3, // Default discount rate
                totalDiscountValue: 0,
                avgCost: 0,
                avgCostPlus: 0,
                avgTotalCost: 0,
                avgProcessingRate: 0.045, // Default processing rate
                avgProcessingCost: 0,
                avgFinalRevenue: 0,
                avgNetProfit: 0,
                totalRevenue: 0,
                avgProfitMargin: 0,
                lastFetched: new Date().toISOString()
              };
            }
            
            // Get representative bundles for real pricing calculations
            const sampleBundles = getSampleBundles(countryBundles, 5);
            let realAggregates;
            
            try {
              // Calculate real pricing for sample bundles using existing pricing service
              const { PricingService } = await import('./services/pricing.service');
              
              const pricingInputs = sampleBundles.map(bundleData => ({
                numOfDays: bundleData.duration,
                countryId: country.iso,
                regionId: country.region || 'unknown'
              }));
              
              // Use the same logic as calculatePrices resolver but for sample bundles
              const pricingResults = await Promise.all(
                pricingInputs.map(async (input) => {
                  try {
                    // Get pricing configuration for the bundle
                    const config = await PricingService.getPricingConfig(
                      input.countryId, 
                      input.numOfDays, 
                      context.dataSources.catalogue, 
                      configRepository,
                      'israeli_card', // Default payment method
                      context.services.pricing
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
                    logger.warn(`Failed to calculate pricing for ${input.countryId} ${input.numOfDays}d, using fallback`, {
                      countryId: input.countryId,
                      duration: input.numOfDays,
                      error: error instanceof Error ? error.message : String(error),
                      operationType: 'pricing-calculation-fallback'
                    });
                    // Return null for failed calculations
                    return null;
                  }
                })
              );
              
              // Filter out failed calculations
              const validResults = pricingResults.filter(result => result !== null);
              
              if (validResults.length > 0) {
                // Use real pricing aggregations
                realAggregates = aggregatePricingResults(validResults, totalBundles);
                logger.info('Using real pricing aggregation for country', {
                  countryId: country.iso,
                  countryName: country.country,
                  totalBundles,
                  sampleSize: validResults.length,
                  calculationMethod: 'SAMPLED',
                  operationType: 'real-pricing-aggregation'
                });
              } else {
                throw new Error('No valid pricing calculations available');
              }
              
            } catch (error) {
              logger.warn('Failed to calculate real pricing, falling back to estimates', {
                countryId: country.iso,
                countryName: country.country,
                totalBundles,
                error: error instanceof Error ? error.message : String(error),
                operationType: 'pricing-fallback'
              });
              
              // Fallback to estimation logic
              const avgPrice = countryBundles.reduce((sum, b) => sum + b.bundle.price, 0) / totalBundles;
              const avgDuration = countryBundles.reduce((sum, b) => sum + b.duration, 0) / totalBundles;
              const defaultDiscountRate = activeConfigsByCountry.has(country.iso) ? 0.25 : 0.3;
              const defaultProcessingRate = 0.045;
              const avgCost = avgPrice * 0.6; // Assume 60% cost split
              const avgCostPlus = avgPrice * 0.1; // Assume 10% additional cost
              const avgTotalCost = avgCost + avgCostPlus;
              const avgDiscountValue = avgTotalCost * defaultDiscountRate;
              const priceAfterDiscount = avgTotalCost - avgDiscountValue;
              const avgProcessingCost = priceAfterDiscount * defaultProcessingRate;
              const avgFinalRevenue = priceAfterDiscount - avgProcessingCost;
              const avgNetProfit = avgFinalRevenue - avgTotalCost;
              // Add safety check for division by zero
              logger.info('Fallback price per day calculation debug', {
                countryId: country.iso,
                avgPrice,
                avgDuration,
                totalBundles,
                operationType: 'fallback-price-per-day-debug'
              });
              
              const avgPricePerDay = avgDuration > 0 ? avgPrice / avgDuration : 0;
              
              realAggregates = {
                avgCost: Number(avgCost.toFixed(2)),
                avgCostPlus: Number(avgCostPlus.toFixed(2)),
                avgTotalCost: Number(avgTotalCost.toFixed(2)),
                avgDiscountRate: defaultDiscountRate,
                totalDiscountValue: Number((avgDiscountValue * totalBundles).toFixed(2)),
                avgProcessingRate: defaultProcessingRate,
                avgProcessingCost: Number(avgProcessingCost.toFixed(2)),
                avgFinalRevenue: Number(avgFinalRevenue.toFixed(2)),
                avgNetProfit: Number(avgNetProfit.toFixed(2)),
                avgPricePerDay: Number(avgPricePerDay.toFixed(2)),
                calculationMethod: 'ESTIMATED'
              };
            }
            
            return {
              countryName: country.country,
              countryId: country.iso,
              totalBundles,
              avgPricePerDay: realAggregates.avgPricePerDay,
              hasCustomDiscount: activeConfigsByCountry.has(country.iso) || false,
              avgDiscountRate: realAggregates.avgDiscountRate,
              totalDiscountValue: realAggregates.totalDiscountValue,
              avgCost: realAggregates.avgCost,
              avgCostPlus: realAggregates.avgCostPlus,
              avgTotalCost: realAggregates.avgTotalCost,
              avgProcessingRate: realAggregates.avgProcessingRate,
              avgProcessingCost: realAggregates.avgProcessingCost,
              avgFinalRevenue: realAggregates.avgFinalRevenue,
              avgNetProfit: realAggregates.avgNetProfit,
              totalRevenue: Number((realAggregates.avgFinalRevenue * totalBundles).toFixed(2)),
              avgProfitMargin: realAggregates.avgTotalCost > 0 ? Number(((realAggregates.avgNetProfit / realAggregates.avgTotalCost) * 100).toFixed(2)) : 0,
              lastFetched: dataPlansResult.lastFetched || new Date().toISOString(),
              calculationMethod: realAggregates.calculationMethod
            };
          })
        );
        
        // Filter out countries with no bundles, sort alphabetically, and cache result
        const result = bundlesByCountry
          .filter(country => country.totalBundles > 0)
          .sort((a, b) => a.countryName.localeCompare(b.countryName));
        bundlesByCountryCache.set(result);
        
        logger.info('Completed bundlesByCountry aggregation using cached data', {
          totalCountries: result.length,
          operationType: 'bundles-by-country-fetch'
        });
        
        return result;
      } catch (error) {
        logger.error('Error in bundlesByCountry resolver', error as Error, {
          operationType: 'bundles-by-country-fetch'
        });
        throw new GraphQLError('Failed to fetch bundles by country', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    },
    
    countryBundles: async (_, { countryId }, context: Context) => {
      logger.info('Fetching bundles for specific country', {
        countryId,
        operationType: 'country-bundles-fetch'
      });
      
      try {
        const { PricingService } = await import('./services/pricing.service');
        const { PricingConfigRepository } = await import('./repositories/pricing-configs/pricing-config.repository');
        const configRepository = new PricingConfigRepository();
        
        // Get country info
        const countries = await context.dataSources.countries.getCountries();
        const country = countries.find(c => c.iso === countryId);
        
        if (!country) {
          throw new GraphQLError(`Country not found: ${countryId}`, {
            extensions: { code: 'COUNTRY_NOT_FOUND' }
          });
        }
        
        // Use cached catalogue data to get bundles for this country
        const dataPlansResult = await context.dataSources.catalogue.searchPlans({
          country: countryId
        });
        const dataPlans = dataPlansResult.bundles || [];
        
        // Get unique durations and sort them
        const durations = [...new Set(dataPlans.map(plan => plan.duration))].sort((a, b) => a - b);
        
        // Get custom configurations to determine hasCustomDiscount
        const allConfigurations = await configRepository.getAllConfigurations();
        const hasCustomConfig = allConfigurations.some(config => 
          config.isActive && config.countryId === countryId
        );

        // Calculate pricing for each duration using actual pricing service
        // This is acceptable for single country since it's only a few API calls
        const bundles = await Promise.all(
          durations.map(async (duration) => {
            try {
              const config = await PricingService.getPricingConfig(
                countryId,
                duration,
                context.dataSources.catalogue,
                configRepository,
                'israeli_card'
              );
              
              const bundleName = PricingService.getBundleName(duration);
              
              const pricingBreakdown = PricingService.calculatePricing(
                bundleName,
                country.country,
                duration,
                config
              );
              
              return {
                bundleName: pricingBreakdown.bundleName,
                countryName: pricingBreakdown.countryName,
                countryId,
                duration: pricingBreakdown.duration,
                cost: pricingBreakdown.cost,
                costPlus: pricingBreakdown.costPlus,
                totalCost: pricingBreakdown.totalCost,
                discountRate: pricingBreakdown.discountRate,
                discountValue: pricingBreakdown.discountValue,
                priceAfterDiscount: pricingBreakdown.priceAfterDiscount,
                processingRate: pricingBreakdown.processingRate,
                processingCost: pricingBreakdown.processingCost,
                finalRevenue: pricingBreakdown.finalRevenue,
                netProfit: pricingBreakdown.netProfit ?? (pricingBreakdown.finalRevenue - pricingBreakdown.totalCost),
                currency: pricingBreakdown.currency,
                pricePerDay: (() => {
                  console.log('DEBUG pricePerDay calculation:', {
                    duration: pricingBreakdown.duration,
                    priceAfterDiscount: pricingBreakdown.priceAfterDiscount,
                    isFinitePriceAfterDiscount: isFinite(pricingBreakdown.priceAfterDiscount),
                    bundleName: pricingBreakdown.bundleName,
                    countryName: pricingBreakdown.countryName
                  });
                  return (pricingBreakdown.duration && pricingBreakdown.duration > 0 && isFinite(pricingBreakdown.priceAfterDiscount)) 
                    ? pricingBreakdown.priceAfterDiscount / pricingBreakdown.duration 
                    : 0;
                })(),
                hasCustomDiscount: hasCustomConfig
              };
            } catch (error) {
              logger.warn('Failed to calculate pricing for bundle', {
                countryId,
                duration,
                error: (error as Error).message,
                operationType: 'country-bundles-fetch'
              });
              return null;
            }
          })
        );
        
        // Filter out failed calculations (already sorted by duration)
        const result = bundles.filter(bundle => bundle !== null);
        
        logger.info('Completed countryBundles fetch using cached data', {
          countryId,
          bundleCount: result.length,
          operationType: 'country-bundles-fetch'
        });
        
        return result;
      } catch (error) {
        logger.error('Error in countryBundles resolver', error as Error, {
          countryId,
          operationType: 'country-bundles-fetch'
        });
        throw new GraphQLError('Failed to fetch country bundles', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
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
        logger.error("Error fetching order count", error as Error, {
          userId: parent.id,
          operationType: 'order-count-fetch'
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
          logger.error("Error creating assignment", assignmentError as Error, {
            userId,
            planId,
            operationType: 'package-assignment'
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
        logger.error("Error in assignPackageToUser", error as Error, {
          userId,
          planId,
          operationType: 'package-assignment'
        });
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
