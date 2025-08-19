-- Fix RLS policy for pricing configurations to work with app_metadata roles
-- This addresses the issue where discount configurations cannot be saved

-- Drop the existing policy
DROP POLICY IF EXISTS "Only admins can modify pricing configurations" ON public.pricing_configurations;

-- Create new policy that checks both app_metadata and raw_user_meta_data for backward compatibility
CREATE POLICY "Only admins can modify pricing configurations" ON public.pricing_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_app_meta_data->>'role' = 'ADMIN' OR
                auth.users.raw_user_meta_data->>'role' = 'ADMIN'
            )
        )
    );