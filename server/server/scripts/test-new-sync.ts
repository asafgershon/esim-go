#!/usr/bin/env bun
import { config } from 'dotenv';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Load environment variables
config();

async function triggerTestSync() {
  try {
    console.log('Triggering test catalog sync...');
    
    // Create Redis connection
    const redis = new IORedis({
      host: 'localhost',
      port: 6379,
      password: 'mypassword',
      maxRetriesPerRequest: null,
    });

    // Create the queue
    const catalogQueue = new Queue('catalog-sync', { connection: redis });

    // Add a test job
    const job = await catalogQueue.add('full-sync', {
      type: 'full-sync',
      userId: 'test-user',
      priority: 'high'
    });

    console.log(`Added job ${job.id} to the queue`);
    
    // Check queue stats
    const stats = await catalogQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
    console.log('Queue stats:', stats);

    // Clean up
    await redis.quit();

  } catch (error) {
    console.error('Failed to trigger sync:', error);
  }
}

triggerTestSync();