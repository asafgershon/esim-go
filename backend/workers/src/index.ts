import { createLogger } from '@hiilo/utils';
import { config } from './config/index.js';
import { catalogSyncWorker } from './workers/catalog-sync.worker.js';
import { startScheduler, stopScheduler } from './workers/scheduler.worker.js';
import { checkSupabaseConnection } from './services/supabase.service.js';
import { catalogSyncQueueManager } from './queues/catalog-sync.queue.js';
import { startHealthServer } from './health.js';

const logger = createLogger({ 
  component: 'WorkerMain',
  operationType: 'startup' 
});

async function start() {
  logger.info('Starting eSIM Go catalog sync workers', {
    nodeEnv: config.nodeEnv,
    logLevel: config.logLevel,
    concurrency: config.worker.concurrency,
  });

  try {
    // Check Supabase connection
    const supabaseHealthy = await checkSupabaseConnection();
    if (!supabaseHealthy) {
      throw new Error('Supabase connection failed');
    }

    // Start the catalog sync worker
    logger.info('Starting catalog sync worker');
    
    // Start the scheduler
    startScheduler();
    
    // Start health check server
    startHealthServer(config.worker.port);

    // Log initial queue stats
    const stats = await catalogSyncQueueManager.getQueueStats();
    logger.info('Initial queue stats', stats);

    logger.info('All workers started successfully');

    // Handle shutdown gracefully
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      // Stop scheduler
      stopScheduler();
      
      // Close worker
      await catalogSyncWorker.close();
      
      // Close queue connections
      await catalogSyncQueueManager.close();
      
      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Keep the process alive
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', reason as Error, {
        promise: String(promise),
      });
      shutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start workers', error as Error);
    process.exit(1);
  }
}

// Check if manual sync is requested
const args = process.argv.slice(2);
if (args.includes('--sync') || args.includes('sync')) {
  logger.info('Manual sync requested, triggering catalog sync');
  
  (async () => {
    try {
      // Check Supabase connection
      const supabaseHealthy = await checkSupabaseConnection();
      if (!supabaseHealthy) {
        throw new Error('Supabase connection failed');
      }
      
      // Add a manual sync job
      const job = await catalogSyncQueueManager.addFullSyncJob('manual');
      logger.info('Manual sync job created', { jobId: job.id });
      
      // Give it a moment to be picked up
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check job status
      const stats = await catalogSyncQueueManager.getQueueStats();
      logger.info('Queue stats after manual sync', stats);
      catalogSyncQueueManager.listen((event, job) => {
        if (event === 'completed') {
          logger.info('Manual sync job completed', { jobId: job.jobId });
          process.exit(0);
        }
      });
    } catch (error) {
      logger.error('Failed to trigger manual sync', error as Error);
      process.exit(1);
    }
  })();
} else if (args.includes('--clean') || args.includes('clean')) {
  logger.info('Cleaning up old jobs');
  await catalogSyncQueueManager.cleanOldJobs();
  process.exit(0);
} else {
  // Start the workers normally
  start();
}