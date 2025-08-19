-- Create user_tenants table for multi-tenancy support
CREATE TABLE public.user_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(slug) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- e.g., 'admin', 'member', 'viewer'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_tenants_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_tenants_modtime
BEFORE UPDATE ON public.user_tenants
FOR EACH ROW
EXECUTE FUNCTION update_user_tenants_modified_column();

-- Enable RLS on user_tenants table
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own tenant associations
CREATE POLICY "Users can see their own tenant associations"
ON public.user_tenants
FOR SELECT
USING (auth.uid() = user_id);

-- Insert a default tenant association for the initial master tenant
INSERT INTO public.user_tenants (user_id, tenant_id, role)
SELECT 
    '1b75e2f5-41a0-4f5f-b285-7e0d9a955f94', 
    'hiilo-master', 
    'admin'
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.user_tenants 
    WHERE user_id = '1b75e2f5-41a0-4f5f-b285-7e0d9a955f94' 
    AND tenant_id = 'hiilo-master'
);