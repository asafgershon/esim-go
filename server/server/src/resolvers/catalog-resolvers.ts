import byteSize from "byte-size";
import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import type {
  CatalogBundle,
  CustomerBundle,
  Resolvers,
  SyncJobType
} from "../types";
import { calculatePricingForBundle } from "./pricing-resolvers";

const logger = createLogger({
  component: "CatalogResolvers",
  operationType: "resolver",
});

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
        const durations =
          await context.repositories.bundles.getDurationRanges();

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
          duration:
            job.completed_at && job.started_at
              ? new Date(job.completed_at).getTime() -
                new Date(job.started_at).getTime()
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
        const searchResult = await context.repositories.bundles.search({
          countries: countries as any,
          groups: bundleGroups as any,
          minValidityInDays: minDuration as any,
          maxValidityInDays: maxDuration as any,
          isUnlimited: unlimited as any,
          limit: limit || 50,
          offset: offset || 0,
        });

        const data = searchResult.data;
        const count = searchResult.count;

        // Transform data
        const bundles = (data || []).map((bundle) => ({
          id: bundle.esim_go_name, // Use esim_go_name as id
          esimGoName: bundle.esim_go_name,
          bundleGroup: bundle.groups?.[0] || "", // groups is an array
          description: bundle.description || "",
          duration: bundle.validity_in_days,
          dataAmount: bundle.data_amount_mb,
          unlimited: bundle.is_unlimited,
          priceCents: Math.round((bundle.price || 0) * 100), // Convert to cents
          currency: bundle.currency,
          countries: bundle.countries || [],
          regions: bundle.region ? [bundle.region] : [], // region is singular
          syncedAt: bundle.updated_at, // Using updated_at as there's no last_synced field
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
        const { cleanEnv, str } = await import("envalid");

        // Get Redis config from environment
        const env = cleanEnv(process.env, {
          REDIS_HOST: str({ default: "localhost" }),
          REDIS_PORT: str({ default: "6379" }),
          REDIS_PASSWORD: str({ default: "mypassword" }),
          REDIS_USER: str({ default: "default" }),
          RAILWAY_SERVICE_REDIS_URL: str({ default: "" }),
        });

        // Use external Railway Redis URL if available (internal DNS not working)
        let redisConfig: any;
        
        if (env.RAILWAY_SERVICE_REDIS_URL && process.env.REDIS_URL) {
          // Replace internal hostname with external one in the URL
          const externalRedisUrl = process.env.REDIS_URL.replace('redis.railway.internal', env.RAILWAY_SERVICE_REDIS_URL);
          logger.info('Using external Redis URL for catalog queue', {
            originalUrl: process.env.REDIS_URL,
            externalUrl: externalRedisUrl,
            operationType: 'redis-catalog-url-config'
          });
          redisConfig = externalRedisUrl;
        } else {
          // Fallback to object config
          redisConfig = {
            host: env.REDIS_HOST,
            port: parseInt(env.REDIS_PORT),
            password: env.REDIS_PASSWORD,
            username: env.REDIS_USER,
            maxRetriesPerRequest: null,
          };
        }

        // Create Redis connection (same config as workers)
        const redis = new IORedis(redisConfig);

        // Add error handler to prevent unhandled error events
        redis.on("error", (error) => {
          logger.error("Redis catalog queue error", error as Error, {
            operationType: "redis-catalog-queue-error",
          });
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
    pricingBreakdown: async (
      parent,
      { },
      context: Context
    ) => {
      try {
        // CountryBundle already has all the bundle data we need
        const bundle = {
          ...parent,
          __typename: "CountryBundle",
          basePrice: parent.price || 0,
          validityInDays: parent.duration,
          countries: parent.country ? [parent.country.iso] : [],
          region: parent.country?.region,
        };

        return calculatePricingForBundle(
          bundle,
          mapPaymentMethodEnum(parent),
          context
        );
      } catch (error) {
        logger.error("Failed to calculate pricing breakdown", error as Error, {
          bundleName: parent.name,
          operationType: "countryBundle-pricingBreakdown-field-resolver",
        });
        throw error;
      }
    },

    // Field resolver for appliedRules (rules that affected the pricing)
    appliedRules: async (parent: any, _, context: Context) => {
      // Applied rules come from pricing calculation, not directly on bundle
      // This should be accessed through pricingBreakdown.appliedRules
      return [];
    },
  },

  CatalogBundle: {
    pricingBreakdown: async (
      parent: any,
      { paymentMethod },
      context: Context
    ) => {
      try {
        // CatalogBundle has the complete bundle data
        const bundle = {
          ...parent,
          __typename: "CatalogBundle",
          basePrice: parent.basePrice || 0,
          validityInDays: parent.validityInDays || 1,
          countries: parent.countries || [],
          region: parent.region,
        };

        return calculatePricingForBundle(
          bundle,
          mapPaymentMethodEnum(paymentMethod),
          context
        );
      } catch (error) {
        logger.error("Failed to calculate pricing breakdown", error as Error, {
          bundleName: parent.esimGoName || parent.name,
          operationType: "catalogBundle-pricingBreakdown-field-resolver",
        });
        throw error;
      }
    },
  },

  CustomerBundle: {
    pricingBreakdown: async (
      parent: any,
      { paymentMethod },
      context: Context
    ) => {
      try {
        // CustomerBundle is for specific customer purchases
        const bundle = {
          ...parent,
          __typename: "CustomerBundle",
          basePrice: parent.price || parent.originalPrice || 0,
          validityInDays: parent.durationInDays || parent.validityInDays || 1,
          countries: parent.countries || [],
          region: parent.region,
        };

        return calculatePricingForBundle(
          bundle,
          mapPaymentMethodEnum(paymentMethod),
          context
        );
      } catch (error) {
        logger.error("Failed to calculate pricing breakdown", error as Error, {
          bundleName: parent.name,
          operationType: "customerBundle-pricingBreakdown-field-resolver",
        });
        throw error;
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
    bundles: async (parent, _, context: Context) => {
      try {
        // Only calculate bundles if they weren't already provided or if explicitly requested
        if (parent.bundles !== null) {
          return parent.bundles;
        }

        logger.info("Calculating bundles with pricing for country", {
          countryId: parent.country.iso,
          operationType: "bundles-countries-field-resolver",
        });
        // Get bundles for this country
        const countryBundles = await context.repositories.bundles.search({
          countries: [parent.country.iso],
          limit: 100,
          offset: 0,
        });

        if (!countryBundles || countryBundles.count === 0) {
          logger.warn("No bundles found for country in field resolver", {
            countryId: parent.country.iso,
            operationType: "bundles-countries-field-resolver",
          });
          return [];
        }

        // Map to CountryBundle format - field resolvers will handle pricing calculations
        const bundles = countryBundles.data.map((bundle) => {
          const countryBundle: CatalogBundle | CustomerBundle = {
            basePrice: bundle?.price || 0,
            countries: [parent.country.iso],
            createdAt: bundle?.created_at,
            isUnlimited: bundle?.is_unlimited || bundle?.data_amount_mb === -1,
            currency: bundle?.currency || "USD",
            dataAmountReadable: byteSize(
              bundle?.data_amount_mb || 0
            ).toString(),
            groups: bundle?.groups || [],
            name: bundle?.esim_go_name || "Bundle",
            validityInDays: bundle?.validity_in_days || 0,
            esimGoName: bundle?.esim_go_name || "Bundle",
            id: bundle?.esim_go_name || "Bundle",
            speed: bundle.speed || [],
            syncedAt: bundle?.updated_at,
            updatedAt: bundle?.updated_at,
            dataAmountMB: bundle?.data_amount_mb,
            description: bundle?.description,
            region: bundle?.region,
          };
          return countryBundle;
        });

        logger.info("Bundles prepared for field resolvers", {
          countryId: parent.country.iso,
          bundleCount: bundles.length,
          operationType: "bundles-countries-field-resolver",
        });

        return bundles;
      } catch (error) {
        logger.error(
          "Failed to prepare bundles for field resolvers",
          error as Error,
          {
            countryId: parent.country.iso,
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

    // Pricing pipeline progress subscription
    pricingPipelineProgress: {
      subscribe: async (_, { correlationId }, context: Context) => {
        if (!context.services.pubsub) {
          throw new GraphQLError("PubSub service not available", {
            extensions: { code: "SERVICE_UNAVAILABLE" },
          });
        }

        logger.info("Client subscribed to pricing pipeline progress", {
          correlationId,
          userId: context.auth?.user?.id,
          operationType: "pricing-pipeline-subscription",
        });

        const { PubSubEvents } = await import("../context/pubsub");
        const { withFilter } = await import("graphql-subscriptions");

        // Create the async iterator with the filter
        const iterator = withFilter(
          () =>
            context.services.pubsub!.asyncIterator([
              PubSubEvents.PRICING_PIPELINE_STEP,
            ]),
          (payload, variables) => {
            // Log for debugging
            logger.debug("Filtering pricing pipeline event", {
              payloadCorrelationId: payload.correlationId,
              requestedCorrelationId: variables.correlationId,
              match: payload.correlationId === variables.correlationId,
              operationType: "pricing-pipeline-filter",
            });

            // Filter by correlationId to ensure users only get their own pricing updates
            return payload.correlationId === variables.correlationId;
          }
        );

        // Return the iterator result
        return iterator(_, { correlationId }, context);
      },
      resolve: (payload: any) => {
        // The payload itself is the pricing pipeline step data
        return payload;
      },
    },
  },
};
