#!/usr/bin/env bun
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function checkDatabaseConnection() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    console.log('Checking Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Service Key exists:', !!supabaseServiceKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test connection by querying catalog_bundles
    const { data: bundles, error: bundlesError } = await supabase
      .from('catalog_bundles')
      .select('count', { count: 'exact' })
      .limit(0);

    if (bundlesError) {
      console.error('Error querying catalog_bundles:', bundlesError);
    } else {
      console.log('catalog_bundles count:', bundles);
    }

    // Test connection by querying catalog_metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('catalog_metadata')
      .select('*')
      .limit(1)
      .single();

    if (metadataError) {
      console.error('Error querying catalog_metadata:', metadataError);
    } else {
      console.log('catalog_metadata:', metadata);
    }

    // Test connection by querying catalog_sync_jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('catalog_sync_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (jobsError) {
      console.error('Error querying catalog_sync_jobs:', jobsError);
    } else {
      console.log('Recent sync jobs:', jobs?.map(j => ({ id: j.id, status: j.status, type: j.type })));
    }

  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

checkDatabaseConnection();