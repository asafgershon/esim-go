-- Fix the is_master_tenant_admin function to use tenant_slug instead of tenant_id
CREATE OR REPLACE FUNCTION is_master_tenant_admin()
RETURNS BOOLEAN AS $$
DECLARE 
    is_master BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM user_tenants ut
        JOIN tenants t ON ut.tenant_slug = t.slug
        WHERE t.tenant_type = 'master' 
        AND ut.user_id = auth.uid()
    ) INTO is_master;
    
    RETURN COALESCE(is_master, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create a version that checks for a specific user (for server-side checks)
CREATE OR REPLACE FUNCTION is_user_master_tenant_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE 
    is_master BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM user_tenants ut
        JOIN tenants t ON ut.tenant_slug = t.slug
        WHERE t.tenant_type = 'master' 
        AND ut.user_id = check_user_id
    ) INTO is_master;
    
    RETURN COALESCE(is_master, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;