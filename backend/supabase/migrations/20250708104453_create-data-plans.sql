-- Data plans from eSIM Go catalogue
CREATE TABLE data_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,              -- eSIM Go bundle name
  description TEXT,
  countries JSON NOT NULL,            -- Supported countries
  region VARCHAR NOT NULL,            -- Europe, Asia, etc.
  duration INTEGER NOT NULL,          -- days
  price DECIMAL(10,2) NOT NULL,
  is_unlimited BOOLEAN DEFAULT true,
  bundle_group VARCHAR,               -- eSIM Go bundle group
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_data_plans_region ON data_plans(region);
CREATE INDEX idx_data_plans_name ON data_plans(name);
CREATE INDEX idx_data_plans_bundle_group ON data_plans(bundle_group);

-- Enable RLS for data_plans
ALTER TABLE data_plans ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view data plans (they're public)
CREATE POLICY "Anyone can view data plans" ON data_plans
  FOR SELECT USING (true);

-- Only admins can modify data plans
CREATE POLICY "Only admins can insert data plans" ON data_plans
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can update data plans" ON data_plans
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can delete data plans" ON data_plans
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_plans_updated_at BEFORE UPDATE
  ON data_plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Rollback commands
-- DROP TRIGGER IF EXISTS update_data_plans_updated_at ON data_plans;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS data_plans;