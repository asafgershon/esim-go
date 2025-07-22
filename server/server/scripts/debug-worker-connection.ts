#!/usr/bin/env bun
import { config } from 'dotenv';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Load environment variables  
config();

async function debugWorkerConnection() {
  try {
    console.log('Debugging worker connection to Redis...');
    
    // Create Redis connection
    const redis = new IORedis({
      host: 'localhost',
      port: 6379,
      password: 'mypassword', 
      maxRetriesPerRequest: null,
    });

    // Test Redis connection
    console.log('Testing Redis connection...');
    const pong = await redis.ping();
    console.log('Redis ping response:', pong);

    // Create the queue
    const catalogQueue = new Queue('catalog-sync', { connection: redis });

    // Check queue stats
    const stats = await catalogQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
    console.log('Current queue stats:', stats);

    // Get waiting jobs
    const waitingJobs = await catalogQueue.getWaiting();
    console.log(`Waiting jobs (${waitingJobs.length}):`);
    for (const job of waitingJobs) {
      console.log(`  - Job ${job.id}: ${job.name} - ${JSON.stringify(job.data)}`);
    }

    // Get active jobs
    const activeJobs = await catalogQueue.getActive();
    console.log(`Active jobs (${activeJobs.length}):`);
    for (const job of activeJobs) {
      console.log(`  - Job ${job.id}: ${job.name} - ${JSON.stringify(job.data)}`);
    }

    // Create a test worker to see if it can connect
    console.log('\nCreating test worker...');
    const worker = new Worker('catalog-sync', async (job) => {
      console.log(`Test worker processing job ${job.id}: ${job.name}`);
      console.log('Job data:', job.data);
      
      // Don't actually process, just log
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { processed: true, test: true };
    }, {
      connection: redis,
      concurrency: 1
    });

    worker.on('completed', (job) => {
      console.log(`Test worker completed job ${job.id}`);
    });

    worker.on('failed', (job, err) => {
      console.log(`Test worker failed job ${job?.id}:`, err.message);
    });

    worker.on('error', (err) => {
      console.log('Test worker error:', err);
    });

    console.log('Test worker created. Waiting 30 seconds to see if it processes jobs...');
    
    // Wait for 30 seconds to see if worker processes jobs
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('Closing test worker...');
    await worker.close();
    await redis.quit();

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugWorkerConnection();