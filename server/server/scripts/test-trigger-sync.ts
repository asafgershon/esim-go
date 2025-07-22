#!/usr/bin/env bun
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Test triggerCatalogSync mutation
async function testTriggerSync() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  console.log('Testing triggerCatalogSync mutation...');
  
  // Create a GraphQL query
  const query = `
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
      type: 'FULL_SYNC',  // Use correct enum value
      priority: 'normal',
      force: true
    }
  };

  // Use your auth token (replace with actual token)
  const authToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IngrNVFCMkZZbGhZTitUZmQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Rna3lqa3prd3ptamp1cnp2Y3h5LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhZTBjNzkzNS04MWJjLTRjYTctYTQ0Yy01MzY2YmU2ODZlMDUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUzMTk5ODc3LCJpYXQiOjE3NTMxOTYyNzcsImVtYWlsIjoieWFyaW5zYXNzb24yQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiYXBwbGUiLCJwcm92aWRlcnMiOlsiYXBwbGUiLCJnb29nbGUiXSwicm9sZSI6IkFETUlOIn0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0paNzlpellHMHp2TmY2OTg3UjhTbUhFZG9KX1dXczlXY3B5SklNX09IVFBVbmdMZkxZMEE9czk2LWMiLCJjdXN0b21fY2xhaW1zIjp7ImF1dGhfdGltZSI6MTc1MjQ3ODg2Nn0sImVtYWlsIjoieWFyaW5zYXNzb24yQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJZYXJpbiBTYXNzb24iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiWWFyaW4gU2Fzc29uIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSlo3OWl6WUcwenZOZjY5ODdSOFNtSEVkb0pfV1dzOVdjcHlKSU1fT0hUUFVuZ0xmTFkwQT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTExNzgxNjU5NjAzMTEyNjE0ODQwIiwicm9sZSI6IkFETUlOIiwic3ViIjoiMTExNzgxNjU5NjAzMTEyNjE0ODQwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NTMxOTI3NzR9XSwic2Vzc2lvbl9pZCI6IjFhOGY4MGRlLWJlYTQtNDU2NS1hOGIxLWE3Yzg2NTE2M2YwNSIsImlzX2Fub255bW91cyI6ZmFsc2V9.KmvcdDn5G0EseUJM7JgL5-KJJO-5zWbxv_r0H7D6DQI';

  try {
    const response = await fetch('http://localhost:5001/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
    } else {
      console.log('Success:', JSON.stringify(result.data, null, 2));
    }

    // Check if a job was created in the database
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: jobs, error } = await supabase
      .from('catalog_sync_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('\nRecent sync jobs:');
    console.log(jobs || error);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTriggerSync();