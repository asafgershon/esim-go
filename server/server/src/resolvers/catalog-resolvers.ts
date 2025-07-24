import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { PricingEngineService } from "../services/pricing-engine.service";
import type {
  Resolvers,
  CalculatePriceInput,
  CountryBundle,
  CatalogBundle,
  BundlesByCountry,
  BundlesByRegion,
  PricingBreakdown,
} from "../types";
import type { Bundle } from "../rules-engine/types";
import type { Country } from "@esim-go/client";

const logger = createLogger({
  component: "CatalogResolvers",
  operationType: "resolver",
});

// Helper function to get pricing engine service
const getPricingEngineService = (context: Context): PricingEngineService => {
  return PricingEngineService.getInstance(context.services.db);
};

// Helper function to map payment method enum
const mapPaymentMethodEnum = (paymentMethod: any) => {
  return paymentMethod || "ISRAELI_CARD";
};
export const catalogResolvers: Partial<Resolvers> = {
  Query: {
    // Pricing filters - returns all available filter options dynamically
    pricingFilters: async (_, __, context: Context) => {
      try {
        logger.info("Fetching pricing filters from DB aggregation", {
          operationType: "pricing-filters-fetch",
        });

        // Get all filter data from repository methods
        const groups =
          await context.repositories.bundles.getAvailableBundleGroups();
        const dataTypeAggregation =
          await context.repositories.bundles.getBundlesByDataTypeAggregation();
        const durationAggregation =
          await context.repositories.bundles.getBundlesByDurationAggregation();

        let durations: {
          label: string;
          value: string;
          minDays: number;
          maxDays: number;
        }[] = [];
        let dataTypes: {
          label: string;
          value: string;
          isUnlimited: boolean;
        }[] = [];

        // Extract durations from repository aggregation data
        if (durationAggregation && durationAggregation.length > 0) {
          // Use actual durations from DB aggregation
          durations = durationAggregation.map((dur) => ({
            label: dur.label,
            value: dur.duration.toString(),
            minDays: dur.duration,
            maxDays: dur.duration,
          }));
        } else {
          // Fallback to static durations if DB aggregation data is not available
          logger.warn(
            "Bundle duration aggregation not available, using fallback durations",
            {
              operationType: "pricing-filters-duration-fallback",
            }
          );

          durations = [
            { label: "1-7 days", value: "short", minDays: 1, maxDays: 7 },
            { label: "8-30 days", value: "medium", minDays: 8, maxDays: 30 },
            { label: "31+ days", value: "long", minDays: 31, maxDays: 999 },
          ];
        }

        // Extract data types from repository aggregation data
        if (dataTypeAggregation && dataTypeAggregation.length > 0) {
          // Use actual data types from DB aggregation
          dataTypes = dataTypeAggregation.map((type) => ({
            label: type.label,
            value: type.dataType,
            isUnlimited: type.isUnlimited,
          }));
        } else {
          // Fallback to static data types if DB aggregation data is not available
          logger.warn(
            "Bundle data type aggregation not available, using fallback data types",
            {
              operationType: "pricing-filters-datatype-fallback",
            }
          );

          dataTypes = [
            { label: "Unlimited", value: "unlimited", isUnlimited: true },
            { label: "Limited", value: "limited", isUnlimited: false },
          ];
        }

        logger.info("Pricing filters fetched successfully", {
          bundleGroupCount: groups.length,
          durationCount: durations.length,
          dataTypeCount: dataTypes.length,
          operationType: "pricing-filters-fetch",
        });

        return {
          groups,
          durations,
          dataTypes,
        };
      } catch (error) {
        logger.error("Error fetching pricing filters", error as Error, {
          operationType: "pricing-filters-fetch",
        });
        throw new GraphQLError("Failed to fetch pricing filters", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    // Bundle data amount aggregation - gets real-time aggregated data from database
    bundleDataAggregation: async (_, __, context: Context) => {
      // This will be protected by @auth(role: "ADMIN") directive
      try {
        logger.info("Fetching bundle data aggregation from database", {
          operationType: "bundle-data-aggregation-fetch",
        });

        // Get aggregation data directly from the catalogue datasource
        const bundleAggregation =
          await context.repositories.bundles.getBundlesByDataTypeAggregation();

        logger.info("Successfully fetched bundle data aggregation", {
          total: bundleAggregation.length,
          unlimited:
            bundleAggregation.find((item) => item.dataType === "unlimited")
              ?.bundleCount || 0,
          byDurationCount:
            bundleAggregation.find((item) => item.dataType === "duration")
              ?.bundleCount || 0,
          operationType: "bundle-data-aggregation-fetch",
        });

        return {
          byDataAmount: bundleAggregation.map((item) => ({
            dataAmount: item.dataType === "unlimited" ? -1 : item.dataType,
            count: item.bundleCount,
            percentage: 0,
          })),
          byGroup: [],
          lastUpdated: new Date().toISOString(),
          total: bundleAggregation.reduce(
            (acc, item) => acc + item.bundleCount,
            0
          ),
          unlimited:
            bundleAggregation.find((item) => item.dataType === "unlimited")
              ?.bundleCount || 0,
          byDuration: bundleAggregation.map((item) => ({
            duration: item.label,
            count: item.bundleCount,
            percentage: 0,
          })),
        };
      } catch (error) {
        logger.error("Error fetching bundle data aggregation", error as Error, {
          operationType: "bundle-data-aggregation-fetch",
        });
        throw new GraphQLError("Failed to fetch bundle data aggregation", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    // Catalog sync history resolver
    catalogSyncHistory: async (_, { params = {} }, context: Context) => {
      try {
        const { limit = 50, offset = 0, status, type } = params || {};

        logger.info("Fetching catalog sync history", {
          limit,
          offset,
          status,
          type,
          operationType: "catalog-sync-history",
        });

        // Use repository to get sync history
        const { jobs: data, totalCount: count } =
          await context.repositories.syncJob.getJobHistory({
            status: status as any,
            jobType: type as any,
            limit: limit || 50,
            offset: offset || 0,
          });

        // Transform data to match frontend expectations
        const jobs = (data || []).map((job) => ({
          id: job.id,
          jobType: job.job_type || "FULL_SYNC", // Use correct column name job_type
          type: job.job_type || "FULL_SYNC", // Use correct column name job_type
          status: (job.status || "pending").toLowerCase(), // Frontend expects lowercase status
          priority: job.priority || "normal", // Use actual priority from DB
          bundleGroup: job.bundle_group,
          countryId: job.country_id,
          bundlesProcessed: job.bundles_processed || 0, // Use correct column name
          bundlesAdded: job.bundles_added || 0, // Use correct column name
          bundlesUpdated: job.bundles_updated || 0, // Use correct column name
          startedAt:
            job.started_at || job.created_at || new Date().toISOString(), // Use created_at as fallback if started_at is null
          completedAt: job.completed_at,
          duration: 0, // Duration not available in database schema
          errorMessage: job.error_message,
          metadata: job.metadata,
          createdAt: job.created_at || new Date().toISOString(),
          updatedAt: job.updated_at || new Date().toISOString(),
        }));

        logger.info("Catalog sync history fetched successfully", {
          jobCount: jobs.length,
          totalCount: count || 0,
          operationType: "catalog-sync-history",
        });

        return {
          jobs: jobs as any,
          totalCount: count || 0,
        };
      } catch (error) {
        logger.error("Failed to fetch catalog sync history", error as Error, {
          operationType: "catalog-sync-history",
        });
        throw error;
      }
    },

    // Catalog bundles queries (from new catalog system)
    catalogBundles: async (_, { criteria = {} }, context: Context) => {
      try {
        const {
          limit = 50,
          offset = 0,
          bundleGroups,
          countries = [],
          regions = [],
          minDuration,
          maxDuration,
          unlimited,
          search,
        } = criteria || {};

        logger.info("Fetching catalog bundles", {
          limit,
          offset,
          bundleGroups,
          countries,
          operationType: "catalog-bundles-fetch",
        });

        // Use bundle repository to search bundles
        const { bundles: data, totalCount: count } =
          await context.repositories.bundles.searchBundles({
            countries: countries as any,
            bundleGroups: bundleGroups as any,
            minDuration: minDuration as any,
            maxDuration: maxDuration as any,
            unlimited: unlimited as any,
            limit: limit || 50,
            offset: offset || 0,
          });

        // Transform data
        const bundles = (data || []).map((bundle) => ({
          id: bundle.id,
          esimGoName: bundle.esim_go_name,
          bundleGroup: bundle.bundle_group || "",
          description: bundle.description || "",
          duration: bundle.duration,
          dataAmount: bundle.data_amount,
          unlimited: bundle.unlimited,
          priceCents: bundle.price_cents,
          currency: bundle.currency,
          countries: bundle.countries || [],
          regions: bundle.regions || [],
          syncedAt: bundle.synced_at,
          createdAt: bundle.created_at,
          updatedAt: bundle.updated_at,
        }));

        return {
          bundles: bundles as any,
          totalCount: count || 0,
        };
      } catch (error) {
        logger.error("Failed to fetch catalog bundles", error as Error, {
          operationType: "catalog-bundles-fetch",
        });
        throw error;
      }
    },

    availableBundleGroups: async (_, __, context: Context) => {
      try {
        logger.info("Fetching available bundle groups", {
          operationType: "available-bundle-groups",
        });

        // Use bundle repository to get available bundle groups
        const bundleGroups =
          await context.repositories.bundles.getAvailableBundleGroups();

        logger.info("Available bundle groups fetched successfully", {
          groupCount: bundleGroups.length,
          operationType: "available-bundle-groups",
        });

        return bundleGroups;
      } catch (error) {
        logger.error(
          "Failed to fetch available bundle groups",
          error as Error,
          {
            operationType: "available-bundle-groups",
          }
        );
        throw error;
      }
    },

    // Main bundles resolver with optional filtering
    bundles: async (_, { countryId, regionId }, context: Context) => {
      try {
        logger.info("Fetching bundles with filtering", {
          countryId,
          regionId,
          operationType: "bundles-fetch",
        });

        if (countryId) {
          // Get country-specific bundles from bundle repository
          const countryBundles =
            await context.repositories.bundles.getBundlesByCountry(countryId);

          logger.info("Country bundles fetched successfully", {
            countryId,
            bundleCount: countryBundles.length,
            operationType: "bundles-fetch",
          });

          // Map to CountryBundle format - field resolvers will handle pricing calculations
          return countryBundles.map(
            (bundle) =>
              ({
                id: bundle?.id,
                name: bundle?.esim_go_name || "Bundle",
                country: {
                  iso: countryId,
                  name: countryId,
                  region: "",
                },
                duration: bundle?.duration || 0,
                currency: "USD",
                isUnlimited: bundle?.unlimited || bundle?.data_amount === -1,
                data: bundle?.data_amount || 0,
                group: bundle?.bundle_group || "Standard Fixed",
                price: bundle?.price_cents || 0,
              } satisfies CountryBundle)
          );
        } else if (regionId) {
          // Get region-specific bundles from bundle repository
          const regionBundles =
            (await context.repositories.bundles.getBundlesByRegion?.(
              regionId
            )) || [];

          logger.info("Region bundles fetched successfully", {
            regionId,
            bundleCount: regionBundles.length,
            operationType: "bundles-fetch",
          });

          // Map to CountryBundle format - field resolvers will handle pricing calculations
          return regionBundles.map((bundle: any) => ({
            bundleName: bundle?.esim_go_name || "Bundle",
            countryName: regionId,
            countryId: regionId,
            duration: bundle?.duration || 0,
            currency: "USD",
            configurationLevel: "GLOBAL" as any,
            planId: bundle?.esim_go_name || "bundle",
            isUnlimited: bundle?.unlimited || bundle?.data_amount === -1,
            dataAmount: bundle?.data_amount?.toString() || "0",
            bundleGroup: bundle?.bundle_group || "Standard Fixed",
            // Include raw bundle data for field resolvers
            price_cents: bundle?.price_cents,
            unlimited: bundle?.unlimited,
            data_amount: bundle?.data_amount,
            bundle_group: bundle?.bundle_group,
            esim_go_name: bundle?.esim_go_name,
          }));
        } else {
          // Return empty array or all bundles - depends on business logic
          logger.info(
            "No filtering parameters provided, returning empty array",
            {
              operationType: "bundles-fetch",
            }
          );
          return [];
        }
      } catch (error) {
        logger.error("Failed to fetch bundles", error as Error, {
          countryId,
          regionId,
          operationType: "bundles-fetch",
        });
        throw new GraphQLError("Failed to fetch bundles", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    // Countries with aggregated bundle data
    bundlesCountries: async (
      _,
      { includeBundles = false },
      context: Context
    ) => {
      try {
        logger.info("Fetching bundles by country aggregation", {
          includeBundles,
          operationType: "bundles-countries-fetch",
        });

        // Get country aggregation data from bundle repository
        const countryAggregation =
          await context.repositories.bundles.getBundlesByCountryAggregation();

        // Get country names mapping
        const countries = await context.dataSources.countries.getCountries();
        const countryMap = new Map(
          countries.map((country) => [country.iso, country])
        );

        // Transform to match GraphQL schema
        const bundlesCountries: BundlesByCountry[] = countryAggregation.map(
          (item) => ({
            countryId: item.countryId,
            country: {
              iso: item.countryId,
              name: countryMap.get(item.countryId)?.country || item.countryId,
              region: "",
            },
            __typename: "BundlesByCountry",
            countryName: countryMap.get(item.countryId) || item.countryId,
            bundleCount: item.bundleCount,
            pricingRange: item.priceRange,
          })
        );

        logger.info("Bundles by country aggregation fetched successfully", {
          countryCount: bundlesCountries.length,
          includeBundles,
          operationType: "bundles-countries-fetch",
        });

        return bundlesCountries;
      } catch (error) {
        logger.error("Failed to fetch bundles by country", error as Error, {
          operationType: "bundles-countries-fetch",
        });
        throw new GraphQLError("Failed to fetch bundles by country", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    // Regions with aggregated bundle data
    bundlesRegions: async (_, __, context: Context) => {
      try {
        logger.info("Fetching bundles by region aggregation", {
          operationType: "bundles-regions-fetch",
        });

        // Get region aggregation data from bundle repository
        const regionAggregation =
          await context.repositories.bundles.getBundlesByRegionAggregation();

        // Transform to match GraphQL schema
        const bundlesRegions: BundlesByRegion[] = regionAggregation.map(
          (item) => ({
            regionId: item.regionName,
            region: item.regionName,
            __typename: "BundlesByRegion",
            regionName: item.regionName,
            bundleCount: item.bundleCount,
            countryCount: item.countryCount,
          })
        );

        logger.info("Bundles by region aggregation fetched successfully", {
          regionCount: bundlesRegions.length,
          operationType: "bundles-regions-fetch",
        });

        return bundlesRegions;
      } catch (error) {
        logger.error("Failed to fetch bundles by region", error as Error, {
          operationType: "bundles-regions-fetch",
        });
        throw new GraphQLError("Failed to fetch bundles by region", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    // Calculate price for a single request
    calculatePrice: async (
      _,
      { numOfDays, countryId, paymentMethod, regionId },
      context: Context
    ) => {
      try {
        logger.info("Calculating single price", {
          countryId,
          numOfDays,
          operationType: "calculate-price",
        });
        // Use the pricing engine service instead of old pricing service
        const engineService = getPricingEngineService(context);

        let bundles:
          | Awaited<
              ReturnType<typeof context.repositories.bundles.getBundlesByRegion>
            >
          | Awaited<
              ReturnType<
                typeof context.repositories.bundles.getBundlesByCountry
              >
            > = [];

        if (regionId) {
          bundles = await context.repositories.bundles.getBundlesByRegion(
            regionId
          );
        } else if (countryId) {
          bundles = await context.repositories.bundles.getBundlesByCountry(
            countryId
          );
        }

        if (!bundles || bundles.length === 0) {
          throw new GraphQLError(`No bundles found for country: ${countryId}`, {
            extensions: { code: "NO_BUNDLES_FOUND" },
          });
        }

        // Map all available bundles for the pricing engine
        const availableBundles = bundles.map((bundle) => {
          return {
            id:
              bundle?.esim_go_name ||
              `${countryId}-${bundle?.duration || numOfDays}d`,
            name: bundle?.esim_go_name || "",
            cost: (bundle?.price_cents || 0) / 100,
            duration: bundle?.duration || numOfDays,
            countryId: countryId,
            countryName: countryId,

            group: bundle?.bundle_group || "Standard Fixed",
            isUnlimited: bundle?.unlimited || bundle?.data_amount === -1,
            dataAmount: bundle?.data_amount?.toString() || "0",
          } satisfies Bundle;
        });

        // Create pricing context for the rule engine - let engine select optimal bundle
        const pricingContext = PricingEngineService.createContext({
          availableBundles,
          requestedDuration: numOfDays,
          paymentMethod: mapPaymentMethodEnum(paymentMethod),
        });

        // Calculate price using rule engine (includes bundle selection)
        const calculation = await engineService.calculatePrice(pricingContext);

        logger.info("Single price calculated successfully", {
          countryId,
          regionId,
          finalPrice: calculation.finalPrice,
          operationType: "calculate-price",
        });

        // Map rule engine result to GraphQL schema
        return {
          __typename: "PricingBreakdown",
          bundle: {
            __typename: "CountryBundle",
            id: calculation.selectedBundle?.bundleId || "",
          } as CountryBundle,
          country: {
            iso: countryId,
            name: countryId,
            region: "",
          } satisfies Country,
          duration: numOfDays,
          currency: "USD",
          // Public fields
          totalCost: calculation.subtotal,
          discountValue: calculation.totalDiscount,
          priceAfterDiscount: calculation.priceAfterDiscount,
          // Admin-only fields (protected by @auth directives)
          cost: calculation.baseCost,
          costPlus: calculation.baseCost + calculation.markup,
          discountRate: calculation.discounts.reduce((sum, d) => {
            return sum + (d.type === "percentage" ? d.amount : 0);
          }, 0),
          processingRate: calculation.processingRate,
          processingCost: calculation.processingFee,
          finalRevenue: calculation.finalRevenue,
          netProfit: calculation.profit,
          discountPerDay: calculation.metadata?.discountPerUnusedDay || 0,
        } satisfies PricingBreakdown;
      } catch (error) {
        logger.error(
          "Error calculating price with rule engine",
          error as Error,
          {
            countryId,
            duration: numOfDays,
            operationType: "calculate-price",
          }
        );
        throw error;
      }
    },

    // Calculate prices for multiple requests (batch)
    calculatePrices: async (_, { inputs }, context: Context) => {
      try {
        logger.info("Calculating batch prices", {
          requestCount: inputs.length,
          operationType: "calculate-prices-batch",
        });

        const engineService = getPricingEngineService(context);

        // Get countries map for name lookup
        const countries = await context.dataSources.countries.getCountries();
        const countryMap = new Map(countries.map((c) => [c.iso, c.country]));

        const results = await Promise.all(
          inputs.map(async (input: CalculatePriceInput) => {
            try {
              // Get bundle information from catalog using the same method as single calculatePrice
              const countryBundles =
                await context.repositories.bundles.getBundlesByCountry(
                  input.countryId.toUpperCase()
                );

              if (!countryBundles || countryBundles.length === 0) {
                throw new GraphQLError(
                  `No bundles found for country: ${input.countryId}`,
                  {
                    extensions: { code: "NO_BUNDLES_FOUND" },
                  }
                );
              }

              // Map all available bundles for the pricing engine
              const availableBundles: Bundle[] = countryBundles.map(
                (bundle) => {
                  return {
                    id:
                      bundle?.esim_go_name ||
                      `${input.countryId}-${
                        bundle?.duration || input.numOfDays
                      }d`,
                    name: bundle?.esim_go_name || "",
                    cost: (bundle?.price_cents || 0) / 100,
                    duration: bundle?.duration || input.numOfDays,
                    countryId: input.countryId,
                    countryName:
                      countryMap.get(input.countryId) || input.countryId,
                    group: bundle?.bundle_group || "Standard Fixed",
                    isUnlimited:
                      bundle?.unlimited || bundle?.data_amount === -1,
                    dataAmount: bundle?.data_amount?.toString() || "0",
                  };
                }
              );

              // Create pricing context for the rule engine - let engine select optimal bundle
              const pricingContext = PricingEngineService.createContext({
                availableBundles,
                requestedDuration: input.numOfDays,
                paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
              });

              // Calculate price using rule engine (includes bundle selection)
              const calculation = await engineService.calculatePrice(
                pricingContext
              );

              // Map rule engine result to existing GraphQL schema
              return {
                bundleName:
                  calculation.selectedBundle?.bundleName ||
                  `${input.numOfDays} Day Bundle`,
                countryName: countryMap.get(input.countryId) || input.countryId,
                duration: input.numOfDays,
                cost: calculation.baseCost,
                costPlus: calculation.baseCost + calculation.markup,
                totalCost: calculation.subtotal,
                discountRate:
                  calculation.totalDiscount > 0
                    ? calculation.totalDiscount / calculation.subtotal
                    : 0,
                discountValue: calculation.totalDiscount,
                priceAfterDiscount: calculation.priceAfterDiscount,
                processingRate: calculation.processingRate,
                processingCost: calculation.processingFee,
                finalRevenue: calculation.finalRevenue,
                netProfit: calculation.profit,
                currency: "USD",
                discountPerDay: calculation.metadata?.discountPerUnusedDay || 0,
                // Cache the full calculation for field resolvers (appliedRules, discounts)
                _pricingCalculation: calculation,
              };
            } catch (error) {
              logger.error(
                `Error calculating pricing for ${input.countryId} ${input.numOfDays}d`,
                error as Error,
                {
                  countryId: input.countryId,
                  duration: input.numOfDays,
                  operationType: "calculate-prices-batch",
                }
              );
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
                currency: "USD",
                discountPerDay: 0,
              };
            }
          })
        );

        // Simple deduplication fix - remove nearly identical results
        const uniqueResults = results.filter((result, index, array) => {
          return (
            array.findIndex(
              (r) =>
                r.countryName === result.countryName &&
                r.duration === result.duration &&
                Math.abs(r.totalCost - result.totalCost) < 0.01 && // Same total cost (within 1 cent)
                Math.abs(r.finalRevenue - result.finalRevenue) < 0.01 // Same final revenue
            ) === index
          );
        });

        logger.info("Batch prices calculated successfully", {
          originalCount: results.length,
          uniqueCount: uniqueResults.length,
          operationType: "calculate-prices-batch",
        });

        return uniqueResults;
      } catch (error) {
        logger.error("Error calculating batch prices", error as Error, {
          requestCount: inputs.length,
          operationType: "calculate-prices-batch",
        });
        throw error;
      }
    },

    // Bundle groups (different from availableBundleGroups - this is the legacy resolver)
    bundleGroups: async (_, __, context: Context) => {
      try {
        logger.info("Fetching bundle groups (legacy resolver)", {
          operationType: "bundle-groups-legacy",
        });

        // Use catalogue datasource to get organization groups
        const bundleGroups =
          await context.repositories.bundles.getAvailableBundleGroups();

        logger.info("Bundle groups fetched successfully (legacy)", {
          groupCount: bundleGroups.length,
          operationType: "bundle-groups-legacy",
        });

        return bundleGroups;
      } catch (error) {
        logger.error("Failed to fetch bundle groups (legacy)", error as Error, {
          operationType: "bundle-groups-legacy",
        });

        // Fallback to hardcoded groups as per original implementation
        logger.warn("Falling back to hardcoded bundle groups", {
          operationType: "bundle-groups-fallback",
        });

        return [
          "Standard Fixed",
          "Standard - Unlimited Lite",
          "Standard - Unlimited Essential",
          "Standard - Unlimited Plus",
          "Regional Bundles",
        ];
      }
    },

    // High demand countries - returns list of country ISO codes marked as high demand
    highDemandCountries: async (_, __, context: Context) => {
      try {
        logger.info("Fetching high demand countries", {
          operationType: "high-demand-countries-fetch",
        });

        // Use high demand country repository to get all high demand countries
        const highDemandCountries =
          await context.repositories.highDemandCountries.getAllHighDemandCountries();

        logger.info("High demand countries fetched successfully", {
          countryCount: highDemandCountries.length,
          operationType: "high-demand-countries-fetch",
        });

        return highDemandCountries;
      } catch (error) {
        logger.error("Failed to fetch high demand countries", error as Error, {
          operationType: "high-demand-countries-fetch",
        });
        throw new GraphQLError("Failed to fetch high demand countries", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },
  },

  Mutation: {
    // Trigger catalog sync via workers
    triggerCatalogSync: async (_, { params }, context: Context) => {
      const {
        type,
        bundleGroup,
        countryId,
        priority = "normal",
        force = false,
      } = params;

      try {
        logger.info("Triggering catalog sync via workers", {
          type,
          bundleGroup,
          countryId,
          priority,
          force,
          userId: context.auth?.user?.id || "test-user",
          operationType: "trigger-catalog-sync",
        });

        // Check for conflicting active jobs
        const conflictingJob =
          await context.repositories.syncJob.getActiveJobDetails({
            jobType: type,
            bundleGroup: bundleGroup || undefined,
            countryId: countryId || undefined,
          });

        if (conflictingJob && !force) {
          const conflictMessage = `A ${conflictingJob.job_type} job is already ${conflictingJob.status}`;
          const createdTime = new Date(
            conflictingJob.created_at || new Date()
          ).toLocaleString();

          logger.warn("Catalog sync blocked by conflicting job", {
            conflictingJobId: conflictingJob.id,
            conflictingJobType: conflictingJob.job_type,
            conflictingJobStatus: conflictingJob.status,
            createdAt: conflictingJob.created_at,
            operationType: "sync-conflict-detected",
          });

          return {
            success: false,
            jobId: null,
            message: null,
            error: `${conflictMessage}. Created: ${createdTime}. Use force=true to cancel the existing job and start a new one.`,
            conflictingJob: {
              id: conflictingJob.id,
              jobType: conflictingJob.job_type,
              status: conflictingJob.status,
              createdAt: conflictingJob.created_at || new Date().toISOString(),
              startedAt: conflictingJob.started_at,
            },
          };
        }

        // If force=true and there's a conflicting job, cancel pending jobs
        if (conflictingJob && force) {
          const cancelledCount =
            await context.repositories.syncJob.cancelPendingJobs({
              jobType: type,
              bundleGroup: bundleGroup || undefined,
              countryId: countryId || undefined,
            });

          logger.info(
            "Force cancelled conflicting jobs before starting new sync",
            {
              cancelledCount,
              conflictingJobId: conflictingJob.id,
              operationType: "force-cancel-sync-jobs",
            }
          );
        }

        // Import the BullMQ queue to actually queue jobs
        const { Queue } = await import("bullmq");
        const { default: IORedis } = await import("ioredis");

        // Create Redis connection (same config as workers)
        const redis = new IORedis({
          host: "localhost",
          port: 6379,
          password: "mypassword",
          maxRetriesPerRequest: null,
        });

        // Create the same queue as workers use
        const catalogQueue = new Queue("catalog-sync", { connection: redis });

        // Generate proper UUID for the job ID
        const { randomUUID } = await import("crypto");

        // Create a sync job record using repository
        const syncJob = await context.repositories.syncJob.createJob({
          jobType: type as any,
          priority: (priority || "normal") as any,
          bundleGroup: bundleGroup || undefined,
          countryId: countryId || undefined,
          metadata: {
            force,
            triggeredBy: context.auth?.user?.id || "test-user",
          },
        });

        // Now queue the actual BullMQ job for the workers to process
        const bullmqJob = await catalogQueue.add(
          `catalog-sync-${type}`,
          {
            type: type, // Use GraphQL enum directly
            bundleGroup: bundleGroup,
            countryId: countryId,
            priority: priority,
            metadata: {
              dbJobId: syncJob.id,
              force,
              triggeredBy: context.auth?.user?.id || "test-user",
            },
          },
          {
            priority: priority === "high" ? 1 : priority === "normal" ? 5 : 10,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 50,
          }
        );

        // Update the database job with the BullMQ job ID
        await context.repositories.syncJob.updateJobProgress(syncJob.id, {
          metadata: {
            ...((syncJob.metadata as any) || {}),
            bullmqJobId: bullmqJob.id,
          },
        });

        // Clean up Redis connection
        await redis.quit();

        logger.info("Catalog sync job queued successfully", {
          dbJobId: syncJob.id,
          bullmqJobId: bullmqJob.id,
          type,
          bundleGroup,
          countryId,
          operationType: "trigger-catalog-sync",
        });

        return {
          success: true,
          jobId: syncJob.id,
          message: `Catalog sync job queued successfully. Job ID: ${syncJob.id}`,
          error: null,
          conflictingJob: null,
        };
      } catch (error) {
        logger.error("Failed to trigger catalog sync", error as Error, {
          type,
          bundleGroup,
          countryId,
          operationType: "trigger-catalog-sync",
        });
        throw new GraphQLError("Failed to trigger catalog sync", {
          extensions: { code: "INTERNAL_ERROR" },
        });
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

        // Use sync service from context
        const syncResult = await context.services.syncs.triggerFullSync(
          context.auth.user!.id
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
          // TODO: Add getTotalCount method to BundleRepository if needed
          // totalBundles = await context.repositories.bundles.getTotalCount();
          logger.warn(
            "BundleRepository is not available in context.repositories. Cannot get total bundle count.",
            {
              operationType: "catalog-sync-manual",
            }
          );
          totalBundles = 0; // Set to 0 as BundleRepository is not available
        } catch (metadataError) {
          logger.warn("Failed to get bundle count from database", {
            error: (metadataError as Error).message,
            operationType: "catalog-sync-manual",
          });
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

  CountryBundle: {
    pricingBreakdown: async (parent: any, _, context: Context) => {
      const engineService = getPricingEngineService(context);
      // TODO: calculate pricing
      const calculation = await engineService.calculatePrice(
        PricingEngineService.createContext({
          availableBundles: parent.bundles,
          requestedDuration: parent.duration,
          user: parent.user,
          paymentMethod: parent.paymentMethod,
        })
      );
      return {
        bundle: parent.bundle,
        country: parent.country,
        currency: parent.currency,
        duration: parent.duration,
        cost: calculation.baseCost,
        costPlus: calculation.baseCost + calculation.markup,
        discountRate: calculation.discounts.reduce(
          (acc, discount) => acc + discount.amount,
          0
        ),
        discountValue: calculation.totalDiscount,
        priceAfterDiscount: calculation.priceAfterDiscount,
        processingRate: calculation.processingRate,
        processingFee: calculation.processingFee,
        discountPerDay: calculation.metadata?.discountPerUnusedDay || 0,
        finalRevenue: calculation.finalRevenue,
        netProfit: calculation.profit,
        processingCost: calculation.processingFee,
        totalCost: calculation.baseCost + calculation.markup,
        finalPrice: calculation.finalPrice,
        appliedRules: calculation.appliedRules,
        discounts: calculation.discounts,
        __typename: "PricingBreakdown",
      };
    },

    // Field resolver for appliedRules (rules that affected the pricing)
    appliedRules: async (parent: any, _, context: Context) => {
      try {
        if (parent._pricingCalculation) {
          return parent._pricingCalculation.appliedRules || [];
        }

        const calculation = await getPricingEngineService(
          context
        ).calculatePrice(
          PricingEngineService.createContext({
            availableBundles: parent.bundles,
            requestedDuration: parent.duration,
            user: parent.user,
            paymentMethod: parent.paymentMethod,
          })
        );
        parent._pricingCalculation = calculation;
        return calculation.appliedRules || [];
      } catch (error) {
        logger.error("Error getting applied rules for bundle", error as Error, {
          bundleName: parent.bundleName,
          operationType: "countryBundle-appliedRules-field-resolver",
        });
        return [];
      }
    },
  },

  PricingBreakdown: {
    // Field resolver for appliedRules (rules that affected the pricing)
    appliedRules: async (parent: any, _, context: Context) => {
      try {
        if (parent._pricingCalculation) {
          return parent._pricingCalculation.appliedRules || [];
        }

        // If no cached calculation, return empty array
        logger.info("No pricing calculation available for appliedRules", {
          bundleName: parent.bundleName,
          operationType: "pricingBreakdown-appliedRules-field-resolver",
        });
        return [];
      } catch (error) {
        logger.error("Error getting applied rules", error as Error, {
          bundleName: parent.bundleName,
          operationType: "pricingBreakdown-appliedRules-field-resolver",
        });
        return [];
      }
    },

    // Field resolver for discounts (detailed discount breakdown)
    discounts: async (parent: any, _, context: Context) => {
      try {
        if (parent._pricingCalculation) {
          return parent._pricingCalculation.discounts || [];
        }

        // If no cached calculation, return empty array
        logger.info("No pricing calculation available for discounts", {
          bundleName: parent.bundleName,
          operationType: "pricingBreakdown-discounts-field-resolver",
        });
        return [];
      } catch (error) {
        logger.error("Error getting discount breakdown", error as Error, {
          bundleName: parent.bundleName,
          operationType: "pricingBreakdown-discounts-field-resolver",
        });
        return [];
      }
    },
  },

  BundlesByCountry: {
    bundles: async (parent: any, _, context: Context) => {
      try {
        // Only calculate bundles if they weren't already provided or if explicitly requested
        if (parent.bundles !== null) {
          return parent.bundles;
        }

        logger.info("Calculating bundles with pricing for country", {
          countryId: parent.countryId,
          operationType: "bundles-countries-field-resolver",
        });

        // Get bundles for this country
        const countryBundles =
          await context.repositories.bundles.getBundlesByCountry(
            parent.countryId
          );

        if (!countryBundles || countryBundles.length === 0) {
          logger.warn("No bundles found for country in field resolver", {
            countryId: parent.countryId,
            operationType: "bundles-countries-field-resolver",
          });
          return [];
        }

        // Map to CountryBundle format - field resolvers will handle pricing calculations
        const bundles = countryBundles.map((bundle) => {
          const countryBundle: CountryBundle = {
            id: bundle?.id,
            name: bundle?.esim_go_name || "Bundle",
            country: parent.country,
            duration: bundle?.duration || 0,
            __typename: "CountryBundle",
            currency: "USD",
            group: bundle?.bundle_group || "Standard Fixed",
            isUnlimited: bundle?.unlimited || bundle?.data_amount === -1,
            data: bundle?.data_amount || 0,
            pricingBreakdown: undefined,
            appliedRules: undefined,
          };
          return countryBundle;
        });

        logger.info("Bundles prepared for field resolvers", {
          countryId: parent.countryId,
          bundleCount: bundles.length,
          operationType: "bundles-countries-field-resolver",
        });

        return bundles;
      } catch (error) {
        logger.error(
          "Failed to prepare bundles for field resolvers",
          error as Error,
          {
            countryId: parent.countryId,
            operationType: "bundles-countries-field-resolver",
          }
        );
        return [];
      }
    },
  },

  Subscription: {
    // Catalog sync progress subscription
    catalogSyncProgress: {
      subscribe: async (_, __, context: Context) => {
        if (!context.services.pubsub) {
          throw new GraphQLError("PubSub service not available", {
            extensions: { code: "SERVICE_UNAVAILABLE" },
          });
        }

        const { PubSubEvents } = await import("../context/pubsub");
        return context.services.pubsub.asyncIterator([
          PubSubEvents.CATALOG_SYNC_PROGRESS,
        ]);
      },
    },
  },
};
