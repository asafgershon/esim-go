import type { Country } from "@esim-go/client";
import type { Bundle } from "@esim-go/rules-engine";
import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { PricingEngineService } from "../services/pricing-engine.service";
import type {
  BundlesByCountry,
  BundlesByRegion,
  CalculatePriceInput,
  CountryBundle,
  PricingBreakdown,
  Resolvers,
  SyncJobType
} from "../types";

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
        const groups = await context.repositories.bundles.getGroups();
        const dataTypes = await context.repositories.bundles.getDataTypes();
        const durations = await context.repositories.bundles.getDurationRanges();

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

        // Transform data to match GraphQL schema
        const jobs = (data || []).map((job) => ({
          id: job.id,
          jobType: job.job_type,
          type: job.job_type as SyncJobType,
          status: job.status,
          priority: job.priority,
          group: job.bundle_group, // Schema expects 'group' not 'bundleGroup'
          countryId: job.country_id,
          bundlesProcessed: job.bundles_processed,
          bundlesAdded: job.bundles_added,
          bundlesUpdated: job.bundles_updated,
          startedAt: job.started_at || job.created_at,
          completedAt: job.completed_at,
          duration: job.completed_at && job.started_at 
            ? new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
            : null,
          errorMessage: job.error_message,
          metadata: job.metadata,
          createdAt: job.created_at,
          updatedAt: job.updated_at,
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
