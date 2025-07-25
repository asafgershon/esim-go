import { Worker, Job } from 'bullmq';
import { createLogger, withPerformanceLogging } from '@esim-go/utils';
import { config } from '../config/index.js';
import { CatalogSyncService } from '../services/catalog-sync.service.js';
import { syncJobRepository } from '../services/supabase.service.js';
import type { CatalogSyncJobData } from '../queues/catalog-sync.queue.js';
import { Redis } from 'ioredis';

const logger = createLogger({ 
  component: 'CatalogSyncWorker',
  operationType: 'worker' 
});

// Create the catalog sync service
const catalogSyncService = new CatalogSyncService();

// Redis connection for the worker
const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
});

// Process job based on type
async function processJob(job: Job<any>): Promise<any> {
  const { type } = job.data;

  logger.info('Processing catalog sync job', {
    jobId: job.id,
    type,
    attemptsMade: job.attemptsMade,
  });

  const transformJobType = (type: string) => {
    switch (type) {
      // Handle lowercase hyphenated format (original)
      case 'full-sync':
        return 'FULL_SYNC';
      case 'group-sync':
        return 'GROUP_SYNC';
      case 'country-sync':
        return 'COUNTRY_SYNC';
      case 'bundle-sync':
        return 'BUNDLE_SYNC';
      // Handle uppercase underscore format (from GraphQL enum)
      case 'FULL_SYNC':
        return 'FULL_SYNC';
      case 'GROUP_SYNC':
        return 'GROUP_SYNC';
      case 'COUNTRY_SYNC':
        return 'COUNTRY_SYNC';
      case 'BUNDLE_SYNC':
        return 'BUNDLE_SYNC';
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  };

  // Create a sync job in the database
  const dbJob = await syncJobRepository.createJob({
    jobType: transformJobType(type),
    priority: job.opts.priority === 1 ? 'high' : 'normal',
    bundleGroup: (type === 'group-sync' || type === 'GROUP_SYNC') ? job.data.bundleGroup : undefined,
    countryId: (type === 'country-sync' || type === 'COUNTRY_SYNC') ? job.data.countryId : undefined,
    metadata: {
      bullmqJobId: job.id,
      ...job.data.metadata,
    },
  });

  try {
    switch (type) {
      case 'full-sync':
      case 'FULL_SYNC':
        await catalogSyncService.performFullSync(dbJob.id);
        return { 
          success: true, 
          type,
          dbJobId: dbJob.id,
        };

      case 'group-sync':
      case 'GROUP_SYNC':
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
          type,
          bundleGroup: job.data.bundleGroup,
          result: groupResult,
          dbJobId: dbJob.id,
        };

      case 'country-sync':
      case 'COUNTRY_SYNC':
        await catalogSyncService.syncCountryBundles(
          job.data.countryId,
          dbJob.id
        );
        return {
          success: true,
          type,
          countryId: job.data.countryId,
          dbJobId: dbJob.id,
        };

      case 'bundle-sync':
      case 'BUNDLE_SYNC':
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
export const catalogSyncWorker = new Worker<any>(
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
    stalledInterval: 30000, // 30 seconds
    maxStalledCount: 3,
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