import { Worker, Job } from 'bullmq';
import { createLogger, withPerformanceLogging } from '@hiilo/utils';
import { config } from '../config/index.js';
import { ESIMGoSyncService } from '../services/esim-go-sync.service.js';
import { MayaSyncService } from '../services/maya-sync.service.js';
import { syncJobRepository } from '../services/supabase.service.js';
import type { CatalogSyncJobData } from '../queues/catalog-sync.queue.js';
import { SyncJobType } from '../generated/types.js';
import { Redis } from 'ioredis';

const logger = createLogger({ 
  component: 'CatalogSyncWorker',
  operationType: 'worker' 
});

// Create service instances for each provider
const esimGoSyncService = new ESIMGoSyncService();
const mayaSyncService = new MayaSyncService();

// Redis connection for the worker
const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  family: 0,
});

await connection.ping().catch((error) => {
  logger.error('Redis connection failed', error);
  process.exit(1);
});

// Transform job type for database
const transformJobType = (type: SyncJobType) => {
  switch (type) {
    case SyncJobType.FullSync:
      return 'FULL_SYNC';
    case SyncJobType.GroupSync:
      return 'GROUP_SYNC';
    case SyncJobType.CountrySync:
      return 'COUNTRY_SYNC';
    case SyncJobType.MetadataSync:
      return 'METADATA_SYNC';
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
};

// Route job to appropriate service based on provider
async function routeToProvider(job: Job<CatalogSyncJobData>, dbJobId: string) {
  const { type, provider } = job.data;
  
  logger.info('Routing job to provider', {
    jobId: job.id,
    provider,
    type,
  });

  // Select the appropriate service based on provider
  const syncService = provider === 'MAYA' ? mayaSyncService : esimGoSyncService;

  switch (type) {
    case SyncJobType.FullSync:
      await syncService.performFullSync(dbJobId);
      return { 
        success: true, 
        type,
        provider,
        dbJobId,
      };

    case SyncJobType.GroupSync:
      if ((provider as any) === 'MAYA') {
        throw new Error('Maya provider does not support group sync');
      }
      const groupResult = await esimGoSyncService.syncBundleGroup(
        job.data.bundleGroup,
        dbJobId
      );
      
      await syncJobRepository.completeJob(dbJobId, {
        bundlesProcessed: groupResult.processed,
        bundlesAdded: groupResult.added,
        bundlesUpdated: groupResult.updated,
        metadata: { errors: groupResult.errors },
      });
      
      return {
        success: true,
        type,
        provider,
        bundleGroup: job.data.bundleGroup,
        result: groupResult,
        dbJobId,
      };

    case SyncJobType.CountrySync:
      await syncService.syncCountryBundles(
        job.data.countryId,
        dbJobId
      );
      return {
        success: true,
        type,
        provider,
        countryId: job.data.countryId,
        dbJobId,
      };

    case SyncJobType.MetadataSync:
      throw new Error('Metadata sync not implemented yet');

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

// Process job based on type and provider
async function processJob(job: Job<CatalogSyncJobData>): Promise<any> {
  const { type, provider } = job.data;

  logger.info('Processing catalog sync job', {
    jobId: job.id,
    type,
    provider,
    attemptsMade: job.attemptsMade,
  });

  // Create a sync job in the database
  const dbJob = await syncJobRepository.createJob({
    job_type: transformJobType(type),
    priority: job.opts.priority === 1 ? 'high' : 'normal',
    bundle_group: type === SyncJobType.GroupSync ? job.data.bundleGroup : undefined,
    country_id: type === SyncJobType.CountrySync ? job.data.countryId : undefined,
    metadata: {
      bullmqJobId: job.id,
      provider,
      ...job.data.metadata,
    },
  });

  try {
    return await routeToProvider(job, dbJob.id);
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
      `process-${job.data.type}-${job.data.provider}`,
      async () => processJob(job),
      {
        jobId: job.id,
        jobType: job.data.type,
        provider: job.data.provider,
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
    provider: job.data.provider,
    returnValue: job.returnvalue,
  });
});

catalogSyncWorker.on('failed', (job, error) => {
  logger.error('Job failed', error, {
    jobId: job?.id,
    jobType: job?.data.type,
    provider: job?.data.provider,
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
  await catalogSyncWorker.close(true);
  await connection.quit();
  process.exit(0);
});