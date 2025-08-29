import { Queue, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../config/index.js";
import { createLogger } from "@hiilo/utils";
import { SyncJobType } from "../generated/types.js";

const logger = createLogger({ component: "CatalogSyncQueue" });

type Provider = "esim-go" | "maya";
// Job data types (using generated GraphQL enum)
export interface FullSyncJobData {
  type: SyncJobType.FullSync;
  triggeredBy: "scheduled" | "manual" | "api";
  provider: Provider;
  metadata?: Record<string, any>;
}

export interface GroupSyncJobData {
  type: SyncJobType.GroupSync;
  bundleGroup: string;
  provider: Exclude<Provider, "maya">;
  metadata?: Record<string, any>;
}

export interface CountrySyncJobData {
  type: SyncJobType.CountrySync;
  countryId: string;
  provider: Provider;
  metadata?: Record<string, any>;
}

export interface BundleSyncJobData {
  type: SyncJobType.MetadataSync; // Note: Using MetadataSync as there's no BundleSync in schema
  bundleId: string;
  provider: Provider;
  metadata?: Record<string, any>;
}

export type CatalogSyncJobData =
  | FullSyncJobData
  | GroupSyncJobData
  | CountrySyncJobData
  | BundleSyncJobData;

// Redis connection
const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  family: 0,
});

// Create the queue
export const catalogSyncQueue = new Queue<CatalogSyncJobData>("catalog-sync", {
  connection,
  defaultJobOptions: config.queue.defaultJobOptions,
});

// Create queue events for monitoring
export const catalogSyncQueueEvents = new QueueEvents("catalog-sync", {
  connection: connection.duplicate(),
});

// Queue management functions
export const catalogSyncQueueManager = {
  /**
   * Add a full catalog sync job
   */
  async addFullSyncJob(
    triggeredBy: "scheduled" | "manual" | "api" = "manual",
    provider: Provider
  ) {
    const job = await catalogSyncQueue.add(
      "FULL_SYNC",
      {
        type: SyncJobType.FullSync,
        triggeredBy,
        provider,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      {
        priority: triggeredBy === "manual" ? 1 : 2,
      }
    );

    logger.info("Full sync job added", {
      jobId: job.id,
      triggeredBy,
      operationType: "job-added",
    });

    return job;
  },

  /**
   * Add a bundle group sync job
   */
  async addGroupSyncJob(bundleGroup: string) {
    const job = await catalogSyncQueue.add(
      "GROUP_SYNC",
      {
        type: SyncJobType.GroupSync,
        bundleGroup,
        provider: "esim-go",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      {
        priority: 3,
      }
    );

    logger.info("Group sync job added", {
      jobId: job.id,
      bundleGroup,
      operationType: "job-added",
    });

    return job;
  },

  /**
   * Add a country sync job
   */
  async addCountrySyncJob(countryId: string, provider: Provider) {
    const job = await catalogSyncQueue.add(
      "COUNTRY_SYNC",
      {
        type: SyncJobType.CountrySync,
        countryId,
        provider,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      {
        priority: 4,
      }
    );

    logger.info("Country sync job added", {
      jobId: job.id,
      countryId,
      operationType: "job-added",
    });

    return job;
  },

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      catalogSyncQueue.getWaitingCount(),
      catalogSyncQueue.getActiveCount(),
      catalogSyncQueue.getCompletedCount(),
      catalogSyncQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  },

  /**
   * Clean old jobs
   */
  async cleanOldJobs() {
    const [completed, failed] = await Promise.all([
      catalogSyncQueue.clean(
        config.worker.cleanupOldJobsDays * 24 * 60 * 60 * 1000,
        100,
        "completed"
      ),
      catalogSyncQueue.clean(
        config.worker.cleanupOldJobsDays * 24 * 60 * 60 * 1000,
        100,
        "failed"
      ),
    ]);

    logger.info("Cleaned old jobs", {
      completed: completed.length,
      failed: failed.length,
      operationType: "cleanup",
    });

    return { completed: completed.length, failed: failed.length };
  },

  /**
   * Pause/resume queue
   */
  async pause() {
    await catalogSyncQueue.pause();
    logger.info("Queue paused", { operationType: "queue-control" });
  },

  async resume() {
    await catalogSyncQueue.resume();
    logger.info("Queue resumed", { operationType: "queue-control" });
  },

  /**
   * Close queue connections
   */
  async close() {
    await catalogSyncQueue.close();
    await catalogSyncQueueEvents.close();
    await connection.quit();
    logger.info("Queue connections closed", { operationType: "queue-control" });
  },

  async listen(
    callback: (
      event: "completed" | "failed" | "progress",
      job: { jobId: string; data: CatalogSyncJobData }
    ) => void
  ) {
    catalogSyncQueueEvents.on("completed", ({ jobId, returnvalue }) => {
      const data = JSON.parse(returnvalue as string) as CatalogSyncJobData;
      callback("completed", { jobId, data });
    });
    catalogSyncQueueEvents.on("failed", ({ jobId, failedReason }) => {
      const data = JSON.parse(failedReason as string) as CatalogSyncJobData;
      callback("failed", { jobId, data });
    });
    catalogSyncQueueEvents.on("progress", ({ jobId, data }) => {
      callback("progress", {
        jobId,
        data: JSON.parse(data as string) as CatalogSyncJobData,
      });
    });
  },
};

// Monitor queue events
catalogSyncQueueEvents.on("completed", ({ jobId, returnvalue }) => {
  logger.info("Job completed", {
    jobId,
    result: returnvalue,
    operationType: "job-completed",
  });
});

catalogSyncQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error("Job failed", undefined, {
    jobId,
    reason: failedReason,
    operationType: "job-failed",
  });
});

catalogSyncQueueEvents.on("progress", ({ jobId, data }) => {
  logger.debug("Job progress", {
    jobId,
    progress: data,
    operationType: "job-progress",
  });
});
