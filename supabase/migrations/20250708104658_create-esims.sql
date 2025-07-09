-- eSIM instances
CREATE TABLE esims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES esim_orders(id),
  iccid VARCHAR NOT NULL UNIQUE,      -- eSIM identifier
  customer_ref VARCHAR,               -- Customer reference
  qr_code_url VARCHAR,               -- QR code for installation
  status VARCHAR NOT NULL DEFAULT 'PROCESSING',
  assigned_date TIMESTAMP WITH TIME ZONE,
  last_action VARCHAR,               -- Last action from eSIM Go
  action_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE esims ENABLE ROW LEVEL SECURITY;

-- Users can only see their own eSIMs
CREATE POLICY "Users can view own esims" ON esims
  FOR SELECT USING (auth.uid() = user_id);

-- System can create eSIMs (done by backend after purchase)
CREATE POLICY "System can create esims" ON esims
  FOR INSERT WITH CHECK (true);

-- Users can update their own eSIMs (for customer reference, etc.)
CREATE POLICY "Users can update own esims" ON esims
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_esims_user_id ON esims(user_id);
CREATE INDEX idx_esims_iccid ON esims(iccid);
CREATE INDEX idx_esims_order_id ON esims(order_id);
CREATE INDEX idx_esims_status ON esims(status);
CREATE INDEX idx_esims_assigned_date ON esims(assigned_date DESC);

-- Update trigger for updated_at
CREATE TRIGGER update_esims_updated_at BEFORE UPDATE
  ON esims FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add check constraint for valid status values
ALTER TABLE esims ADD CONSTRAINT valid_esim_status 
  CHECK (status IN ('PROCESSING', 'ASSIGNED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'));

-- Add check constraint for valid last_action values
ALTER TABLE esims ADD CONSTRAINT valid_esim_action 
  CHECK (last_action IS NULL OR last_action IN ('CREATED', 'ASSIGNED', 'INSTALLED', 'SUSPENDED', 'RESTORED', 'CANCELLED'));

-- Rollback commands
-- DROP TRIGGER IF EXISTS update_esims_updated_at ON esims;
-- DROP TABLE IF EXISTS esims;