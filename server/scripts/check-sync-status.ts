import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dgkyjkzkwzmjjurzvcxy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSyncStatus() {
  console.log('🔍 Checking catalog sync status...\n');

  // Check catalog_sync_jobs table
  const { data: syncJobs, error: jobsError } = await supabase
    .from('catalog_sync_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (jobsError) {
    console.error('❌ Error fetching sync jobs:', jobsError);
    return;
  }

  console.log('📋 Recent catalog sync jobs:');
  if (syncJobs && syncJobs.length > 0) {
    syncJobs.forEach((job, idx) => {
      console.log(`\n${idx + 1}. Job ID: ${job.id}`);
      console.log(`   Type: ${job.job_type}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);
      console.log(`   Started: ${job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}`);
      console.log(`   Completed: ${job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Not completed'}`);
      console.log(`   Bundles: ${job.bundles_processed || 0} processed, ${job.bundles_added || 0} added, ${job.bundles_updated || 0} updated`);
      if (job.error_message) {
        console.log(`   Error: ${job.error_message}`);
      }
    });
  } else {
    console.log('No sync jobs found.');
  }

  // Check catalog_metadata for lock status
  const { data: metadata, error: metaError } = await supabase
    .from('catalog_metadata')
    .select('*')
    .single();

  if (!metaError && metadata) {
    console.log('\n📊 Catalog Metadata:');
    console.log(`   Last full sync: ${metadata.last_full_sync ? new Date(metadata.last_full_sync).toLocaleString() : 'Never'}`);
    console.log(`   Total bundles: ${metadata.total_bundles || 0}`);
    console.log(`   Bundle groups: ${metadata.bundle_groups?.join(', ') || 'None'}`);
  }

  // Check for any running or pending jobs
  const { data: activeJobs, error: activeError } = await supabase
    .from('catalog_sync_jobs')
    .select('*')
    .in('status', ['pending', 'running', 'in_progress']);

  if (!activeError && activeJobs && activeJobs.length > 0) {
    console.log('\n⚠️  Active/Pending sync jobs found:');
    activeJobs.forEach(job => {
      console.log(`   - ${job.id} (${job.job_type}) - Status: ${job.status}`);
    });
    console.log('\n💡 You may need to clear these jobs or wait for them to complete.');
  } else {
    console.log('\n✅ No active sync jobs found.');
  }

  process.exit(0);
}

checkSyncStatus().catch(console.error);