-- Create pricing_configurations table
CREATE TABLE IF NOT EXISTS public.pricing_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Bundle filters (NULL means applies to all)
    country_id VARCHAR(2), -- ISO country code
    region_id VARCHAR(100),
    duration INTEGER,
    bundle_group VARCHAR(100),
    
    -- Configuration values (stored as decimals 0-1)
    cost_split_percent DECIMAL(5,4) NOT NULL CHECK (cost_split_percent >= 0 AND cost_split_percent <= 1),
    discount_rate DECIMAL(5,4) NOT NULL CHECK (discount_rate >= 0 AND discount_rate <= 1),
    processing_rate DECIMAL(5,4) NOT NULL CHECK (processing_rate >= 0 AND processing_rate <= 1),
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pricing_configurations_active_priority ON public.pricing_configurations(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_configurations_country ON public.pricing_configurations(country_id);
CREATE INDEX IF NOT EXISTS idx_pricing_configurations_region ON public.pricing_configurations(region_id);
CREATE INDEX IF NOT EXISTS idx_pricing_configurations_duration ON public.pricing_configurations(duration);
CREATE INDEX IF NOT EXISTS idx_pricing_configurations_bundle_group ON public.pricing_configurations(bundle_group);

-- Add RLS policies
ALTER TABLE public.pricing_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all pricing configurations
CREATE POLICY "Users can view pricing configurations" ON public.pricing_configurations
    FOR SELECT USING (true);

-- Policy: Only admins can insert/update/delete pricing configurations
CREATE POLICY "Only admins can modify pricing configurations" ON public.pricing_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

-- Insert default pricing configuration
INSERT INTO public.pricing_configurations (
    name,
    description,
    cost_split_percent,
    discount_rate,
    processing_rate,
    is_active,
    priority,
    created_by
) VALUES (
    'Default Global Pricing',
    'Default pricing configuration that applies to all bundles when no specific rules match',
    0.60, -- 60% cost split
    0.0, -- 0% discount
    0.045, -- 4.5% processing
    true,
    1, -- Low priority (will be overridden by specific rules)
    '00000000-0000-0000-0000-000000000000'::UUID -- System user
);

-- Add pricing_breakdown column to esim_orders table if it doesn't exist
ALTER TABLE public.esim_orders ADD COLUMN IF NOT EXISTS pricing_breakdown JSONB;

-- Add updated_at trigger for pricing_configurations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pricing_configurations_updated_at
    BEFORE UPDATE ON public.pricing_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();