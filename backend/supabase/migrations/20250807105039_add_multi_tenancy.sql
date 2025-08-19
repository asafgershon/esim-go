-- Create tenants table
CREATE TABLE public.tenants (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    img_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_modtime
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insert initial tenant
INSERT INTO public.tenants (slug, name, img_url)
VALUES ('monday', 'Monday', 'https://dapulse-res.cloudinary.com/image/upload/f_auto,q_auto/remote_mondaycom_static/img/monday-logo-x2.png')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all authenticated users
CREATE POLICY "Tenants can be read by authenticated users" 
ON public.tenants 
FOR SELECT 
TO authenticated 
USING (true);

-- Update auth.users to include tenant_id
DO $$
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='tenant_id'
    ) THEN
        ALTER TABLE auth.users 
        ADD COLUMN tenant_id TEXT REFERENCES public.tenants(slug);
    END IF;
END $$;

-- Update specific user's tenant
UPDATE auth.users 
SET tenant_id = 'monday' 
WHERE id = '1b75e2f5-41a0-4f5f-b285-7e0d9a955f94';

-- Function to get current user's tenant
CREATE OR REPLACE FUNCTION get_current_user_tenant()
RETURNS TEXT AS $$
DECLARE
    current_tenant TEXT;
BEGIN
    SELECT tenant_id INTO current_tenant 
    FROM auth.users 
    WHERE id = auth.uid();
    
    RETURN current_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure tenants are referentially constrained
ALTER TABLE public.tenants 
ADD CONSTRAINT unique_tenant_slug 
UNIQUE (slug);