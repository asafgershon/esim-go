#!/usr/bin/env bun
import { config } from 'dotenv';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Load environment variables
config();

async function clearQueue() {
  try {
    console.log('Clearing all BullMQ jobs...');
    
    // Create Redis connection (same config as server/workers)
    const redis = new IORedis({
      host: 'localhost',
      port: 6379,
      password: 'mypassword',
      maxRetriesPerRequest: null,
    });

    // Create the same queue as used by server and workers
    const catalogQueue = new Queue('catalog-sync', { connection: redis });

    // Get current queue stats
    const waiting = await catalogQueue.getWaiting();
    const active = await catalogQueue.getActive();
    const completed = await catalogQueue.getCompleted();
    const failed = await catalogQueue.getFailed();

    console.log(`Queue stats before clearing:`);
    console.log(`  - Waiting: ${waiting.length}`);
    console.log(`  - Active: ${active.length}`);  
    console.log(`  - Completed: ${completed.length}`);
    console.log(`  - Failed: ${failed.length}`);

    // Clean all jobs
    let totalCleaned = 0;

    // Remove waiting jobs
    for (const job of waiting) {
      await job.remove();
      totalCleaned++;
      console.log(`Removed waiting job ${job.id}`);
    }

    // Remove active jobs (be careful with these)
    for (const job of active) {
      await job.remove();
      totalCleaned++;
      console.log(`Removed active job ${job.id}`);
    }

    // Remove completed jobs
    for (const job of completed) {
      await job.remove();
      totalCleaned++;
    }

    // Remove failed jobs
    for (const job of failed) {
      await job.remove();
      totalCleaned++;
    }

    console.log(`Cleared ${totalCleaned} total jobs from the queue`);

    // Verify queue is empty
    const stats = await catalogQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
    console.log(`Queue stats after clearing:`, stats);

    // Clean up
    await redis.quit();

  } catch (error) {
    console.error('Failed to clear queue:', error);
  }
}

clearQueue();