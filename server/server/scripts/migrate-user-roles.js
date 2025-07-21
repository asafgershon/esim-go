#!/usr/bin/env node

/**
 * Migration script to move user roles from user_metadata to app_metadata
 * This ensures roles are admin-controlled and cannot be modified by users
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function migrateUserRoles() {
  try {
    console.log('🚀 Starting user roles migration...');
    
    // Get all users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    console.log(`📋 Found ${users.length} users to check`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      const userRole = user.user_metadata?.role;
      const appRole = user.app_metadata?.role;
      
      // Skip if no role in user_metadata or already has role in app_metadata
      if (!userRole) {
        skippedCount++;
        continue;
      }
      
      if (appRole) {
        console.log(`⏭️  User ${user.email} already has role in app_metadata: ${appRole}`);
        skippedCount++;
        continue;
      }
      
      // Validate role
      const validRoles = ['USER', 'ADMIN', 'PARTNER'];
      if (!validRoles.includes(userRole)) {
        console.log(`⚠️  User ${user.email} has invalid role: ${userRole}, skipping`);
        skippedCount++;
        continue;
      }
      
      try {
        // Update user to move role to app_metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          app_metadata: {
            ...user.app_metadata,
            role: userRole
          }
        });
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`✅ Migrated user ${user.email}: ${userRole}`);
        migratedCount++;
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total: ${users.length}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some users failed to migrate. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateUserRoles();