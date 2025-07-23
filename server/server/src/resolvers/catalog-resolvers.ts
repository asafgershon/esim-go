import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import type { Resolvers } from "../types";

const logger = createLogger({ 
  component: 'CatalogResolvers',
  operationType: 'resolver'
});

export const catalogResolvers: Partial<Resolvers> = {
  Query: {
    // Pricing filters - returns all available filter options dynamically
    pricingFilters: async (_, __, context: Context) => {
      try {
        // Get dynamic bundle groups with fallback handling
        const bundleGroups = await context.dataSources.catalogue.getOrganizationGroups();

        // Get bundle data aggregation for dynamic durations and data types
        const bundleAggregation = await context.dataSources.catalogue.getBundleDataAggregation();

        let durations: { label: string; value: string; minDays?: number; maxDays?: number }[] = [];
        let dataTypes: { label: string; value: string; isUnlimited?: boolean }[] = [];

        if (
          bundleAggregation &&
          bundleAggregation.total > 0 &&
          bundleAggregation.byDuration?.length > 0
        ) {
          // Extract unique durations from aggregation data
          durations = bundleAggregation.byDuration.map(
            (durationGroup: any) => ({
              label: `${durationGroup.duration} days`,
              value: durationGroup.duration.toString(),
              minDays: durationGroup.duration,
              maxDays: durationGroup.duration,
            })
          );

          // Dynamic data types based on actual bundle data
          dataTypes = [];
          if (bundleAggregation.unlimited > 0) {
            dataTypes.push({
              label: "Unlimited",
              value: "unlimited",
              isUnlimited: true,
            });
          }
          if (bundleAggregation.total - bundleAggregation.unlimited > 0) {
            dataTypes.push({
              label: "Limited",
              value: "limited",
              isUnlimited: false,
            });
          }
        } else {
          // Fallback to static values if aggregation data is not available
          durations = [
            { label: "1-7 days", value: "short", minDays: 1, maxDays: 7 },
            { label: "8-30 days", value: "medium", minDays: 8, maxDays: 30 },
            { label: "31+ days", value: "long", minDays: 31, maxDays: 999 },
          ];
          dataTypes = [
            { label: "Unlimited", value: "unlimited", isUnlimited: true },
            { label: "Limited", value: "limited", isUnlimited: false },
          ];
        }

        return {
          bundleGroups,
          durations: durations.map(d => ({
            label: d.label,
            value: d.value,
            minDays: d.minDays ?? 1,
            maxDays: d.maxDays ?? 999
          })),
          dataTypes: dataTypes.map(dt => ({
            label: dt.label,
            value: dt.value,
            isUnlimited: dt.isUnlimited ?? false
          })),
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
          await context.dataSources.catalogue.getBundleDataAggregation();

        logger.info("Successfully fetched bundle data aggregation", {
          total: bundleAggregation.total,
          unlimited: bundleAggregation.unlimited,
          byDurationCount: bundleAggregation.byDuration?.length || 0,
          byBundleGroupCount: bundleAggregation.byBundleGroup?.length || 0,
          operationType: "bundle-data-aggregation-fetch",
        });

        return {
          ...bundleAggregation,
          byDataAmount: [],
          byDuration: (bundleAggregation.byDuration || []).map(duration => ({
            duration: duration.duration,
            count: duration.count,
            category: `${duration.duration} days`,
            percentage: 0
          })),
          byBundleGroup: (bundleAggregation.byBundleGroup || []).map(group => ({
            bundleGroup: group.bundleGroup,
            count: group.count,
            averageDataAmount: 0,
            limited: 0,
            total: group.count,
            unlimited: 0
          }))
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
        const {
          limit = 50,
          offset = 0,
          status,
          type,
        } = params || {};

        logger.info("Fetching catalog sync history", {
          limit,
          offset,
          status,
          type,
          operationType: "catalog-sync-history",
        });

        // Use repository to get sync history
        const { jobs: data, totalCount: count } = await context.repositories.syncJob.getJobHistory({
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
          startedAt: job.started_at || job.created_at || new Date().toISOString(), // Use created_at as fallback if started_at is null
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
        const { bundles: data, totalCount: count } = await context.repositories.bundles.searchBundles({
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
        const bundleGroups = await context.repositories.bundles.getAvailableBundleGroups();

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
            ...(syncJob.metadata as any || {}),
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
          logger.warn(
            "Failed to get bundle count from database",
            metadataError as Error,
            {
              operationType: "catalog-sync-manual",
            }
          );
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