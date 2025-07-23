import {
  signInWithApple,
  signInWithGoogle,
  sendPhoneOTP,
  supabaseAdmin,
  verifyPhoneOTP,
} from "./context/supabase-auth";
import type { Context } from "./context/types";
import type { CalculatePriceInput, DataPlan, Order, Resolvers } from "./types";
import { ConfigurationLevel } from "./types";
import { esimResolvers } from "./resolvers/esim-resolvers";
import { checkoutResolvers } from "./resolvers/checkout-resolvers";
import { usersResolvers } from "./resolvers/users-resolvers";
import { tripsResolvers } from "./resolvers/trips-resolvers";
import { pricingRulesResolvers } from "./resolvers/pricing-rules-resolvers";
import { GraphQLError } from "graphql";
import { PaymentMethod } from "./types";
import { createLogger } from "./lib/logger";
import { PricingEngineService } from "./services/pricing-engine.service";

const logger = createLogger({ component: 'resolvers' });

// Singleton instance of pricing engine service
let pricingEngineService: PricingEngineService | null = null;

const getPricingEngineService = (context: Context): PricingEngineService => {
  if (!pricingEngineService) {
    pricingEngineService = new PricingEngineService(context.supabase);
    // Initialize in background
    pricingEngineService.initialize().catch(error => {
      logger.error('Failed to initialize pricing engine', error as Error, {
        operationType: 'pricing-engine-init'
      });
    });
  }
  return pricingEngineService;
};


// Helper function to determine configuration level based on pricing config fields
function getConfigurationLevel(config: any): ConfigurationLevel {
  if (config.countryId && config.duration) {
    return ConfigurationLevel.Bundle;
  } else if (config.countryId) {
    return ConfigurationLevel.Country;
  } else if (config.regionId) {
    return ConfigurationLevel.Region;
  } else {
    return ConfigurationLevel.Global;
  }
}

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
  
  // Add safety check for division by zero
  
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
    
    
    // Pricing rules resolvers are merged from pricing-rules-resolvers.ts
    ...pricingRulesResolvers.Query!,
    
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
      try {
        // Use the pricing engine service instead of old pricing service
        const engineService = getPricingEngineService(context);
        
        // Get bundle information from catalog
        const bundles = await context.dataSources.catalogue.searchPlans({
          country: countryId,
          duration: numOfDays
        });
        
        if (!bundles.bundles || bundles.bundles.length === 0) {
          throw new GraphQLError('No bundles found for the specified criteria', {
            extensions: { code: 'NO_BUNDLES_FOUND' }
          });
        }
        
        // Use the first matching bundle
        const bundle = bundles.bundles[0];
        
        // Create pricing context for the rule engine
        const pricingContext = {
          bundle: {
            id: bundle.name || `${countryId}-${numOfDays}d`,
            name: bundle.name,
            duration: numOfDays,
            bundleGroup: bundle.bundleGroup || 'Standard Fixed',
            basePrice: bundle.price || 0,
            dataAmount: bundle.dataAmount || 0,
            isUnlimited: bundle.unlimited || bundle.dataAmount === -1
          },
          customer: {
            paymentMethod: mapPaymentMethodEnum(paymentMethod),
            segmentTier: 'STANDARD' as const
          },
          location: {
            country: countryId,
            region: regionId || bundle.baseCountry?.region || 'Unknown'
          },
          metadata: {}
        };
        
        // Calculate price using rule engine
        const calculation = await engineService.calculatePrice(pricingContext);
        
        // Get country name for response
        const countries = await context.dataSources.countries.getCountries();
        const country = countries.find(c => c.iso === countryId);
        const countryName = country?.country || countryId;
        
        // Map rule engine result to GraphQL schema
        return {
          bundleName: bundle.name || `${numOfDays} Day Bundle`,
          countryName,
          duration: numOfDays,
          currency: 'USD',
          // Public fields
          totalCost: calculation.subtotal,
          discountValue: calculation.totalDiscount,
          priceAfterDiscount: calculation.priceAfterDiscount,
          // Admin-only fields (protected by @auth directives)
          cost: calculation.baseCost,
          costPlus: calculation.baseCost + calculation.markup,
          discountRate: calculation.discounts.reduce((sum, d) => {
            return sum + (d.type === 'percentage' ? d.amount : 0);
          }, 0),
          processingRate: calculation.processingRate,
          processingCost: calculation.processingFee,
          finalRevenue: calculation.finalRevenue,
          netProfit: calculation.profit,
          discountPerDay: calculation.metadata?.discountPerUnusedDay || 0.10
        };
      } catch (error) {
        logger.error('Error calculating price with rule engine', error as Error, {
          countryId,
          duration: numOfDays,
          operationType: 'pricing-calculation'
        });
        throw error;
      }
    },
    calculatePrices: async (_, { inputs }, context: Context) => {
      const engineService = getPricingEngineService(context);
      
      // Get countries map for name lookup
      const countries = await context.dataSources.countries.getCountries();
      const countryMap = new Map(countries.map(c => [c.iso, c.country]));
      
      const results = await Promise.all(
        inputs.map(async (input: CalculatePriceInput) => {
          try {
            // Get bundle information from catalog
            const bundles = await context.dataSources.catalogue.searchPlans({
              country: input.countryId,
              duration: input.numOfDays
            });
            
            if (!bundles.bundles || bundles.bundles.length === 0) {
              throw new GraphQLError('No bundles found for the specified criteria', {
                extensions: { code: 'NO_BUNDLES_FOUND' }
              });
            }
            
            // Use the first matching bundle
            const bundle = bundles.bundles[0];
            
            // Create pricing context for the rule engine
            const pricingContext = {
              bundle: {
                id: bundle.name || `${input.countryId}-${input.numOfDays}d`,
                name: bundle.name,
                duration: input.numOfDays,
                bundleGroup: bundle.bundleGroup || 'Standard Fixed',
                basePrice: bundle.price || 0,
                dataAmount: bundle.dataAmount || 0,
                isUnlimited: bundle.unlimited || bundle.dataAmount === -1
              },
              customer: {
                paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
                segmentTier: 'STANDARD' as const
              },
              location: {
                country: input.countryId,
                region: bundle.baseCountry?.region || 'Unknown'
              },
              metadata: {}
            };
            
            // Calculate price using rule engine
            const calculation = await engineService.calculatePrice(pricingContext);
            
            // Map rule engine result to existing GraphQL schema
            return {
              bundleName: bundle.name || `${input.numOfDays} Day Bundle`,
              countryName: countryMap.get(input.countryId) || input.countryId,
              duration: input.numOfDays,
              cost: calculation.baseCost,
              costPlus: calculation.baseCost + calculation.markup,
              totalCost: calculation.subtotal,
              discountRate: calculation.totalDiscount > 0 ? (calculation.totalDiscount / calculation.subtotal) : 0,
              discountValue: calculation.totalDiscount,
              priceAfterDiscount: calculation.priceAfterDiscount,
              processingRate: calculation.processingRate,
              processingCost: calculation.processingFee,
              finalRevenue: calculation.finalRevenue,
              netProfit: calculation.profit,
              currency: 'USD',
              discountPerDay: calculation.metadata?.discountPerUnusedDay || 0.10
            };
          } catch (error) {
            logger.error(`Error calculating pricing for ${input.countryId} ${input.numOfDays}d`, error as Error, {
              countryId: input.countryId,
              duration: input.numOfDays,
              operationType: 'pricing-calculation'
            });
            // Return a fallback pricing breakdown
            return {
              bundleName: `${input.numOfDays} Day Bundle`,
              countryName: countryMap.get(input.countryId) || input.countryId,
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
              currency: 'USD',
              discountPerDay: 0.10
            };
          }
        })
      );

      // 🎯 Simple deduplication fix - remove nearly identical results
      const uniqueResults = results.filter((result, index, array) => {
        return array.findIndex(r => 
          r.countryName === result.countryName &&
          r.duration === result.duration &&
          Math.abs(r.totalCost - result.totalCost) < 0.01 && // Same total cost (within 1 cent)
          Math.abs(r.finalRevenue - result.finalRevenue) < 0.01 // Same final revenue
        ) === index;
      });



      return uniqueResults;
    },
    
    bundlesByCountry: async (_, __, context: Context) => {
      
      try {
        // Use efficient aggregation from repository instead of loading all bundles
        const countryAggregation = await context.dataSources.catalogue.getBundlesByCountryAggregation();
        
        // Get country names mapping
        const countries = await context.dataSources.countries.getCountries();
        const countryNamesMap = new Map(
          countries.map(country => [country.iso, country.country])
        );
        
        logger.debug('Country mapping debug', {
          aggregationCount: countryAggregation.length,
          countryMapSize: countryNamesMap.size,
          aggregatedCountries: countryAggregation.map(c => c.countryId),
          availableCountryCodes: Array.from(countryNamesMap.keys()).slice(0, 10), // First 10
          operationType: 'country-mapping-debug'
        });
        
        // Map aggregation results to expected format with proper country names
        const bundlesByCountry = countryAggregation
          .map(({ countryId, bundleCount }) => {
            const countryName = countryNamesMap.get(countryId) || countryId;
            logger.debug('Country mapping', {
              countryId,
              countryName,
              bundleCount,
              hasMapping: countryNamesMap.has(countryId)
            });
            return {
              countryName,
              countryId: countryId,
              bundleCount: bundleCount
            };
          })
          .filter(item => {
            // For now, include all countries - even if we don't have proper names
            // This will help us see all available countries in the debug phase
            const shouldInclude = true; // item.countryName !== item.countryId;
            if (item.countryName === item.countryId) {
              logger.debug('Country without name mapping included anyway', {
                countryId: item.countryId,
                usingCountryCodeAsName: true
              });
            }
            return shouldInclude;
          }) // Include all countries for now
          .sort((a, b) => a.countryName.localeCompare(b.countryName));
        
        logger.info('✅ BundlesByCountry aggregated efficiently', {
          countryCount: bundlesByCountry.length,
          totalAggregated: countryAggregation.length,
          operationType: 'bundles-by-country-aggregation'
        });
        
        return bundlesByCountry;
      } catch (error) {
        logger.error('Error in bundlesByCountry resolver', error as Error, {
          operationType: 'bundles-by-country-fetch'
        });

        // Check if it's a catalog empty error
        if (error instanceof Error && error.message.includes('Catalog data is not available')) {
          throw new GraphQLError("Catalog data is not available. Please run catalog sync to populate the database with eSIM bundles.", {
            extensions: {
              code: "CATALOG_EMPTY",
              hint: "Run the catalog sync process to populate the database",
            },
          });
        }

        throw new GraphQLError('Failed to fetch bundles by country', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    },
    
    countryBundles: async (_, { countryId }, context: Context) => {
      
      try {
        const engineService = getPricingEngineService(context);
        
        // Get country info
        const countries = await context.dataSources.countries.getCountries();
        const country = countries.find(c => c.iso === countryId);
        
        if (!country) {
          throw new GraphQLError(`Country not found: ${countryId}`, {
            extensions: { code: 'COUNTRY_NOT_FOUND' }
          });
        }
        
        // Use the catalogue datasource to get bundles for the country
        const catalogBundles = await context.dataSources.catalogue.getBundlesByCountry(countryId);
        
        logger.info('Fetched bundles for country from catalog', {
          countryId,
          bundleCount: catalogBundles.length,
          operationType: 'catalog-bundles-fetch'
        });
        
        // Convert catalog bundles to data plan format
        const dataPlans = (catalogBundles || []).map(bundle => ({
          id: bundle.id,
          name: bundle.esim_go_name,
          description: bundle.description || '',
          baseCountry: country,
          countries: bundle.countries || [],
          regions: bundle.regions || [],
          duration: bundle.duration,
          price: bundle.price_cents / 100, // Convert cents to dollars
          currency: bundle.currency,
          unlimited: bundle.unlimited,
          dataAmount: bundle.data_amount,
          bundleGroup: bundle.bundle_group,
          features: []
        }));
        
        logger.info('Fetched bundles from catalog for country', {
          countryId,
          bundleCount: dataPlans.length,
          operationType: 'country-bundles-fetch'
        });
        
        // DEBUG: Log the raw data from the API
        logger.info('RAW DATA FROM CATALOGUE API', {
          countryId,
          totalPlans: dataPlans.length,
          unlimitedCount: dataPlans.filter(p => p.unlimited || p.dataAmount === -1).length,
          limitedCount: dataPlans.filter(p => !p.unlimited && p.dataAmount !== -1).length,
          unlimitedByFlag: dataPlans.filter(p => p.unlimited).length,
          unlimitedByDataAmount: dataPlans.filter(p => p.dataAmount === -1).length,
          samplePlans: dataPlans.slice(0, 5).map(p => ({
            name: p.name,
            duration: p.duration,
            unlimited: p.unlimited,
            dataAmount: p.dataAmount,
            bundleGroup: p.bundleGroup
          })),
          operationType: 'country-bundles-debug'
        });
        
        // Sort plans by duration for consistent ordering
        const sortedPlans = dataPlans.sort((a, b) => a.duration - b.duration);
        
        // Check if there are custom rules for this country
        const { PricingRulesRepository } = await import('./repositories/pricing-rules/pricing-rules.repository');
        const rulesRepository = new PricingRulesRepository(context.supabase);
        const allRules = await rulesRepository.findAll({ isActive: true });
        
        // Check if any rule applies to this country specifically
        const hasCustomConfig = allRules.some(rule => {
          return rule.conditions.some((condition: any) => 
            (condition.field === 'location.country' && condition.value === countryId) ||
            (condition.field === 'country' && condition.value === countryId)
          );
        });
        
        // Map rules to configuration levels for display purposes
        const configLevelByBundle = new Map<number, ConfigurationLevel>();
        sortedPlans.forEach(plan => {
          // Check if there's a specific rule for this bundle
          const hasBundleRule = allRules.some(rule => {
            return rule.conditions.some((condition: any) => 
              (condition.field === 'bundle.duration' && condition.value === plan.duration) ||
              (condition.field === 'duration' && condition.value === plan.duration)
            );
          });
          
          if (hasBundleRule) {
            configLevelByBundle.set(plan.duration, ConfigurationLevel.Bundle);
          } else if (hasCustomConfig) {
            configLevelByBundle.set(plan.duration, ConfigurationLevel.Country);
          } else {
            configLevelByBundle.set(plan.duration, ConfigurationLevel.Global);
          }
        });

        // Calculate pricing for each individual plan using actual pricing service
        // This ensures unlimited and limited bundles with same duration are processed separately
        const bundles = await Promise.all(
          sortedPlans.map(async (plan) => {
            try {
              // DEBUG: Log the plan structure to see what country data we have
              logger.info('Bundle plan structure debug', {
                countryId,
                planName: plan.name,
                planDuration: plan.duration,
                hasBaseCountry: !!plan.baseCountry,
                baseCountry: plan.baseCountry,
                hasCountries: !!plan.countries,
                countriesCount: plan.countries?.length || 0,
                operationType: 'bundle-country-debug'
              });
              
              // Create pricing context for the rule engine
              const pricingContext = {
                bundle: {
                  id: plan.name || `${countryId}-${plan.duration}d`,
                  name: plan.name,
                  duration: plan.duration,
                  bundleGroup: plan.bundleGroup || 'Standard Fixed',
                  basePrice: plan.price || 0,
                  dataAmount: plan.dataAmount || 0,
                  isUnlimited: plan.unlimited || plan.dataAmount === -1
                },
                customer: {
                  paymentMethod: 'israeli_card' as const,
                  segmentTier: 'STANDARD' as const
                },
                location: {
                  country: countryId,
                  region: plan.baseCountry?.region || country.region || 'Unknown'
                },
                metadata: {}
              };
              
              // Calculate price using rule engine
              const calculation = await engineService.calculatePrice(pricingContext);
              
              return {
                bundleName: plan.name || `${plan.duration} Day Bundle`,
                countryName: country.country,
                countryId,
                duration: plan.duration,
                cost: calculation.baseCost || 0,
                costPlus: (calculation.baseCost || 0) + (calculation.markup || 0),
                totalCost: calculation.subtotal || 0,
                discountRate: (calculation.totalDiscount || 0) > 0 && (calculation.subtotal || 0) > 0 
                  ? (calculation.totalDiscount / calculation.subtotal) 
                  : 0,
                discountValue: calculation.totalDiscount || 0,
                priceAfterDiscount: calculation.priceAfterDiscount || 0,
                processingRate: calculation.processingRate || 0.045,
                processingCost: calculation.processingFee || 0,
                finalRevenue: calculation.finalRevenue || 0,
                netProfit: calculation.profit || 0,
                currency: 'USD',
                pricePerDay: (plan.duration && plan.duration > 0 && calculation.priceAfterDiscount && isFinite(calculation.priceAfterDiscount)) 
                  ? (calculation.priceAfterDiscount || 0) / plan.duration 
                  : 0,
                hasCustomDiscount: hasCustomConfig,
                configurationLevel: configLevelByBundle.get(plan.duration) || ConfigurationLevel.Global,
                discountPerDay: calculation.metadata?.discountPerUnusedDay || 0.10,
                // Add plan-specific metadata to distinguish between unlimited/limited bundles
                planId: plan.name || plan.id || `${countryId}-${plan.duration}d`,
                isUnlimited: plan.unlimited || plan.dataAmount === -1,
                dataAmount: (() => {
                  // Use same formatting logic as DataPlan field resolver
                  const rawDataAmount = plan.dataAmount;
                  
                  // Handle unlimited plans (dataAmount === -1 is the key indicator)
                  if (plan.unlimited || rawDataAmount === -1) {
                    return 'Unlimited';
                  }
                  
                  // Handle unknown or zero amounts
                  if (!rawDataAmount || rawDataAmount === 0) {
                    return 'Unknown';
                  }
                  
                  // Convert MB to GB and round to nearest 0.5 step (rounded up)
                  const dataAmountMB = typeof rawDataAmount === 'number' ? rawDataAmount : parseInt(rawDataAmount);
                  
                  if (dataAmountMB >= 1024) {
                    // Convert to GB
                    const exactGB = dataAmountMB / 1024;
                    
                    // Round up to nearest 0.5 step
                    const roundedGB = Math.ceil(exactGB * 2) / 2;
                    
                    // Format as whole number if it's a clean integer, otherwise show .5
                    if (roundedGB === Math.floor(roundedGB)) {
                      return `${Math.floor(roundedGB)}GB`;
                    } else {
                      return `${roundedGB}GB`;
                    }
                  } else {
                    // For MB values, round to nearest 50MB step (rounded up)
                    const roundedMB = Math.ceil(dataAmountMB / 50) * 50;
                    return `${roundedMB}MB`;
                  }
                })(),
                bundleGroup: plan.bundleGroup
              };
            } catch (error) {
              logger.warn('Failed to calculate pricing for bundle', {
                countryId,
                duration: plan.duration,
                planId: plan.name || plan.id,
                isUnlimited: plan.unlimited || false,
                error: (error as Error).message,
                operationType: 'country-bundles-fetch'
              });
              
              // Return bundle with default values instead of null
              return {
                bundleName: plan.name || `${plan.duration} Day Bundle`,
                countryName: country.name || country.country || countryId,
                countryId,
                duration: plan.duration || 0,
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
                currency: 'USD',
                pricePerDay: 0,
                hasCustomDiscount: false,
                configurationLevel: 'GLOBAL',
                discountPerDay: 0.10,
                planId: plan.name || plan.id || `${countryId}-${plan.duration}d`,
                isUnlimited: plan.unlimited || plan.dataAmount === -1 || false,
                dataAmount: plan.unlimited || plan.dataAmount === -1 ? 'Unlimited' : 
                  plan.dataAmount > 0 ? `${Math.round(plan.dataAmount / 1024)}GB` : 'Unknown',
                bundleGroup: plan.bundleGroup || 'Standard Fixed'
              };
            }
          })
        );
        
        // No need to filter anymore since we return default values instead of null
        return bundles;
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
    


    ...checkoutResolvers.Query!,
    
    // Bundle groups - fetched dynamically from eSIM Go organization groups API
    bundleGroups: async (_, __, context: Context) => {
      // This will be protected by @auth(role: "ADMIN") directive
      try {
        logger.info('Fetching bundle groups from eSIM Go API', {
          operationType: 'bundle-groups-fetch'
        });
        // Fetch organization groups from eSIM Go API
        const organizationGroups = await context.dataSources.catalogue.getOrganizationGroups();
        const bundleGroups = organizationGroups
          .map(group => group.name)
          .filter(name => name != null && name.trim() !== '');
        logger.info('Successfully fetched bundle groups', {
          count: bundleGroups.length,
          groups: bundleGroups,
          operationType: 'bundle-groups-fetch'
        });
        return bundleGroups;
      } catch (error) {
        logger.error('Error fetching bundle groups, using fallback', error as Error, {
          operationType: 'bundle-groups-fetch'
        });
        // Return fallback list if API fails
        const fallbackGroups = [
          "Standard Fixed",
          "Standard - Unlimited Lite", 
          "Standard - Unlimited Essential",
          "Standard - Unlimited Plus",
          "Regional Bundles"
        ];
        logger.info('Using fallback bundle groups', {
          count: fallbackGroups.length,
          groups: fallbackGroups,
          operationType: 'bundle-groups-fetch'
        });
        return fallbackGroups;
      }
    },

    // Pricing filters - returns all available filter options dynamically
    pricingFilters: async (_, __, context: Context) => {
      try {
        // Get dynamic bundle groups with fallback handling
        const bundleGroups = await resolvers.Query!.bundleGroups!(_, __, context) || [];
        
        // Get bundle data aggregation for dynamic durations and data types
        const bundleAggregation = await resolvers.Query!.bundleDataAggregation!(_, __, context);
        
        let durations: { label: string; value: string }[] = [];
        let dataTypes: { label: string; value: string }[] = [];
        
        if (bundleAggregation && bundleAggregation.total > 0 && bundleAggregation.byDuration?.length > 0) {
          // Extract unique durations from aggregation data
          durations = bundleAggregation.byDuration.map((durationGroup: any) => ({
            label: `${durationGroup.duration} days`,
            value: durationGroup.duration.toString(),
            minDays: durationGroup.duration,
            maxDays: durationGroup.duration
          }));
          
          // Dynamic data types based on actual bundle data
          dataTypes = [];
          if (bundleAggregation.unlimited > 0) {
            dataTypes.push({ label: 'Unlimited', value: 'unlimited', isUnlimited: true });
          }
          if (bundleAggregation.total - bundleAggregation.unlimited > 0) {
            dataTypes.push({ label: 'Limited', value: 'limited', isUnlimited: false });
          }
        } else {
          // Fallback to static values if aggregation data is not available
          durations = [
            { label: '1-7 days', value: 'short', minDays: 1, maxDays: 7 },
            { label: '8-30 days', value: 'medium', minDays: 8, maxDays: 30 },
            { label: '31+ days', value: 'long', minDays: 31, maxDays: 999 }
          ];
          dataTypes = [
            { label: 'Unlimited', value: 'unlimited', isUnlimited: true },
            { label: 'Limited', value: 'limited', isUnlimited: false }
          ];
        }
        
        return {
          bundleGroups,
          durations,
          dataTypes
        };
      } catch (error) {
        logger.error('Error fetching pricing filters', error as Error, {
          operationType: 'pricing-filters-fetch'
        });
        throw new GraphQLError('Failed to fetch pricing filters', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    },

    // Bundle data amount aggregation - returns cached aggregated data
    bundleDataAggregation: async (_, __, context: Context) => {
      // This will be protected by @auth(role: "ADMIN") directive
      try {
        const cacheKey = 'bundle-data-aggregation';
        const cachedData = await context.cache?.get(cacheKey);
        
        if (cachedData) {
          return JSON.parse(cachedData);
        }
        
        // If no cached data exists, return empty aggregation with a note to sync
        logger.warn('Bundle data aggregation not found in cache - catalog sync may be needed', {
          operationType: 'bundle-data-aggregation-fetch'
        });
        
        return {
          total: 0,
          unlimited: 0,
          byDataAmount: [],
          byBundleGroup: [],
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        logger.error('Error fetching bundle data aggregation', error as Error, {
          operationType: 'bundle-data-aggregation-fetch'
        });
        throw new GraphQLError('Failed to fetch bundle data aggregation', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    },

    // High demand countries
    highDemandCountries: async (_, __, context: Context) => {
      // This will be protected by @auth(role: "ADMIN") directive
      try {
        const highDemandCountries = await context.repositories.highDemandCountries.getAllHighDemandCountries();
        return highDemandCountries;
      } catch (error) {
        logger.error('Error fetching high demand countries', error as Error, {
          operationType: 'high-demand-countries-fetch'
        });
        throw new GraphQLError('Failed to fetch high demand countries', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    },

    // DEBUG: Direct API call to bypass cache and see raw data
    debugRawCatalogData: async (_, { countryId }, context: Context) => {
      try {
        logger.info('Debug: Making direct API call to eSIM Go', { countryId });
        
        // Force a direct API call by using the fallback mechanism
        const dataPlansResult = await (context.dataSources.catalogue as any).fallbackToApiCall({
          country: countryId
        });
        const dataPlans = dataPlansResult.bundles || [];
        
        logger.info('DEBUG: Raw API Response Analysis', {
          countryId,
          totalPlans: dataPlans.length,
          unlimitedByFlag: dataPlans.filter(p => p.unlimited === true).length,
          unlimitedByDataAmount: dataPlans.filter(p => p.dataAmount === -1).length,
          bothUnlimitedFields: dataPlans.filter(p => p.unlimited === true && p.dataAmount === -1).length,
          uniqueDurations: [...new Set(dataPlans.map(p => p.duration))].sort((a,b) => a-b),
          sampleUnlimited: dataPlans.filter(p => p.unlimited === true || p.dataAmount === -1).slice(0, 3).map(p => ({
            name: p.name,
            unlimited: p.unlimited,
            dataAmount: p.dataAmount,
            duration: p.duration,
            bundleGroup: p.bundleGroup
          })),
          sampleLimited: dataPlans.filter(p => !p.unlimited && p.dataAmount !== -1).slice(0, 3).map(p => ({
            name: p.name,
            unlimited: p.unlimited,
            dataAmount: p.dataAmount,
            duration: p.duration,
            bundleGroup: p.bundleGroup
          })),
          operationType: 'debug-raw-catalog'
        });

        return {
          success: true,
          totalPlans: dataPlans.length,
          unlimitedCount: dataPlans.filter(p => p.unlimited === true || p.dataAmount === -1).length,
          samplePlans: dataPlans.slice(0, 5).map(p => ({
            name: p.name,
            unlimited: p.unlimited,
            dataAmount: p.dataAmount,
            duration: p.duration,
            bundleGroup: p.bundleGroup
          }))
        };
      } catch (error) {
        logger.error('Debug raw catalog failed', error as Error);
        return {
          success: false,
          error: (error as Error).message,
          totalPlans: 0,
          unlimitedCount: 0,
          samplePlans: []
        };
      }
    },

    // Catalog sync history resolver
    catalogSyncHistory: async (_, { params = {} }, context: Context) => {
      try {
        const { limit = 50, offset = 0, status, type, fromDate, toDate } = params;
        
        logger.info('Fetching catalog sync history', {
          limit,
          offset,
          status,
          type,
          operationType: 'catalog-sync-history'
        });

        // Build query
        let query = supabaseAdmin
          .from('catalog_sync_jobs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        // Apply filters
        if (status) {
          query = query.eq('status', status);
        }
        if (type) {
          query = query.eq('job_type', type); // Use correct column name job_type
        }
        if (fromDate) {
          query = query.gte('created_at', fromDate);
        }
        if (toDate) {
          query = query.lte('created_at', toDate);
        }

        const { data, error, count } = await query;

        if (error) {
          logger.error('Failed to fetch catalog sync history', error, {
            operationType: 'catalog-sync-history'
          });
          throw new GraphQLError('Failed to fetch sync history', {
            extensions: { code: 'INTERNAL_ERROR' },
          });
        }

        // Transform data to match frontend expectations
        const jobs = (data || []).map(job => ({
          id: job.id,
          jobType: job.job_type || 'FULL_SYNC', // Use correct column name job_type
          type: job.job_type || 'FULL_SYNC',     // Use correct column name job_type
          status: (job.status || 'pending').toLowerCase(), // Frontend expects lowercase status
          priority: job.priority || 'normal',    // Use actual priority from DB
          bundleGroup: job.bundle_group,
          countryId: job.country_id,
          bundlesProcessed: job.bundles_processed || 0, // Use correct column name
          bundlesAdded: job.bundles_added || 0,         // Use correct column name
          bundlesUpdated: job.bundles_updated || 0,     // Use correct column name
          startedAt: job.started_at || job.created_at, // Use created_at as fallback if started_at is null
          completedAt: job.completed_at,
          duration: job.duration,
          errorMessage: job.error_message,
          metadata: job.metadata,
          createdAt: job.created_at,
          updatedAt: job.updated_at
        }));

        logger.info('Catalog sync history fetched successfully', {
          jobCount: jobs.length,
          totalCount: count,
          operationType: 'catalog-sync-history'
        });

        return {
          jobs,
          totalCount: count || 0
        };
      } catch (error) {
        logger.error('Failed to fetch catalog sync history', error as Error, {
          operationType: 'catalog-sync-history'
        });
        throw error;
      }
    },

    // Catalog bundles queries (from new catalog system)
    catalogBundles: async (_, { criteria = {} }, context: Context) => {
      try {
        const { limit = 50, offset = 0, bundleGroups, countries, regions, minDuration, maxDuration, unlimited, search } = criteria;
        
        logger.info('Fetching catalog bundles', {
          limit,
          offset,
          bundleGroups,
          countries,
          operationType: 'catalog-bundles-fetch'
        });

        // Build query
        let query = supabaseAdmin
          .from('catalog_bundles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        // Apply filters
        if (bundleGroups?.length) {
          query = query.in('bundle_group', bundleGroups);
        }
        if (countries?.length) {
          query = query.overlaps('countries', countries);
        }
        if (regions?.length) {
          query = query.overlaps('regions', regions);
        }
        if (minDuration) {
          query = query.gte('duration', minDuration);
        }
        if (maxDuration) {
          query = query.lte('duration', maxDuration);
        }
        if (unlimited !== undefined) {
          query = query.eq('unlimited', unlimited);
        }
        if (search) {
          query = query.or(`esim_go_name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
          logger.error('Failed to fetch catalog bundles', error, {
            operationType: 'catalog-bundles-fetch'
          });
          throw new GraphQLError('Failed to fetch catalog bundles', {
            extensions: { code: 'INTERNAL_ERROR' },
          });
        }

        // Transform data
        const bundles = (data || []).map(bundle => ({
          id: bundle.id,
          esimGoName: bundle.esim_go_name,
          bundleGroup: bundle.bundle_group,
          description: bundle.description || '',
          duration: bundle.duration,
          dataAmount: bundle.data_amount,
          unlimited: bundle.unlimited,
          priceCents: bundle.price_cents,
          currency: bundle.currency,
          countries: bundle.countries || [],
          regions: bundle.regions || [],
          syncedAt: bundle.synced_at,
          createdAt: bundle.created_at,
          updatedAt: bundle.updated_at
        }));

        return {
          bundles,
          totalCount: count || 0
        };
      } catch (error) {
        logger.error('Failed to fetch catalog bundles', error as Error, {
          operationType: 'catalog-bundles-fetch'
        });
        throw error;
      }
    },

    catalogBundlesByCountry: async (_, __, context: Context) => {
      try {
        logger.info('Fetching catalog bundles by country', {
          operationType: 'catalog-bundles-by-country'
        });

        // Get bundles grouped by country
        const { data, error } = await supabaseAdmin
          .from('catalog_bundles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw new GraphQLError('Failed to fetch catalog bundles by country', {
            extensions: { code: 'INTERNAL_ERROR' },
          });
        }

        // Group by country
        const countryMap = new Map<string, any[]>();
        
        (data || []).forEach(bundle => {
          if (bundle.countries && Array.isArray(bundle.countries)) {
            bundle.countries.forEach(country => {
              if (!countryMap.has(country)) {
                countryMap.set(country, []);
              }
              countryMap.get(country)!.push({
                id: bundle.id,
                esimGoName: bundle.esim_go_name,
                bundleGroup: bundle.bundle_group,
                description: bundle.description || '',
                duration: bundle.duration,
                dataAmount: bundle.data_amount,
                unlimited: bundle.unlimited,
                priceCents: bundle.price_cents,
                currency: bundle.currency,
                countries: bundle.countries || [],
                regions: bundle.regions || [],
                syncedAt: bundle.synced_at,
                createdAt: bundle.created_at,
                updatedAt: bundle.updated_at
              });
            });
          }
        });

        const result = Array.from(countryMap.entries()).map(([country, bundles]) => ({
          country,
          bundleCount: bundles.length,
          bundles
        }));

        logger.info('Catalog bundles by country fetched successfully', {
          countryCount: result.length,
          operationType: 'catalog-bundles-by-country'
        });

        return result;
      } catch (error) {
        logger.error('Failed to fetch catalog bundles by country', error as Error, {
          operationType: 'catalog-bundles-by-country'
        });
        throw error;
      }
    },

    availableBundleGroups: async (_, __, context: Context) => {
      try {
        logger.info('Fetching available bundle groups', {
          operationType: 'available-bundle-groups'
        });

        const { data, error } = await supabaseAdmin
          .from('catalog_bundles')
          .select('bundle_group')
          .not('bundle_group', 'is', null);

        if (error) {
          throw new GraphQLError('Failed to fetch available bundle groups', {
            extensions: { code: 'INTERNAL_ERROR' },
          });
        }

        // Get unique bundle groups
        const bundleGroups = [...new Set((data || []).map(item => item.bundle_group))];

        logger.info('Available bundle groups fetched successfully', {
          groupCount: bundleGroups.length,
          operationType: 'available-bundle-groups'
        });

        return bundleGroups;
      } catch (error) {
        logger.error('Failed to fetch available bundle groups', error as Error, {
          operationType: 'available-bundle-groups'
        });
        throw error;
      }
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
    ...pricingRulesResolvers.Mutation!,
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
    
    // Trigger catalog sync via workers
    triggerCatalogSync: async (_, { params }, context: Context) => {
      const { type, bundleGroup, countryId, priority = 'normal', force = false } = params;
      
      try {
        
        logger.info('Triggering catalog sync via workers', {
          type,
          bundleGroup,
          countryId,
          priority,
          force,
          userId: context.auth?.user?.id || 'test-user',
          operationType: 'trigger-catalog-sync'
        });

        // Import the BullMQ queue to actually queue jobs
        const { Queue } = await import('bullmq');
        const { default: IORedis } = await import('ioredis');
        
        // Create Redis connection (same config as workers)
        const redis = new IORedis({
          host: 'localhost',
          port: 6379,
          password: 'mypassword',
          maxRetriesPerRequest: null,
        });
        
        // Create the same queue as workers use
        const catalogQueue = new Queue('catalog-sync', { connection: redis });
        
        // Generate proper UUID for the job ID
        const { randomUUID } = await import('crypto');
        const jobId = randomUUID();
        
        // Map GraphQL enum values to database constraint values
        const mapJobType = (graphqlType: string): string => {
          switch (graphqlType) {
            case 'FULL_SYNC': return 'full-sync';
            case 'GROUP_SYNC': return 'group-sync'; 
            case 'COUNTRY_SYNC': return 'country-sync';
            case 'METADATA_SYNC': return 'bundle-sync'; // Map to valid constraint value
            default: return 'full-sync';
          }
        };

        // Create a sync job record in the database
        const { data: syncJob, error } = await supabaseAdmin
          .from('catalog_sync_jobs')
          .insert({
            id: jobId,
            job_type: mapJobType(type),  // Map GraphQL enum to database constraint value
            status: 'pending',  // Use lowercase to match database constraint
            priority: priority, // Add priority field
            bundle_group: bundleGroup || null,
            country_id: countryId || null,
            // Don't set started_at for pending jobs - will be set when worker picks it up
            metadata: {
              force,
              triggeredBy: context.auth?.user?.id || 'test-user'
            }
          })
          .select()
          .single();

        if (error) {
          logger.error('Failed to create sync job record', error, {
            type,
            bundleGroup,
            countryId,
            operationType: 'trigger-catalog-sync'
          });
          throw new GraphQLError('Failed to trigger catalog sync', {
            extensions: { code: 'INTERNAL_ERROR' },
          });
        }

        // Now queue the actual BullMQ job for the workers to process
        const bullmqJob = await catalogQueue.add(
          `catalog-sync-${type}`,
          {
            type: mapJobType(type),  // Map GraphQL enum to worker-expected lowercase value
            bundleGroup: bundleGroup,
            countryId: countryId,
            priority: priority,
            metadata: {
              dbJobId: syncJob.id,
              force,
              triggeredBy: context.auth?.user?.id || 'test-user'
            }
          },
          {
            priority: priority === 'high' ? 1 : priority === 'normal' ? 5 : 10,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 50,
          }
        );

        // Update the database job with the BullMQ job ID
        await supabaseAdmin
          .from('catalog_sync_jobs')
          .update({
            metadata: {
              ...(syncJob.metadata || {}),
              bullmqJobId: bullmqJob.id
            }
          })
          .eq('id', syncJob.id);

        // Clean up Redis connection
        await redis.quit();

        logger.info('Catalog sync job queued successfully', {
          dbJobId: syncJob.id,
          bullmqJobId: bullmqJob.id,
          type,
          bundleGroup,
          countryId,
          operationType: 'trigger-catalog-sync'
        });

        return {
          success: true,
          jobId: syncJob.id,
          message: `Catalog sync job has been queued successfully (BullMQ: ${bullmqJob.id})`,
          error: null
        };

      } catch (error) {
        logger.error('Failed to trigger catalog sync', error as Error, {
          operationType: 'trigger-catalog-sync',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          type,
          bundleGroup,
          countryId,
          priority
        });
        
        return {
          success: false,
          jobId: null,
          message: null,
          error: `Failed to trigger catalog sync: ${(error as Error).message}`
        };
      }
    },
    
    // Diagnostic sync mutation - DISABLED (old CatalogSyncService removed)
    testCatalogSync: async (_, __, context: Context) => {
      throw new Error('testCatalogSync is disabled - old CatalogSyncService has been removed. Use syncCatalog instead.');
      try {
        // const { CatalogSyncService } = await import('./services/catalog-sync.service');
        
        // Create diagnostic version that bypasses distributed lock
        const testSyncBundleGroup = async (groupName: string) => {
          logger.info('Testing bundle group sync', { groupName });
          
          try {
            const response = await context.dataSources.catalogue.getWithErrorHandling('/v2.5/catalogue', {
              group: groupName,
              perPage: 50,
              page: 1
            });
            
            logger.info('Bundle group test result', {
              groupName,
              success: !!response?.bundles,
              bundleCount: response?.bundles?.length || 0,
              totalCount: response?.totalCount || 0,
              hasError: !response?.bundles
            });
            
            return {
              groupName,
              success: !!response?.bundles,
              bundleCount: response?.bundles?.length || 0,
              error: response?.bundles ? null : 'No bundles returned'
            };
          } catch (error) {
            logger.error('Bundle group test failed', error as Error, {
              groupName,
              errorMessage: error.message,
              errorCode: error.code,
              httpStatus: error.response?.status
            });
            
            return {
              groupName,
              success: false,
              bundleCount: 0,
              error: error.message
            };
          }
        };
        
        // Get dynamic bundle groups to prevent 401 errors
        const organizationGroups = await context.dataSources.catalogue.getOrganizationGroups();
        const bundleGroups = organizationGroups.map(group => group.name);
        
        logger.info('Testing dynamic bundle groups individually', {
          groupCount: bundleGroups.length,
          groups: bundleGroups
        });
        const results = [];
        
        for (const group of bundleGroups) {
          const result = await testSyncBundleGroup(group);
          results.push(result);
          
          // Small delay between tests
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const successCount = results.filter(r => r.success).length;
        const totalBundles = results.reduce((sum, r) => sum + r.bundleCount, 0);
        
        logger.info('Bundle group test summary', {
          successful: successCount,
          failed: results.length - successCount,
          totalBundles,
          results: results.map(r => ({ group: r.groupName, success: r.success, bundles: r.bundleCount, error: r.error }))
        });
        
        return {
          success: true,
          message: `Tested ${results.length} bundle groups: ${successCount} successful, ${results.length - successCount} failed. Total bundles: ${totalBundles}`,
          error: null,
          syncedBundles: totalBundles,
          syncDuration: 0,
          syncedAt: new Date().toISOString()
        };
      } catch (error) {
        logger.error('Manual sync test failed', error as Error);
        return {
          success: false,
          message: 'Sync test failed - check logs for details',
          error: error.message,
          syncedBundles: 0,
          syncDuration: 0,
          syncedAt: new Date().toISOString()
        };
      }
    },
    
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



    // High demand countries management
    toggleHighDemandCountry: async (_, { countryId }, context: Context) => {
      // This will be protected by @auth(role: "ADMIN") directive
      try {
        const result = await context.repositories.highDemandCountries.toggleHighDemandCountry(
          countryId,
          context.auth.user!.id
        );

        if (!result.success) {
          throw new GraphQLError(result.error || 'Failed to toggle high demand country', {
            extensions: { code: 'TOGGLE_FAILED' }
          });
        }

        logger.info('High demand country status toggled', {
          countryId,
          isHighDemand: result.isHighDemand,
          userId: context.auth.user!.id,
          operationType: 'high-demand-toggle'
        });

        return {
          success: result.success,
          countryId,
          isHighDemand: result.isHighDemand,
          error: null,
        };
      } catch (error) {
        logger.error('Error toggling high demand country', error as Error, {
          countryId,
          userId: context.auth.user!.id,
          operationType: 'high-demand-toggle'
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
        logger.info('Manual catalog sync triggered', {
          userId: context.auth.user!.id,
          force,
          operationType: 'catalog-sync-manual'
        });

        // Import CatalogSyncServiceV2 dynamically
        const { CatalogSyncServiceV2 } = await import('./services/catalog-sync-v2.service');
        
        // Create sync service instance with API key
        const catalogSyncService = new CatalogSyncServiceV2(
          process.env.ESIM_GO_API_KEY!,
          process.env.ESIM_GO_BASE_URL
        );
        
        // Trigger sync (returns jobId)
        const syncResult = await catalogSyncService.triggerFullSync(context.auth.user?.id);
        
        const duration = Date.now() - startTime;
        
        // Get bundle count from database instead of Redis
        let totalBundles = 0;
        try {
          const bundleRepository = new BundleRepository(supabaseAdmin);
          totalBundles = await bundleRepository.getTotalCount();
          logger.info('Successfully retrieved bundle count from database', {
            totalBundles,
            operationType: 'catalog-sync-manual'
          });
        } catch (metadataError) {
          logger.warn('Failed to get bundle count from database', metadataError as Error, {
            operationType: 'catalog-sync-manual'
          });
        }
        
        logger.info('Manual catalog sync completed', {
          userId: context.auth.user!.id,
          force,
          duration,
          syncedBundles: totalBundles,
          operationType: 'catalog-sync-manual'
        });

        return {
          success: true,
          message: `Catalog sync completed successfully${totalBundles > 0 ? `. Synced ${totalBundles} bundles` : ''}.`,
          error: null,
          syncedBundles: totalBundles,
          syncDuration: duration,
          syncedAt: new Date().toISOString(),
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Manual catalog sync failed', error as Error, {
          userId: context.auth.user!.id,
          force,
          duration,
          operationType: 'catalog-sync-manual'
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
  DataPlan: {
    dataAmount: (parent: any) => {
      // Get raw data amount (could be from _rawDataAmount or dataAmount field)
      const rawDataAmount = parent._rawDataAmount ?? parent.dataAmount;
      
      // Handle unlimited plans
      if (parent.isUnlimited || rawDataAmount === -1) {
        return 'Unlimited';
      }
      
      // Handle unknown or zero amounts
      if (!rawDataAmount || rawDataAmount === 0) {
        return 'Unknown';
      }
      
      // Convert MB to GB and round to nearest 0.5 step (rounded up)
      const dataAmountMB = typeof rawDataAmount === 'number' ? rawDataAmount : parseInt(rawDataAmount);
      
      if (dataAmountMB >= 1024) {
        // Convert to GB
        const exactGB = dataAmountMB / 1024;
        
        // Round up to nearest 0.5 step
        const roundedGB = Math.ceil(exactGB * 2) / 2;
        
        // Format as whole number if it's a clean integer, otherwise show .5
        if (roundedGB === Math.floor(roundedGB)) {
          return `${Math.floor(roundedGB)}GB`;
        } else {
          return `${roundedGB}GB`;
        }
      } else {
        // For MB values, round to nearest 50MB step (rounded up)
        const roundedMB = Math.ceil(dataAmountMB / 50) * 50;
        return `${roundedMB}MB`;
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
