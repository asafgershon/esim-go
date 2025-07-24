import type { CatalogueResponseInner } from "@esim-go/client";
import { ESimGoClient } from "@esim-go/client";
import { createLogger, withPerformanceLogging } from "@esim-go/utils";
import { config } from "../config/index.js";
import { transformAndValidateCatalogBundle } from "../transformations/catalog-bundle.transformer.js";
import { BundleDatabaseService } from "./bundle-database.service.js";
import {
  catalogMetadataRepository,
  syncJobRepository,
} from "./supabase.service.js";

const logger = createLogger({
  component: "CatalogSyncService",
  operationType: "catalog-sync",
});

export class CatalogSyncService {
  private client: ESimGoClient;
  private bundleDatabase: BundleDatabaseService;

  constructor() {
    this.client = new ESimGoClient({
      apiKey: config.esimGo.apiKey,
      baseUrl: config.esimGo.baseUrl,
      retryAttempts: config.esimGo.retryAttempts,
    });
    this.bundleDatabase = new BundleDatabaseService();
  }

  /**
   * Fetch bundle groups dynamically from eSIM Go API
   */
  private async getBundleGroups(): Promise<string[]> {
    try {
      logger.debug("Fetching bundle groups from eSIM Go API");
      const response = await this.client.getOrganizationGroups();

      const groups = response.data.map((group) => group.name);
      logger.info("Bundle groups fetched successfully", {
        groupCount: groups.length,
        groups,
        operationType: "bundle-groups-fetch",
      });

      return groups;
    } catch (error) {
      logger.error(
        "Failed to fetch bundle groups from API, using fallback",
        error as Error,
        {
          operationType: "bundle-groups-fetch",
        }
      );

      // Fallback to hardcoded groups if API fails
      return [
        "Standard Fixed",
        "Standard - Unlimited Lite",
        "Standard - Unlimited Essential",
        "Standard - Unlimited Plus",
        "Regional Bundles",
      ];
    }
  }

  /**
   * Perform a full catalog sync using bundle group strategy
   */
  async performFullSync(jobId: string): Promise<void> {
    return withPerformanceLogging(
      logger,
      "full-catalog-sync",
      async () => {
        // Fetch bundle groups dynamically from API
        const bundleGroups = await this.getBundleGroups();

        logger.info("Starting full catalog sync", {
          jobId,
          bundleGroups,
          strategy: "bundle-groups",
        });

        const results = {
          totalBundles: 0,
          bundlesAdded: 0,
          bundlesUpdated: 0,
          errors: [] as string[],
          bundleGroups: [] as string[],
        };

        // Update job status to running
        await syncJobRepository.startJob(jobId);

        try {
          // Sync each bundle group
          for (const group of bundleGroups) {
            try {
              const groupResults = await this.syncBundleGroup(group, jobId);

              results.totalBundles += groupResults.processed;
              results.bundlesAdded += groupResults.added;
              results.bundlesUpdated += groupResults.updated;
              results.bundleGroups.push(group);

              if (groupResults.errors.length > 0) {
                results.errors.push(...groupResults.errors);
              }

              // Update job progress and mark as partial sync if any bundles were saved
              await syncJobRepository.updateJobProgress(jobId, {
                bundlesProcessed: results.totalBundles,
                bundlesAdded: results.bundlesAdded,
                bundlesUpdated: results.bundlesUpdated,
                metadata: {
                  progress: `Completed ${results.bundleGroups.length}/${bundleGroups.length} groups`,
                  currentGroup: group,
                  syncStatus:
                    results.bundleGroups.length === bundleGroups.length
                      ? "complete"
                      : "partial",
                  completedGroups: results.bundleGroups,
                  remainingGroups: bundleGroups.slice(
                    results.bundleGroups.length
                  ),
                },
              });

              logger.info("Bundle group completed", {
                group,
                jobId,
                progress: `${results.bundleGroups.length}/${bundleGroups.length}`,
                totalBundles: results.totalBundles,
              });
            } catch (error) {
              const errorMsg = `Failed to sync bundle group ${group}: ${
                (error as Error).message
              }`;
              logger.error("Bundle group sync failed", error as Error, {
                group,
                jobId,
              });
              results.errors.push(errorMsg);
            }
          }

          // Determine if sync is complete or partial
          const isCompleteSync =
            results.bundleGroups.length === bundleGroups.length &&
            results.errors.length === 0;

          // Record sync in metadata (full or partial)
          if (isCompleteSync) {
            await catalogMetadataRepository.recordFullSync({
              totalBundles: results.totalBundles,
              bundleGroups: results.bundleGroups,
              metadata: {
                syncedAt: new Date().toISOString(),
                syncStatus: "complete",
                errors: results.errors,
              },
            });
          } else {
            // Record partial sync
            await catalogMetadataRepository.recordPartialSync({
              totalBundles: results.totalBundles,
              bundleGroups: results.bundleGroups,
              metadata: {
                syncedAt: new Date().toISOString(),
                syncStatus: "partial",
                completedGroups: results.bundleGroups,
                failedGroups: bundleGroups.filter(
                  (g) => !results.bundleGroups.includes(g)
                ),
                errors: results.errors,
              },
            });
          }

          // Complete the job
          await syncJobRepository.completeJob(jobId, {
            bundlesProcessed: results.totalBundles,
            bundlesAdded: results.bundlesAdded,
            bundlesUpdated: results.bundlesUpdated,
            metadata: {
              bundleGroups: results.bundleGroups,
              syncStatus: isCompleteSync ? "complete" : "partial",
              errors: results.errors,
              completedAt: new Date().toISOString(),
            },
          });

          logger.info(
            isCompleteSync
              ? "Full catalog sync completed"
              : "Partial catalog sync completed",
            {
              jobId,
              totalBundles: results.totalBundles,
              bundlesAdded: results.bundlesAdded,
              bundlesUpdated: results.bundlesUpdated,
              bundleGroups: results.bundleGroups,
              completedGroups: results.bundleGroups.length,
              totalGroups: bundleGroups.length,
              syncStatus: isCompleteSync ? "complete" : "partial",
              errors: results.errors.length,
            }
          );
        } catch (error) {
          // Fail the job
          await syncJobRepository.failJob(jobId, error as Error);
          throw error;
        }
      },
      { jobId }
    );
  }

  /**
   * Sync a specific bundle group
   */
  async syncBundleGroup(
    bundleGroup: string,
    jobId?: string
  ): Promise<{
    processed: number;
    added: number;
    updated: number;
    errors: string[];
  }> {
    return withPerformanceLogging(
      logger,
      "sync-bundle-group",
      async () => {
        logger.info("Syncing bundle group", { bundleGroup, jobId });

        const errors: string[] = [];
        let totalProcessed = 0;
        let totalAdded = 0;
        let totalUpdated = 0;

        try {
          // Fetch bundles for this group using pagination with incremental saves
          let page = 1;
          let hasMore = true;
          const perPage = 50; // Max per page to avoid 401 errors

          while (hasMore) {
            logger.debug("Fetching page for bundle group", {
              bundleGroup,
              page,
              perPage,
            });

            const response = await this.client.getCatalogueWithRetry({
              group: bundleGroup,
              perPage: perPage,
              page: page,
            });

            if (response.data && response.data.length > 0) {
              // Transform bundles using the new transformer
              const validBundles = response.data.map((bundle) =>
                transformAndValidateCatalogBundle(bundle, "USD")
              );

              // Log transformation errors
              if (!validBundles) {
                errors.push(
                  `Transform error for ${response.data[0].name}: ${response.data[0].name}`
                );
              }

              // Save transformed bundles
              if (validBundles) {
                const upsertResult = await this.bundleDatabase.bulkUpsert(
                  validBundles.filter((bundle) => bundle !== null)
                );

                totalProcessed += response.data.length;
                totalAdded += upsertResult.added;
                totalUpdated += upsertResult.updated;
                errors.push(...upsertResult.errors);
              }

              logger.info("Page saved to database", {
                bundleGroup,
                page,
                bundlesThisPage: response.data.length,
                validBundlesThisPage: validBundles ? 1 : 0,
                transformErrorsThisPage: validBundles ? 0 : 1,
                totalProcessed,
                totalAdded,
                totalUpdated,
              });

              // If we got fewer bundles than perPage, we've reached the end
              if (response.data.length < perPage) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              // No more data
              hasMore = false;
            }
          }

          logger.info("Bundle group sync completed", {
            bundleGroup,
            totalPages: page - (hasMore ? 1 : 0),
            processed: totalProcessed,
            added: totalAdded,
            updated: totalUpdated,
            errors: errors.length,
          });

          return {
            processed: totalProcessed,
            added: totalAdded,
            updated: totalUpdated,
            errors: errors,
          };
        } catch (error) {
          const errorMsg = `Failed to sync bundle group ${bundleGroup}: ${
            (error as Error).message
          }`;
          errors.push(errorMsg);
          logger.error("Bundle group sync error", error as Error, {
            bundleGroup,
          });

          return {
            processed: 0,
            added: 0,
            updated: 0,
            errors,
          };
        }
      },
      { bundleGroup }
    );
  }

  /**
   * Sync bundles for a specific country
   */
  async syncCountryBundles(countryId: string, jobId: string): Promise<void> {
    return withPerformanceLogging(
      logger,
      "sync-country-bundles",
      async () => {
        logger.info("Starting country bundle sync", { countryId, jobId });

        await syncJobRepository.startJob(jobId);

        try {
          const bundles: CatalogueResponseInner[] = [];

          // Fetch bundles for the specific country
          const response = await this.client.getCatalogueWithRetry({
            countries: countryId,
            perPage: 50, // Max per page to avoid 401 errors
          });

          if (response.data) {
            bundles.push(...response.data);
          }

          // Transform and upsert bundles
          const validBundles = bundles.map((bundle) =>
            transformAndValidateCatalogBundle(bundle, "USD")
          ).filter((bundle) => bundle !== null);

          const allErrors: string[] = validBundles
            .filter((bundle) => bundle !== null)
            .map(
              (bundle) =>
                `Transform error for ${bundle?.esim_go_name}: ${bundle?.esim_go_name}`
            );

          let upsertResult = { added: 0, updated: 0, errors: [] as string[] };

          if (validBundles.length > 0) {
            upsertResult = await this.bundleDatabase.bulkUpsert(validBundles);
            allErrors.push(...upsertResult.errors);
          }

          await syncJobRepository.completeJob(jobId, {
            bundlesProcessed: bundles.length,
            bundlesAdded: upsertResult.added,
            bundlesUpdated: upsertResult.updated,
            metadata: {
              countryId,
              errors: allErrors,
            },
          });

          logger.info("Country bundle sync completed", {
            countryId,
            jobId,
            processed: bundles.length,
            added: upsertResult.added,
            updated: upsertResult.updated,
          });
        } catch (error) {
          await syncJobRepository.failJob(jobId, error as Error);
          throw error;
        }
      },
      { countryId, jobId }
    );
  }

  /**
   * Check API health
   */
  async checkApiHealth(): Promise<void> {
    try {
      const startTime = Date.now();

      // Try to fetch a small set of bundles
      const response = await this.client.getCatalogueWithRetry({
        perPage: 1,
      });

      const responseTime = Date.now() - startTime;

      if (response.data) {
        await catalogMetadataRepository.updateApiHealth("healthy", {
          responseTime,
          checkedAt: new Date().toISOString(),
        });
      } else {
        await catalogMetadataRepository.updateApiHealth("degraded", {
          responseTime,
          checkedAt: new Date().toISOString(),
          reason: "Empty response",
        });
      }
    } catch (error) {
      await catalogMetadataRepository.updateApiHealth("down", {
        error: (error as Error).message,
        checkedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle stuck jobs
   */
  async handleStuckJobs(): Promise<void> {
    const cancelledCount = await syncJobRepository.cancelStuckJobs(
      config.worker.stuckJobThreshold
    );

    if (cancelledCount > 0) {
      logger.warn("Cancelled stuck jobs", {
        count: cancelledCount,
        threshold: config.worker.stuckJobThreshold,
      });
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(): Promise<void> {
    const deletedCount = await syncJobRepository.cleanupOldJobs(
      config.worker.cleanupOldJobsDays
    );

    if (deletedCount > 0) {
      logger.info("Cleaned up old jobs", {
        count: deletedCount,
        daysToKeep: config.worker.cleanupOldJobsDays,
      });
    }
  }
}
