import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  password: 'mypassword',
  maxRetriesPerRequest: null,
});

const queue = new Queue('catalog-sync', { connection });
const queueEvents = new QueueEvents('catalog-sync', { connection });

console.log('📊 Monitoring catalog-sync queue...\n');

// Show initial status
async function showStatus() {
  const counts = await queue.getJobCounts();
  console.log(`[${new Date().toLocaleTimeString()}] Queue Status:`);
  console.log(`  - Waiting: ${counts.waiting}`);
  console.log(`  - Active: ${counts.active}`);
  console.log(`  - Completed: ${counts.completed}`);
  console.log(`  - Failed: ${counts.failed}`);
  console.log(`  - Delayed: ${counts.delayed}`);
  console.log('---');
}

// Monitor events
queueEvents.on('waiting', ({ jobId }) => {
  console.log(`⏳ Job ${jobId} is waiting`);
});

queueEvents.on('active', ({ jobId, prev }) => {
  console.log(`🔄 Job ${jobId} is active (was ${prev})`);
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`✅ Job ${jobId} completed:`, returnvalue);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.log(`❌ Job ${jobId} failed:`, failedReason);
});

queueEvents.on('progress', ({ jobId, data }) => {
  console.log(`📈 Job ${jobId} progress:`, data);
});

// Show status every 5 seconds
showStatus();
setInterval(showStatus, 5000);

console.log('\nPress Ctrl+C to stop monitoring...\n');

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down monitor...');
  await queueEvents.close();
  await queue.close();
  await connection.quit();
  process.exit(0);
});