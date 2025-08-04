import { createServer } from 'http';
import { catalogSyncQueueManager } from './queues/catalog-sync.queue.js';
import { checkSupabaseConnection } from './services/supabase.service.js';
import { createLogger } from '@hiilo/utils';
import { config } from './config/index.js';

const logger = createLogger({ 
  component: 'HealthCheck',
  operationType: 'health' 
});

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    redis: boolean;
    supabase: boolean;
    queue: boolean;
  };
  queue?: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  error?: string;
}

/**
 * Start health check HTTP server
 */
export function startHealthServer(port: number = 3000): void {
  const server = createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      try {
        // Check Redis connection via queue stats
        let redisHealthy = false;
        let queueStats;
        try {
          queueStats = await catalogSyncQueueManager.getQueueStats();
          redisHealthy = true;
        } catch (error) {
          logger.error('Redis health check failed', error as Error);
        }

        // Check Supabase connection
        const supabaseHealthy = await checkSupabaseConnection();

        // Overall health
        const isHealthy = redisHealthy && supabaseHealthy;

        const healthStatus: HealthStatus = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            redis: redisHealthy,
            supabase: supabaseHealthy,
            queue: redisHealthy,
          },
          queue: queueStats,
        };

        res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthStatus, null, 2));
      } catch (error) {
        const errorStatus: HealthStatus = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            redis: false,
            supabase: false,
            queue: false,
          },
          error: (error as Error).message,
        };

        logger.error('Health check error', error as Error);
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorStatus, null, 2));
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    logger.info(`Health check server started on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      logger.info('Health check server closed');
    });
  });

  process.on('SIGINT', () => {
    server.close(() => {
      logger.info('Health check server closed');
    });
  });
}