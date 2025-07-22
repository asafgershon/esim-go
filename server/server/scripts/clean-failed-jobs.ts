#!/usr/bin/env bun
import { config } from 'dotenv';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Load environment variables
config();

async function cleanFailedJobs() {
  try {
    console.log('Cleaning failed BullMQ jobs...');
    
    // Create Redis connection (same config as server/workers)
    const redis = new IORedis({
      host: 'localhost',
      port: 6379,
      password: 'mypassword',
      maxRetriesPerRequest: null,
    });

    // Create the same queue as used by server and workers
    const catalogQueue = new Queue('catalog-sync', { connection: redis });

    // Clean failed jobs
    const failedJobs = await catalogQueue.getFailed();
    console.log(`Found ${failedJobs.length} failed jobs`);

    for (const job of failedJobs) {
      console.log(`Removing failed job ${job.id}: ${job.name}`);
      await job.remove();
    }

    console.log(`Cleaned ${failedJobs.length} failed jobs`);

    // Clean up
    await redis.quit();

  } catch (error) {
    console.error('Failed to clean failed jobs:', error);
  }
}

cleanFailedJobs();