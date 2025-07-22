import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/index.js';
import { createLogger } from '@esim-go/utils';

const logger = createLogger({ component: 'CatalogSyncQueue' });

// Job data types
export interface FullSyncJobData {
  type: 'full-sync';
  triggeredBy: 'scheduled' | 'manual' | 'api';
  metadata?: Record<string, any>;
}

export interface GroupSyncJobData {
  type: 'group-sync';
  bundleGroup: string;
  metadata?: Record<string, any>;
}

export interface CountrySyncJobData {
  type: 'country-sync';
  countryId: string;
  metadata?: Record<string, any>;
}

export interface BundleSyncJobData {
  type: 'bundle-sync';
  bundleId: string;
  metadata?: Record<string, any>;
}

export type CatalogSyncJobData = 
  | FullSyncJobData 
  | GroupSyncJobData 
  | CountrySyncJobData 
  | BundleSyncJobData;

// Redis connection
const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
});

// Create the queue
export const catalogSyncQueue = new Queue<CatalogSyncJobData>('catalog-sync', {
  connection,
  defaultJobOptions: config.queue.defaultJobOptions,
});

// Create queue events for monitoring
export const catalogSyncQueueEvents = new QueueEvents('catalog-sync', {
  connection: connection.duplicate(),
});

// Queue management functions
export const catalogSyncQueueManager = {
  /**
   * Add a full catalog sync job
   */
  async addFullSyncJob(triggeredBy: 'scheduled' | 'manual' | 'api' = 'manual') {
    const job = await catalogSyncQueue.add(
      'full-sync',
      {
        type: 'full-sync',
        triggeredBy,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      {
        priority: triggeredBy === 'manual' ? 1 : 2,
      }
    );

    logger.info('Full sync job added', {
      jobId: job.id,
      triggeredBy,
      operationType: 'job-added',
    });

    return job;
  },

  /**
   * Add a bundle group sync job
   */
  async addGroupSyncJob(bundleGroup: string) {
    const job = await catalogSyncQueue.add(
      'group-sync',
      {
        type: 'group-sync',
        bundleGroup,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      {
        priority: 3,
      }
    );

    logger.info('Group sync job added', {
      jobId: job.id,
      bundleGroup,
      operationType: 'job-added',
    });

    return job;
  },

  /**
   * Add a country sync job
   */
  async addCountrySyncJob(countryId: string) {
    const job = await catalogSyncQueue.add(
      'country-sync',
      {
        type: 'country-sync',
        countryId,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      {
        priority: 4,
      }
    );

    logger.info('Country sync job added', {
      jobId: job.id,
      countryId,
      operationType: 'job-added',
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
        'completed'
      ),
      catalogSyncQueue.clean(
        config.worker.cleanupOldJobsDays * 24 * 60 * 60 * 1000,
        100,
        'failed'
      ),
    ]);

    logger.info('Cleaned old jobs', {
      completed: completed.length,
      failed: failed.length,
      operationType: 'cleanup',
    });

    return { completed: completed.length, failed: failed.length };
  },

  /**
   * Pause/resume queue
   */
  async pause() {
    await catalogSyncQueue.pause();
    logger.info('Queue paused', { operationType: 'queue-control' });
  },

  async resume() {
    await catalogSyncQueue.resume();
    logger.info('Queue resumed', { operationType: 'queue-control' });
  },

  /**
   * Close queue connections
   */
  async close() {
    await catalogSyncQueue.close();
    await catalogSyncQueueEvents.close();
    await connection.quit();
    logger.info('Queue connections closed', { operationType: 'queue-control' });
  },
};

// Monitor queue events
catalogSyncQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info('Job completed', {
    jobId,
    result: returnvalue,
    operationType: 'job-completed',
  });
});

catalogSyncQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('Job failed', undefined, {
    jobId,
    reason: failedReason,
    operationType: 'job-failed',
  });
});

catalogSyncQueueEvents.on('progress', ({ jobId, data }) => {
  logger.debug('Job progress', {
    jobId,
    progress: data,
    operationType: 'job-progress',
  });
});