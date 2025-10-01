import byteSize from "byte-size";
import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import {
  type CatalogBundle,
  type CustomerBundle,
  type Resolvers,
  type SyncJobType,
  type PaymentMethod,
  Provider,
} from "../types";
import { extractPricingKey } from "../dataloaders/pricing-dataloader";
import { getRedis } from "../services";
import { env } from "../config/env";

const logger = createLogger({
  component: "CatalogResolvers",
  operationType: "resolver",
});

let redis = getRedis();

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

        const [groups, dataTypes, durations] = await Promise.all([
            context.repositories.bundles.getGroups(),
            context.repositories.bundles.getDataTypes(),
            context.repositories.bundles.getDistinctDurations()
        ]);
        
        const result = {
          groups: groups.map(g => g.replace("-", "")),
          durations,
          dataTypes,
        };

        logger.info("Pricing filters fetched successfully", {
          bundleGroupCount: result.groups.length,
          durationCount: durations.length,
          dataTypeCount: dataTypes.length,
          operationType: "pricing-filters-fetch",
        });

        return result;
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

        const { jobs: data, totalCount: count } =
          await context.repositories.syncJob.getJobHistory({
            status: status as any,
            jobType: type as any,
            limit: limit || 50,
            offset: offset || 0,
          });

        const jobs = (data || []).map((job) => ({
          id: job.id,
          jobType: job.job_type,
          type: job.job_type as SyncJobType,
          status: job.status,
          priority: job.priority,
          group: job.bundle_group,
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
        } = criteria || {};

        const searchResult = await context.repositories.bundles.search({
          countries: countries as any,
          groups: bundleGroups as any,
          regions: regions as any,
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
          id: bundle.external_id, 
          esimGoName: bundle.name,
          bundleGroup: bundle.group_name || "",
          description: bundle.description || "",
          duration: bundle.validity_days,
          dataAmount: bundle.data_amount_mb,
          unlimited: bundle.unlimited,
          priceCents: Math.round((bundle.price_usd || 0) * 100),
          currency: bundle.currency,
          countries: [], // This needs a separate resolver if required
          regions: bundle.region ? [bundle.region] : [],
          syncedAt: bundle.updated_at,
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
    
    highDemandCountries: async (_, __, context: Context) => {
      try {
        const highDemandCountries =
          await context.repositories.highDemandCountries.getAllHighDemandCountries();
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
    triggerCatalogSync: async (_, { params }, context: Context) => {
      const {
        type,
        bundleGroup,
        countryId,
        priority = "normal",
        force = false,
        provider = Provider.EsimGo,
      } = params;

      try {
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

        if (conflictingJob && force) {
          await context.repositories.syncJob.cancelPendingJobs({
              jobType: type,
              bundleGroup: bundleGroup || undefined,
              countryId: countryId || undefined,
            });
        }

        const { Queue } = await import("bullmq");
        const catalogQueue = new Queue("catalog-sync", {
          connection: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD,
          },
        });

        if (!provider) {
          throw new GraphQLError("Provider is required", {
            extensions: { code: "INVALID_ARGUMENT" },
          });
        }

        const syncJob = await context.repositories.syncJob.createJob({
          jobType: type as any,
          priority: (priority || "normal") as any,
          bundleGroup: bundleGroup || undefined,
          countryId: countryId || undefined,
          provider: provider,
          metadata: {
            force,
            triggeredBy: context.auth?.user?.id || "test-user",
          },
        });

        const bullmqJob = await catalogQueue.add(
          `catalog-sync-${type}`,
          {
            type: type,
            bundleGroup: bundleGroup,
            countryId: countryId,
            priority: priority,
            provider: provider,
            metadata: {
              dbJobId: syncJob.id,
              force,
              triggeredBy: context.auth?.user?.id || "test-user",
            },
          },
          {
            priority: priority === "high" ? 1 : priority === "normal" ? 5 : 10,
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          }
        );

        await context.repositories.syncJob.updateJobProgress(syncJob.id, {
          metadata: {
            ...((syncJob.metadata as any) || {}),
            bullmqJobId: bullmqJob.id,
          },
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
    pricingBreakdown: async (parent: any, { paymentMethod }: any, context: Context) => {
      try {
        if (!context.dataLoaders) throw new Error("Dataloaders not initialized");
        const pricingKey = extractPricingKey(
          {
            ...parent,
            validityInDays: parent.duration,
            countries: parent.country ? [parent.country.iso] : [],
            region: parent.country?.region,
          },
          mapPaymentMethodEnum(paymentMethod) as PaymentMethod,
          context
        );

        return context.dataLoaders.pricing.load(pricingKey);
      } catch (error) {
        logger.error("Failed to calculate pricing breakdown", error as Error, {
          bundleName: parent.name,
        });
        throw error;
      }
    },
    appliedRules: async (parent: any, { paymentMethod }: any, context: Context) => {
      try {
        if (!context.dataLoaders) throw new Error("Dataloaders not initialized");
        const pricingKey = extractPricingKey(
          {
            ...parent,
            validityInDays: parent.duration,
            countries: parent.country ? [parent.country.iso] : [],
            region: parent.country?.region,
          },
          mapPaymentMethodEnum(paymentMethod) as PaymentMethod,
          context
        );

        const pricingBreakdown = await context.dataLoaders.pricing.load(
          pricingKey
        );
        return pricingBreakdown.appliedRules || [];
      } catch (error) {
        logger.error("Failed to get applied rules for bundle", error as Error, {
          bundleName: parent.name,
        });
        return [];
      }
    },
  },

  CatalogBundle: {
    pricingBreakdown: async (parent: any, { paymentMethod }: any, context: Context) => {
      try {
        if (!context.dataLoaders) throw new Error("Dataloaders not initialized");
        const pricingKey = extractPricingKey(
          parent,
          mapPaymentMethodEnum(paymentMethod) as PaymentMethod,
          context
        );
        return context.dataLoaders.pricing.load(pricingKey);
      } catch (error) {
        logger.error("Failed to calculate pricing breakdown", error as Error, {
          bundleName: parent.esimGoName || parent.name,
        });
        throw error;
      }
    },
  },

  CustomerBundle: {
    pricingBreakdown: async (parent: any, { paymentMethod }: any, context: Context) => {
      try {
        if (!context.dataLoaders) throw new Error("Dataloaders not initialized");
        const pricingKey = extractPricingKey(
          {
            ...parent,
            validityInDays: parent.durationInDays || parent.validityInDays || 1,
          },
          mapPaymentMethodEnum(paymentMethod) as PaymentMethod,
          context
        );

        return context.dataLoaders.pricing.load(pricingKey);
      } catch (error) {
        logger.error("Failed to calculate pricing breakdown", error as Error, {
          bundleName: parent.name,
        });
        throw error;
      }
    },
  },

  PricingBreakdown: {
    appliedRules: async (parent: any, _, context: Context) => {
      try {
        if (parent._pricingCalculation) {
          return parent._pricingCalculation.appliedRules || [];
        }
        return [];
      } catch (error) {
        logger.error("Error getting applied rules", error as Error, {
          bundleName: parent.bundleName,
        });
        return [];
      }
    },
    discounts: async (parent: any, _, context: Context) => {
      try {
        if (parent._pricingCalculation) {
          return parent._pricingCalculation.discounts || [];
        }
        return [];
      } catch (error) {
        logger.error("Error getting discount breakdown", error as Error, {
          bundleName: parent.bundleName,
        });
        return [];
      }
    },
  },

  BundlesByCountry: {
    bundles: async (parent, _, context: Context) => {
      try {
        if (parent.bundles !== null) {
          return parent.bundles;
        }

        const countryBundles = await context.repositories.bundles.search({
          countries: [parent.country.iso],
          limit: 100,
          offset: 0,
        });

        if (!countryBundles || countryBundles.count === 0) {
          return [];
        }

        // Map to CountryBundle format
        const bundles = countryBundles.data.map((bundle) => {
          const countryBundle: CatalogBundle | CustomerBundle = {
            basePrice: bundle?.price_usd || 0,
            countries: [], // This needs to be resolved separately
            createdAt: bundle?.created_at,
            isUnlimited: bundle?.unlimited || false,
            currency: bundle?.currency || "USD",
            dataAmountReadable: byteSize(bundle?.data_amount_mb || 0).toString(),
            groups: bundle?.group_name ? [bundle.group_name] : [],
            name: bundle?.name || "Bundle",
            validityInDays: bundle?.validity_days || 0,
            esimGoName: bundle?.name || "Bundle",
            id: bundle?.external_id || "Bundle",
            speed: bundle.speed || [],
            syncedAt: bundle?.updated_at,
            updatedAt: bundle?.updated_at,
            provider: "unknown" as Provider, // This needs to be resolved
            dataAmountMB: bundle?.data_amount_mb,
            description: bundle?.description,
            region: bundle?.region,
          };
          return countryBundle;
        });
        return bundles;
      } catch (error) {
        logger.error("Failed to prepare bundles for field resolvers", error as Error, {
            countryId: parent.country.iso,
          }
        );
        return [];
      }
    },
  },

  Subscription: {
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
    pricingPipelineProgress: {
      subscribe: async (_, { correlationId }, context: Context) => {
        if (!context.services.pubsub) {
          throw new GraphQLError("PubSub service not available", {
            extensions: { code: "SERVICE_UNAVAILABLE" },
          });
        }
        const { PubSubEvents } = await import("../context/pubsub");
        const { withFilter } = await import("graphql-subscriptions");

        const iterator = withFilter(
          () =>
            context.services.pubsub!.asyncIterator([
              PubSubEvents.PRICING_PIPELINE_STEP,
            ]),
          (payload, variables) => {
            return payload.correlationId === variables.correlationId;
          }
        );
        
        return iterator(_, { correlationId }, context, {} as any);
      },
      resolve: (payload: any) => {
        return payload;
      },
    },
  },
};
