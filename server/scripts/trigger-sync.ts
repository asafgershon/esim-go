#!/usr/bin/env node

const GRAPHQL_ENDPOINT = 'http://localhost:5001/graphql';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IngrNVFCMkZZbGhZTitUZmQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Rna3lqa3prd3ptamp1cnp2Y3h5LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhZTBjNzkzNS04MWJjLTRjYTctYTQ0Yy01MzY2YmU2ODZlMDUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUzMjQ5Njg3LCJpYXQiOjE3NTMyNDYwODcsImVtYWlsIjoieWFyaW5zYXNzb24yQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiYXBwbGUiLCJwcm92aWRlcnMiOlsiYXBwbGUiLCJnb29nbGUiXSwicm9sZSI6IkFETUlOIn0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0paNzlpellHMHp2TmY2OTg3UjhTbUhFZG9KX1dXczlXY3B5SklNX09IVFBVbmdMZkxZMEE9czk2LWMiLCJjdXN0b21fY2xhaW1zIjp7ImF1dGhfdGltZSI6MTc1MjQ3ODg2Nn0sImVtYWlsIjoieWFyaW5zYXNzb24yQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJZYXJpbiBTYXNzb24iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiWWFyaW4gU2Fzc29uIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSlo3OWl6WUcwenZOZjY5ODdSOFNtSEVkb0pfV1dzOVdjcHlKSU1fT0hUUFVuZ0xmTFkwQT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTExNzgxNjU5NjAzMTEyNjE0ODQwIiwicm9sZSI6IkFETUlOIiwic3ViIjoiMTExNzgxNjU5NjAzMTEyNjE0ODQwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NTMxOTI3NzR9XSwic2Vzc2lvbl9pZCI6IjFhOGY4MGRlLWJlYTQtNDU2NS1hOGIxLWE3Yzg2NTE2M2YwNSIsImlzX2Fub255bW91cyI6ZmFsc2V9.cRq3lorN5L84-6mtcq8DBV6CVmU1t396fdzpUbf0_qw';

const mutation = `
  mutation TriggerCatalogSync($params: CatalogSyncParams!) {
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
  console.log('🚀 Triggering catalog sync...\n');
  
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
      return;
    }

    if (result.data?.triggerCatalogSync) {
      const syncResult = result.data.triggerCatalogSync;
      if (syncResult.success) {
        console.log('✅ Catalog sync triggered successfully!');
        console.log(`   Job ID: ${syncResult.jobId}`);
        console.log(`   Message: ${syncResult.message}`);
        console.log('\n📝 The worker should now pick up this job and start processing.');
        console.log('   Check the worker logs for progress updates.');
      } else {
        console.error('❌ Failed to trigger sync:', syncResult.error);
      }
    }
  } catch (error) {
    console.error('❌ Error triggering sync:', error);
  }
}

triggerSync();