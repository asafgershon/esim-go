import { createLogger } from '@esim-go/utils';
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

// Start the workers
start();