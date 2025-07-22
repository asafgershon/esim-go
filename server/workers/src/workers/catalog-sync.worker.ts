import { Worker, Job } from 'bullmq';
import { createLogger, withPerformanceLogging } from '@esim-go/utils';
import { config } from '../config/index.js';
import { CatalogSyncService } from '../services/catalog-sync.service.js';
import { syncJobRepository } from '../services/supabase.service.js';
import type { CatalogSyncJobData } from '../queues/catalog-sync.queue.js';
import IORedis from 'ioredis';

const logger = createLogger({ 
  component: 'CatalogSyncWorker',
  operationType: 'worker' 
});

// Create the catalog sync service
const catalogSyncService = new CatalogSyncService();

// Redis connection for the worker
const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
});

// Process job based on type
async function processJob(job: Job<CatalogSyncJobData>): Promise<any> {
  const { type } = job.data;

  logger.info('Processing catalog sync job', {
    jobId: job.id,
    type,
    attemptsMade: job.attemptsMade,
  });

  // Create a sync job in the database
  const dbJob = await syncJobRepository.createJob({
    jobType: type,
    priority: job.opts.priority === 1 ? 'high' : 'normal',
    bundleGroup: type === 'group-sync' ? job.data.bundleGroup : undefined,
    countryId: type === 'country-sync' ? job.data.countryId : undefined,
    metadata: {
      bullmqJobId: job.id,
      ...job.data.metadata,
    },
  });

  try {
    switch (type) {
      case 'full-sync':
        await catalogSyncService.performFullSync(dbJob.id);
        return { 
          success: true, 
          type: 'full-sync',
          dbJobId: dbJob.id,
        };

      case 'group-sync':
        const groupResult = await catalogSyncService.syncBundleGroup(
          job.data.bundleGroup,
          dbJob.id
        );
        
        await syncJobRepository.completeJob(dbJob.id, {
          bundlesProcessed: groupResult.processed,
          bundlesAdded: groupResult.added,
          bundlesUpdated: groupResult.updated,
          metadata: { errors: groupResult.errors },
        });
        
        return {
          success: true,
          type: 'group-sync',
          bundleGroup: job.data.bundleGroup,
          result: groupResult,
          dbJobId: dbJob.id,
        };

      case 'country-sync':
        await catalogSyncService.syncCountryBundles(
          job.data.countryId,
          dbJob.id
        );
        return {
          success: true,
          type: 'country-sync',
          countryId: job.data.countryId,
          dbJobId: dbJob.id,
        };

      case 'bundle-sync':
        // Implement single bundle sync if needed
        throw new Error('Bundle sync not implemented yet');

      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } catch (error) {
    // Update the database job as failed
    await syncJobRepository.failJob(dbJob.id, error as Error);
    throw error;
  }
}

// Create the worker
export const catalogSyncWorker = new Worker<CatalogSyncJobData>(
  'catalog-sync',
  async (job) => {
    return withPerformanceLogging(
      logger,
      `process-${job.data.type}`,
      async () => processJob(job),
      {
        jobId: job.id,
        jobType: job.data.type,
      }
    );
  },
  {
    connection,
    concurrency: config.worker.concurrency,
    
    // Worker settings
    settings: {
      stalledInterval: 30000, // 30 seconds
      maxStalledCount: 3,
    },
  }
);

// Worker event handlers
catalogSyncWorker.on('ready', () => {
  logger.info('Catalog sync worker ready');
});

catalogSyncWorker.on('completed', (job) => {
  logger.info('Job completed', {
    jobId: job.id,
    jobType: job.data.type,
    returnValue: job.returnvalue,
  });
});

catalogSyncWorker.on('failed', (job, error) => {
  logger.error('Job failed', error, {
    jobId: job?.id,
    jobType: job?.data.type,
    attemptsMade: job?.attemptsMade,
  });
});

catalogSyncWorker.on('error', (error) => {
  logger.error('Worker error', error);
});

catalogSyncWorker.on('stalled', (jobId) => {
  logger.warn('Job stalled', { jobId });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker gracefully');
  await catalogSyncWorker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker gracefully');
  await catalogSyncWorker.close();
  await connection.quit();
  process.exit(0);
});