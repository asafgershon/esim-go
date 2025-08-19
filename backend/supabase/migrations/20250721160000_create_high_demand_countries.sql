-- Create high_demand_countries table
-- This table acts as a simple key-value store where presence indicates high demand
CREATE TABLE IF NOT EXISTS public.high_demand_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id VARCHAR(3) NOT NULL UNIQUE, -- ISO country code (e.g., 'US', 'GB', 'CYP')
    
    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_high_demand_countries_country_id ON public.high_demand_countries(country_id);
CREATE INDEX IF NOT EXISTS idx_high_demand_countries_created_at ON public.high_demand_countries(created_at);

-- Add RLS policies
ALTER TABLE public.high_demand_countries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all high demand countries
CREATE POLICY "Users can view high demand countries" ON public.high_demand_countries
    FOR SELECT USING (true);

-- Policy: Only admins can insert/update/delete high demand countries
CREATE POLICY "Only admins can modify high demand countries" ON public.high_demand_countries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

-- Add updated_at trigger for high_demand_countries
CREATE TRIGGER update_high_demand_countries_updated_at
    BEFORE UPDATE ON public.high_demand_countries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();