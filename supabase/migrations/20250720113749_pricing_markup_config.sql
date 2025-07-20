-- Create pricing markup configuration table
CREATE TABLE pricing_markup_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_group VARCHAR(100) NOT NULL,
  duration_days INTEGER NOT NULL,
  markup_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bundle_group, duration_days)
);

-- Add index for fast lookups
CREATE INDEX idx_pricing_markup_config_lookup ON pricing_markup_config(bundle_group, duration_days);

-- Add comment for documentation
COMMENT ON TABLE pricing_markup_config IS 'Fixed markup amounts for different bundle groups and durations';
COMMENT ON COLUMN pricing_markup_config.bundle_group IS 'eSIM Go bundle group name (e.g., Standard - Unlimited Lite)';
COMMENT ON COLUMN pricing_markup_config.duration_days IS 'Duration in days';
COMMENT ON COLUMN pricing_markup_config.markup_amount IS 'Fixed markup amount in USD to add to base eSIM Go cost';

-- Insert the markup data from Excel table
INSERT INTO pricing_markup_config (bundle_group, duration_days, markup_amount) VALUES
-- Standard - Unlimited Lite
('Standard - Unlimited Lite', 1, 3.00),
('Standard - Unlimited Lite', 3, 5.00),
('Standard - Unlimited Lite', 5, 9.00),
('Standard - Unlimited Lite', 7, 12.00),
('Standard - Unlimited Lite', 10, 15.00),
('Standard - Unlimited Lite', 15, 17.00),
('Standard - Unlimited Lite', 30, 20.00),

-- Standard - Unlimited Essential
('Standard - Unlimited Essential', 1, 4.00),
('Standard - Unlimited Essential', 3, 6.00),
('Standard - Unlimited Essential', 5, 10.00),
('Standard - Unlimited Essential', 7, 13.00),
('Standard - Unlimited Essential', 10, 16.00),
('Standard - Unlimited Essential', 15, 18.00),
('Standard - Unlimited Essential', 30, 21.00);

-- Enable RLS (Row Level Security) for future access control if needed
ALTER TABLE pricing_markup_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access (can be modified later for specific roles)
CREATE POLICY "Allow read access to pricing markup config" ON pricing_markup_config
    FOR SELECT USING (true);

-- Create policy for admin writes (modify as needed for your auth system)
CREATE POLICY "Allow admin write access to pricing markup config" ON pricing_markup_config
    FOR ALL USING (auth.role() = 'service_role');