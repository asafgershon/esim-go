-- Bundle assignments and usage
CREATE TABLE esim_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  esim_id UUID NOT NULL REFERENCES esims(id),
  data_plan_id UUID NOT NULL REFERENCES data_plans(id),
  name VARCHAR NOT NULL,             -- Bundle name from eSIM Go
  state VARCHAR NOT NULL DEFAULT 'PROCESSING',
  remaining_data BIGINT,             -- bytes remaining (null for unlimited)
  used_data BIGINT DEFAULT 0,        -- bytes consumed
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (inherit from esims)
ALTER TABLE esim_bundles ENABLE ROW LEVEL SECURITY;

-- Users can only see bundles for their own eSIMs
CREATE POLICY "Users can view own esim bundles" ON esim_bundles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM esims 
      WHERE esims.id = esim_bundles.esim_id 
      AND esims.user_id = auth.uid()
    )
  );

-- System can create and update bundles
CREATE POLICY "System can create esim bundles" ON esim_bundles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update esim bundles" ON esim_bundles
  FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_esim_bundles_esim_id ON esim_bundles(esim_id);
CREATE INDEX idx_esim_bundles_state ON esim_bundles(state);
CREATE INDEX idx_esim_bundles_name ON esim_bundles(name);
CREATE INDEX idx_esim_bundles_end_date ON esim_bundles(end_date);

-- Update trigger for updated_at
CREATE TRIGGER update_esim_bundles_updated_at BEFORE UPDATE
  ON esim_bundles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add check constraint for valid state values
ALTER TABLE esim_bundles ADD CONSTRAINT valid_bundle_state 
  CHECK (state IN ('PROCESSING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'));

-- Create view for active bundles with plan details
CREATE VIEW active_bundles AS
SELECT 
  eb.*,
  dp.description as plan_description,
  dp.region,
  dp.countries,
  dp.duration,
  dp.is_unlimited,
  e.user_id,
  e.iccid,
  e.status as esim_status
FROM esim_bundles eb
JOIN esims e ON eb.esim_id = e.id
JOIN data_plans dp ON eb.data_plan_id = dp.id
WHERE eb.state = 'ACTIVE'
  AND (eb.end_date IS NULL OR eb.end_date > NOW());

-- Grant permissions on the view
GRANT SELECT ON active_bundles TO authenticated;

-- Rollback commands
-- DROP VIEW IF EXISTS active_bundles;
-- DROP TRIGGER IF EXISTS update_esim_bundles_updated_at ON esim_bundles;
-- DROP TABLE IF EXISTS esim_bundles;