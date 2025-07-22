#!/usr/bin/env bun
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Load environment variables
config();

async function testDirectQueue() {
  console.log('Testing direct BullMQ and database insertion...');

  try {
    // Test 1: Direct database insertion
    console.log('\n1. Testing database insertion...');
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://zbkvazkmftilmqcvttak.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const testJobId = crypto.randomUUID();
    
    const { data: syncJob, error } = await supabase
      .from('catalog_sync_jobs')
      .insert({
        id: testJobId,
        job_type: 'full-sync',
        status: 'pending',
        priority: 'normal',
        metadata: {
          test: true,
          triggeredBy: 'test-script'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Database insertion failed:', error);
      return;
    }

    console.log('✅ Database job created:', syncJob.id);

    // Test 2: Direct BullMQ queue
    console.log('\n2. Testing BullMQ queue...');
    
    const redis = new IORedis({
      host: 'localhost',
      port: 6379,
      password: 'mypassword',
      maxRetriesPerRequest: null,
    });

    const catalogQueue = new Queue('catalog-sync', { connection: redis });

    const bullmqJob = await catalogQueue.add(
      'catalog-sync-full-sync',
      {
        type: 'full-sync',
        metadata: {
          dbJobId: syncJob.id,
          test: true,
          triggeredBy: 'test-script'
        }
      },
      {
        priority: 5, // normal priority
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    console.log('✅ BullMQ job created:', bullmqJob.id);

    // Test 3: Check if job appears in the queue
    console.log('\n3. Checking queue status...');
    const waiting = await catalogQueue.getWaiting();
    const active = await catalogQueue.getActive();
    const completed = await catalogQueue.getCompleted();
    const failed = await catalogQueue.getFailed();

    console.log('Queue status:');
    console.log(`  Waiting: ${waiting.length}`);
    console.log(`  Active: ${active.length}`);
    console.log(`  Completed: ${completed.length}`);
    console.log(`  Failed: ${failed.length}`);

    if (waiting.length > 0) {
      console.log('✅ Job is in waiting queue');
    }

    // Clean up
    await redis.quit();

    // Test 4: Check recent jobs in database
    console.log('\n4. Checking recent database jobs...');
    const { data: recentJobs } = await supabase
      .from('catalog_sync_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('Recent jobs:');
    recentJobs?.forEach(job => {
      console.log(`  ${job.id}: ${job.job_type} - ${job.status} (${job.created_at})`);
    });

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDirectQueue();