#!/usr/bin/env bun
import { config } from 'dotenv';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Load environment variables
config();

async function checkQueueStatus() {
  try {
    console.log('Checking BullMQ queue status...');
    
    // Create Redis connection (same config as server/workers)
    const redis = new IORedis({
      host: 'localhost',
      port: 6379,
      password: 'mypassword',
      maxRetriesPerRequest: null,
    });

    // Create the same queue as used by server and workers
    const catalogQueue = new Queue('catalog-sync', { connection: redis });

    // Get detailed queue status
    const waiting = await catalogQueue.getWaiting();
    const active = await catalogQueue.getActive();
    const completed = await catalogQueue.getCompleted();
    const failed = await catalogQueue.getFailed();

    console.log('\n=== QUEUE STATUS ===');
    console.log(`Waiting: ${waiting.length}`);
    console.log(`Active: ${active.length}`);
    console.log(`Completed: ${completed.length}`);
    console.log(`Failed: ${failed.length}`);

    // Show details of each category
    if (waiting.length > 0) {
      console.log('\n=== WAITING JOBS ===');
      for (const job of waiting) {
        console.log(`Job ${job.id}: ${job.name} - ${JSON.stringify(job.data)}`);
      }
    }

    if (active.length > 0) {
      console.log('\n=== ACTIVE JOBS ===');
      for (const job of active) {
        console.log(`Job ${job.id}: ${job.name} - ${JSON.stringify(job.data)}`);
      }
    }

    if (failed.length > 0) {
      console.log('\n=== FAILED JOBS ===');
      for (const job of failed) {
        console.log(`Job ${job.id}: ${job.name} - Failed: ${job.failedReason}`);
        console.log(`Data: ${JSON.stringify(job.data)}`);
      }
    }

    if (completed.length > 0) {
      console.log('\n=== COMPLETED JOBS ===');
      for (const job of completed.slice(-5)) { // Show last 5
        console.log(`Job ${job.id}: ${job.name} - Return: ${JSON.stringify(job.returnvalue)}`);
      }
    }

    // Clean up
    await redis.quit();

  } catch (error) {
    console.error('Failed to check queue status:', error);
  }
}

checkQueueStatus();