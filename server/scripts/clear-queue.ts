#!/usr/bin/env bun
import { config } from 'dotenv';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Load environment variables
config();

async function clearStaleWorkers() {
  let redis: IORedis | null = null;
  
  try {
    console.log('🧹 Starting BullMQ catalog-sync queue cleanup...\n');
    
    // Create Redis connection
    redis = new IORedis({
      host: 'localhost',
      port: 6379,
      password: 'mypassword',
      maxRetriesPerRequest: null,
    });

    // Create the catalog-sync queue
    const catalogQueue = new Queue('catalog-sync', { connection: redis });

    // Get current queue stats
    const counts = await catalogQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused'
    );

    console.log('📊 Queue status before cleanup:');
    console.log(`  - Waiting: ${counts.waiting}`);
    console.log(`  - Active: ${counts.active}`);
    console.log(`  - Completed: ${counts.completed}`);
    console.log(`  - Failed: ${counts.failed}`);
    console.log(`  - Delayed: ${counts.delayed}`);
    console.log(`  - Paused: ${counts.paused}`);
    console.log(`  - Total: ${Object.values(counts).reduce((a, b) => a + b, 0)}\n`);

    // Check for stalled jobs (these are active jobs that have exceeded their lock duration)
    // In BullMQ, stalled jobs are detected during worker operation
    console.log(`🔍 Checking for stalled/stuck jobs...\n`);

    // Counters for reporting
    let removedStalled = 0;
    let removedFailed = 0;
    let removedWaiting = 0;
    let removedActive = 0;
    let removedCompleted = 0;
    let removedDelayed = 0;

    // 1. Check active jobs for potential stalled ones
    const activeJobs = await catalogQueue.getActive();
    if (activeJobs.length > 0) {
      console.log('🚨 Checking active jobs for stalled workers...');
      for (const job of activeJobs) {
        const jobAge = Date.now() - job.timestamp;
        const isOld = jobAge > 5 * 60 * 1000; // Consider jobs older than 5 minutes as potentially stalled
        
        if (isOld) {
          console.log(`  ⚠️  Found potentially stalled job ${job.id} (${job.name}) - Age: ${Math.round(jobAge / 1000)}s`);
          removedStalled++;
        }
      }
      
      if (removedStalled > 0) {
        console.log(`  📝 Note: ${removedStalled} active jobs appear to be stalled (older than 5 minutes)`);
      }
    }

    // 2. Clean up failed jobs
    const failedJobs = await catalogQueue.getFailed();
    if (failedJobs.length > 0) {
      console.log('\n❌ Removing failed jobs...');
      for (const job of failedJobs) {
        try {
          await job.remove();
          removedFailed++;
          console.log(`  ✅ Removed failed job ${job.id} (${job.name}) - Reason: ${job.failedReason}`);
        } catch (err) {
          console.error(`  ❌ Failed to remove failed job ${job.id}:`, err);
        }
      }
    }

    // 3. Clean up waiting jobs
    const waitingJobs = await catalogQueue.getWaiting();
    if (waitingJobs.length > 0) {
      console.log('\n⏳ Removing waiting jobs...');
      for (const job of waitingJobs) {
        try {
          await job.remove();
          removedWaiting++;
          console.log(`  ✅ Removed waiting job ${job.id} (${job.name})`);
        } catch (err) {
          console.error(`  ❌ Failed to remove waiting job ${job.id}:`, err);
        }
      }
    }

    // 4. Clean up active/stalled jobs (be careful with these)
    if (activeJobs.length > 0) {
      console.log('\n⚡ Removing active/stalled jobs (forcing cleanup)...');
      for (const job of activeJobs) {
        try {
          await job.remove();
          removedActive++;
          console.log(`  ✅ Removed active job ${job.id} (${job.name})`);
        } catch (err) {
          console.error(`  ❌ Failed to remove active job ${job.id}:`, err);
        }
      }
    }

    // 5. Clean up delayed jobs
    const delayedJobs = await catalogQueue.getDelayed();
    if (delayedJobs.length > 0) {
      console.log('\n⏰ Removing delayed jobs...');
      for (const job of delayedJobs) {
        try {
          await job.remove();
          removedDelayed++;
          console.log(`  ✅ Removed delayed job ${job.id} (${job.name})`);
        } catch (err) {
          console.error(`  ❌ Failed to remove delayed job ${job.id}:`, err);
        }
      }
    }

    // 6. Optionally clean completed jobs (usually you want to keep some for history)
    const completedJobs = await catalogQueue.getCompleted();
    if (completedJobs.length > 100) { // Keep last 100 completed jobs
      console.log('\n✅ Cleaning old completed jobs (keeping last 100)...');
      const jobsToRemove = completedJobs.slice(0, completedJobs.length - 100);
      for (const job of jobsToRemove) {
        try {
          await job.remove();
          removedCompleted++;
        } catch (err) {
          console.error(`  ❌ Failed to remove completed job ${job.id}:`, err);
        }
      }
      console.log(`  ✅ Removed ${removedCompleted} old completed jobs`);
    }

    // Get final queue stats
    const finalCounts = await catalogQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused'
    );

    // Summary report
    console.log('\n📊 Cleanup Summary:');
    console.log(`  - Stalled jobs removed: ${removedStalled}`);
    console.log(`  - Failed jobs removed: ${removedFailed}`);
    console.log(`  - Waiting jobs removed: ${removedWaiting}`);
    console.log(`  - Active jobs removed: ${removedActive}`);
    console.log(`  - Delayed jobs removed: ${removedDelayed}`);
    console.log(`  - Old completed jobs removed: ${removedCompleted}`);
    console.log(`  - Total removed: ${removedStalled + removedFailed + removedWaiting + removedActive + removedDelayed + removedCompleted}`);

    console.log('\n📊 Queue status after cleanup:');
    console.log(`  - Waiting: ${finalCounts.waiting}`);
    console.log(`  - Active: ${finalCounts.active}`);
    console.log(`  - Completed: ${finalCounts.completed}`);
    console.log(`  - Failed: ${finalCounts.failed}`);
    console.log(`  - Delayed: ${finalCounts.delayed}`);
    console.log(`  - Paused: ${finalCounts.paused}`);
    console.log(`  - Total: ${Object.values(finalCounts).reduce((a, b) => a + b, 0)}`);

    // Clean up workers and locks
    console.log('\n🔧 Cleaning up worker metadata...');
    const workers = await catalogQueue.getWorkers();
    console.log(`  Found ${workers.length} registered workers`);

    // Obliterate the queue if requested (nuclear option)
    const args = process.argv.slice(2);
    if (args.includes('--obliterate')) {
      console.log('\n☢️  OBLITERATING ENTIRE QUEUE (--obliterate flag detected)...');
      await catalogQueue.obliterate({ force: true });
      console.log('  ✅ Queue obliterated successfully');
    }

    console.log('\n✅ Queue cleanup completed successfully!');

  } catch (error) {
    console.error('\n❌ Failed to clear queue:', error);
    process.exit(1);
  } finally {
    // Clean up Redis connection
    if (redis) {
      await redis.quit();
    }
  }
}

// Run the cleanup
clearStaleWorkers();