-- Add tenant_type to tenants table
ALTER TABLE public.tenants 
ADD COLUMN tenant_type VARCHAR(20) NOT NULL DEFAULT 'standard';

-- Add a constraint to ensure valid tenant types
ALTER TABLE public.tenants 
ADD CONSTRAINT valid_tenant_type 
CHECK (tenant_type IN ('standard', 'master'));

-- Create a function to check if current user is a master tenant admin
CREATE OR REPLACE FUNCTION is_master_tenant_admin()
RETURNS BOOLEAN AS $$
DECLARE 
    is_master BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM user_tenants ut
        JOIN tenants t ON ut.tenant_id = t.id
        WHERE t.tenant_type = 'master' 
        AND ut.user_id = auth.uid()
    ) INTO is_master;
    
    RETURN COALESCE(is_master, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update tenants RLS policy to allow master tenant full access
DROP POLICY IF EXISTS "Master tenants can manage all tenants" ON public.tenants;
CREATE POLICY "Master tenants can manage all tenants"
ON public.tenants
FOR ALL 
USING (is_master_tenant_admin());

-- Update user_tenants RLS policy 
DROP POLICY IF EXISTS "Master tenants can manage all user_tenants" ON public.user_tenants;
CREATE POLICY "Master tenants can manage all user_tenants"
ON public.user_tenants
FOR ALL 
USING (is_master_tenant_admin());

-- Insert initial master tenant
INSERT INTO public.tenants (
    slug, 
    name, 
    img_url, 
    tenant_type
) VALUES (
    'esim_go_master', 
    'eSIM Go Master Tenant', 
    'https://example.com/master-tenant-logo.png', 
    'master'
) ON CONFLICT (slug) DO NOTHING;

-- Create a role for master tenant admin with elevated privileges
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'master_tenant_admin') THEN
    CREATE ROLE master_tenant_admin;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO master_tenant_admin;
    -- Add more granular privileges as needed
  END IF;
END $$;

-- Revoke and manage access for master tenant role
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON SCHEMA public TO master_tenant_admin;