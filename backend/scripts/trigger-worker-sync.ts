#!/usr/bin/env node

const GRAPHQL_ENDPOINT = 'http://localhost:8080/graphql';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3lqa3prd3ptamp1cnp2Y3h5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc4NjI2NCwiZXhwIjoyMDY3MzYyMjY0fQ.xHiSzD7Z5EC3UR8YGDaKz_z_srs3xhWMsF2KTcpnsrI';

// Use triggerCatalogSync instead of syncCatalog
const mutation = `
  mutation TriggerCatalogSync($params: TriggerSyncParams!) {
    triggerCatalogSync(params: $params) {
      success
      jobId
      message
      error
    }
  }
`;

const variables = {
  params: {
    type: 'FULL_SYNC',
    priority: 'high',
    force: true
  }
};

async function triggerSync() {
  console.log('🚀 Triggering catalog sync via workers...\n');
  console.log('📝 Using triggerCatalogSync mutation (queues to BullMQ)\n');
  
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status}`);
      console.error('Response:', responseText);
      return;
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON:', responseText);
      return;
    }
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2));
      return;
    }

    if (result.data?.triggerCatalogSync) {
      const syncResult = result.data.triggerCatalogSync;
      if (syncResult.success) {
        console.log('✅ Catalog sync job queued successfully!');
        console.log(`   Job ID: ${syncResult.jobId}`);
        console.log(`   Message: ${syncResult.message}`);
        console.log('\n📝 The worker should now pick up this job and start processing.');
        console.log('   Check the worker logs for progress updates.');
        console.log('\n💡 Monitor the queue with: bun scripts/monitor-queue.ts');
      } else {
        console.error('❌ Failed to trigger sync:', syncResult.error);
      }
    } else {
      console.error('❌ Unexpected response structure:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error triggering sync:', error);
  }
}

// Show usage info
console.log('ℹ️  This script uses the triggerCatalogSync mutation which:');
console.log('   1. Creates a job in the catalog_sync_jobs table');
console.log('   2. Adds a job to the BullMQ queue for workers to process');
console.log('   3. Workers pick up and process the job asynchronously\n');

triggerSync();