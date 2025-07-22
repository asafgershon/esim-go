-- Migration: User roles security improvement
-- This migration documents the change from user_metadata to app_metadata for roles
-- 
-- IMPORTANT: This migration requires manual steps:
-- 1. Run the Node.js script: `node scripts/migrate-user-roles.js`
-- 2. The backend code now checks app_metadata first, then user_metadata for backward compatibility
--
-- Benefits:
-- - Roles in app_metadata are admin-controlled (users cannot modify their own roles)
-- - Roles in user_metadata are user-controlled (security risk)
-- - Backward compatibility is maintained during transition period

-- No SQL changes needed - the migration is handled by:
-- 1. Node.js script for data migration
-- 2. Backend code changes to read from app_metadata first

SELECT 'User roles migration prepared - run Node.js script to complete' as status;