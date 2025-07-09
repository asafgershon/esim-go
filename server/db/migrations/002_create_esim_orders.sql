-- Customer orders
CREATE TABLE esim_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reference VARCHAR NOT NULL UNIQUE,  -- eSIM Go order reference
  status VARCHAR NOT NULL DEFAULT 'PROCESSING',
  data_plan_id UUID NOT NULL REFERENCES data_plans(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  esim_go_order_ref VARCHAR,          -- eSIM Go internal reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE esim_orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own orders
CREATE POLICY "Users can view own orders" ON esim_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create own orders" ON esim_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (for cancellation, etc.)
CREATE POLICY "Users can update own orders" ON esim_orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_esim_orders_user_id ON esim_orders(user_id);
CREATE INDEX idx_esim_orders_reference ON esim_orders(reference);
CREATE INDEX idx_esim_orders_status ON esim_orders(status);
CREATE INDEX idx_esim_orders_created_at ON esim_orders(created_at DESC);

-- Update trigger for updated_at
CREATE TRIGGER update_esim_orders_updated_at BEFORE UPDATE
  ON esim_orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add check constraint for valid status values
ALTER TABLE esim_orders ADD CONSTRAINT valid_order_status 
  CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'));

-- Rollback commands
-- DROP TRIGGER IF EXISTS update_esim_orders_updated_at ON esim_orders;
-- DROP TABLE IF EXISTS esim_orders;