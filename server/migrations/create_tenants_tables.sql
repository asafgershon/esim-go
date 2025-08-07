-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    slug VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    img_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create user_tenants junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_slug VARCHAR(255) NOT NULL REFERENCES public.tenants(slug) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, tenant_slug)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_slug ON public.user_tenants(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_tenants_name ON public.tenants(name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tenants_updated_at BEFORE UPDATE ON public.user_tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read tenants they belong to
CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT
    USING (
        slug IN (
            SELECT tenant_slug 
            FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only admins can insert/update/delete tenants
CREATE POLICY "Admins can manage tenants" ON public.tenants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'ADMIN' OR raw_app_meta_data->>'role' = 'ADMIN')
        )
    );

-- Policy: Users can view their own tenant associations
CREATE POLICY "Users can view their tenant associations" ON public.user_tenants
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Only admins can manage user-tenant associations
CREATE POLICY "Admins can manage user-tenant associations" ON public.user_tenants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'ADMIN' OR raw_app_meta_data->>'role' = 'ADMIN')
        )
    );

-- Insert sample tenants (optional - remove in production)
INSERT INTO public.tenants (slug, name, img_url) VALUES 
    ('acme-corp', 'ACME Corporation', 'https://example.com/logos/acme.png'),
    ('tech-startup', 'Tech Startup Inc', 'https://example.com/logos/tech-startup.png'),
    ('global-travels', 'Global Travels', 'https://example.com/logos/global-travels.png')
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions to authenticated users
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT ON public.user_tenants TO authenticated;

-- Grant full permissions to service role (for admin operations)
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.user_tenants TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.tenants IS 'Stores tenant/organization information for multi-tenancy support';
COMMENT ON TABLE public.user_tenants IS 'Junction table for many-to-many relationship between users and tenants';
COMMENT ON COLUMN public.user_tenants.role IS 'Role of the user within the tenant (e.g., member, admin, owner)';