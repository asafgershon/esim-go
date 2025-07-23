import { createClient } from '@supabase/supabase-js';

// Read from env or use defaults
const supabaseUrl = process.env.SUPABASE_URL || 'https://dgkyjkzkwzmjjurzvcxy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3lqa3prd3ptamp1cnp2Y3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA0MjY4MDEsImV4cCI6MjAzNjAwMjgwMX0.CUQ1ci6Ixg3aZMqHN7EvmQSz_WY5QRZPQ2wVnhvJxIk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentJobs() {
  console.log('🔍 Checking recent catalog sync jobs...\n');

  const { data: jobs, error } = await supabase
    .from('catalog_sync_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching jobs:', error);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('No sync jobs found in the database.');
    return;
  }

  console.log(`Found ${jobs.length} recent jobs:\n`);
  
  jobs.forEach((job: any, idx: number) => {
    const createdAt = new Date(job.created_at);
    const now = new Date();
    const ageMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 1000 / 60);
    
    console.log(`${idx + 1}. Job ${job.id}`);
    console.log(`   Type: ${job.job_type}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Created: ${createdAt.toLocaleString()} (${ageMinutes} minutes ago)`);
    console.log(`   Priority: ${job.priority || 'normal'}`);
    
    if (job.metadata?.bullmqJobId) {
      console.log(`   BullMQ Job ID: ${job.metadata.bullmqJobId}`);
    } else {
      console.log(`   ⚠️  No BullMQ Job ID found - job may not have been queued!`);
    }
    
    if (job.error_message) {
      console.log(`   Error: ${job.error_message}`);
    }
    
    console.log('');
  });
}

checkRecentJobs();