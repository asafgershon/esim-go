import { ESimGoClient } from "@hiilo/esim-go";
import { createLogger, withPerformanceLogging } from "../lib/logger";
import { SyncJobType } from "../types";
import {
  BundleRepository,
  CatalogMetadataRepository,
  SyncJobRepository,
} from "../repositories/catalog";

/**
 * CatalogSyncService V2 - Uses shared client and worker system
 *
 * This is a facade that delegates heavy sync operations to the worker system
 * while providing direct access to cached catalog data
 */
export class CatalogSyncServiceV2 {
  private client: ESimGoClient;
  private bundleRepository: BundleRepository;
  private syncJobRepository: SyncJobRepository;
  private catalogMetadataRepository: CatalogMetadataRepository;
  private logger = createLogger({
    component: "CatalogSyncServiceV2",
    operationType: "catalog-sync",
  });

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new ESimGoClient({
      apiKey,
      baseUrl: baseUrl || "https://api.esim-go.com/v2.5",
      retryAttempts: 3,
    });

    // Initialize repositories
    this.bundleRepository = new BundleRepository();
    this.syncJobRepository = new SyncJobRepository();
    this.catalogMetadataRepository = new CatalogMetadataRepository();
  }

  /**
   * Trigger a full catalog sync
   * Note: In production, this should be called via the worker system
   */
  async triggerFullSync(userId?: string): Promise<{
    jobId: string;
    status: string;
    priority: string;
  }> {
    return withPerformanceLogging(
      this.logger,
      "trigger-full-sync",
      async () => {
        this.logger.info("Creating full catalog sync job", { userId });

        try {
          // Check if there's already an active full sync
          const hasActive = await this.syncJobRepository.hasActiveJob({
            jobType: SyncJobType.FullSync,
          });

          if (hasActive) {
            throw new Error("A full sync is already in progress");
          }

          // Create a sync job in the database
          const job = await this.syncJobRepository.createJob({
            jobType: SyncJobType.FullSync,
            priority: "high",
            metadata: {
              triggeredBy: userId || "manual",
              timestamp: new Date().toISOString(),
            },
          });

          this.logger.info("Full sync job created", {
            jobId: job.id,
            status: job.status,
            priority: job.priority,
          });

          return {
            jobId: job.id,
            status: job.status,
            priority: job.priority,
          };
        } catch (error) {
          this.logger.error("Failed to create full sync job", error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Trigger sync for a specific bundle group
   */
  async triggerGroupSync(
    bundleGroup: string,
    userId?: string
  ): Promise<{
    jobId: string;
    bundleGroup: string;
    status: string;
    priority: string;
  }> {
    return withPerformanceLogging(
      this.logger,
      "trigger-group-sync",
      async () => {
        this.logger.info("Creating bundle group sync job", {
          bundleGroup,
          userId,
        });

        try {
          // Check if there's already an active sync for this group
          const hasActive = await this.syncJobRepository.hasActiveJob({
            jobType: SyncJobType.GroupSync,
            bundleGroup,
          });

          if (hasActive) {
            throw new Error(
              `A sync for bundle group ${bundleGroup} is already in progress`
            );
          }

          const job = await this.syncJobRepository.createJob({
            jobType: SyncJobType.GroupSync,
            priority: "normal",
            bundleGroup,
            metadata: {
              triggeredBy: userId || "manual",
              timestamp: new Date().toISOString(),
            },
          });

          this.logger.info("Group sync job created", {
            jobId: job.id,
            bundleGroup,
            status: job.status,
            priority: job.priority,
          });

          return {
            jobId: job.id,
            bundleGroup,
            status: job.status,
            priority: job.priority,
          };
        } catch (error) {
          this.logger.error("Failed to create group sync job", error as Error, {
            bundleGroup,
          });
          throw error;
        }
      },
      { bundleGroup }
    );
  }

  /**
   * Trigger sync for a specific country
   */
  async triggerCountrySync(
    countryId: string,
    userId?: string
  ): Promise<{
    jobId: string;
    countryId: string;
    status: string;
    priority: string;
  }> {
    return withPerformanceLogging(
      this.logger,
      "trigger-country-sync",
      async () => {
        this.logger.info("Creating country sync job", { countryId, userId });

        try {
          // Check if there's already an active sync for this country
          const hasActive = await this.syncJobRepository.hasActiveJob({
            jobType: SyncJobType.CountrySync,
            countryId,
          });

          if (hasActive) {
            throw new Error(
              `A sync for country ${countryId} is already in progress`
            );
          }

          const job = await this.syncJobRepository.createJob({
            jobType: SyncJobType.CountrySync,
            priority: "normal",
            countryId,
            metadata: {
              triggeredBy: userId || "manual",
              timestamp: new Date().toISOString(),
            },
          });

          this.logger.info("Country sync job created", {
            jobId: job.id,
            countryId,
            status: job.status,
            priority: job.priority,
          });

          return {
            jobId: job.id,
            countryId,
            status: job.status,
            priority: job.priority,
          };
        } catch (error) {
          this.logger.error(
            "Failed to create country sync job",
            error as Error,
            { countryId }
          );
          throw error;
        }
      },
      { countryId }
    );
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<any> {
    return withPerformanceLogging(this.logger, "get-sync-status", async () => {
      try {
        const [syncStats, activeJobs] = await Promise.all([
          this.catalogMetadataRepository.getSyncStats(),
          this.syncJobRepository.getActiveJobs(),
        ]);

        const status = {
          sync: syncStats,
          activeJobs: activeJobs.map((job) => ({
            id: job.id,
            type: job.job_type,
            status: job.status,
            startedAt: job.started_at,
            bundlesProcessed: job.bundles_processed,
          })),
        };

        this.logger.info("Retrieved sync status", {
          activeJobs: status.activeJobs.length,
          lastSyncedAt: status.sync.lastSyncedAt,
        });

        return status;
      } catch (error) {
        this.logger.error("Failed to get sync status", error as Error);
        throw error;
      }
    });
  }
}
