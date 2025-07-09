-- eSIM Go Platform Database Schema
-- Complete schema including user profiles and eSIM management

-- Profiles table (existing)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  PRIMARY KEY (id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name', new.phone);
  RETURN new;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Data plans from eSIM Go catalogue
CREATE TABLE IF NOT EXISTS data_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  countries JSON NOT NULL,
  region VARCHAR NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_unlimited BOOLEAN DEFAULT true,
  bundle_group VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE data_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_data_plans_region ON data_plans(region);
CREATE INDEX IF NOT EXISTS idx_data_plans_name ON data_plans(name);
CREATE INDEX IF NOT EXISTS idx_data_plans_bundle_group ON data_plans(bundle_group);

-- Data plans policies
CREATE POLICY "Anyone can view data plans" ON data_plans
  FOR SELECT USING (true);
CREATE POLICY "Only admins can insert data plans" ON data_plans
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can update data plans" ON data_plans
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can delete data plans" ON data_plans
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

DROP TRIGGER IF EXISTS update_data_plans_updated_at ON data_plans;
CREATE TRIGGER update_data_plans_updated_at BEFORE UPDATE
  ON data_plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Customer orders
CREATE TABLE IF NOT EXISTS esim_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reference VARCHAR NOT NULL UNIQUE,
  status VARCHAR NOT NULL DEFAULT 'PROCESSING',
  data_plan_id UUID NOT NULL REFERENCES data_plans(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  esim_go_order_ref VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE esim_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_esim_orders_user_id ON esim_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_esim_orders_reference ON esim_orders(reference);
CREATE INDEX IF NOT EXISTS idx_esim_orders_status ON esim_orders(status);
CREATE INDEX IF NOT EXISTS idx_esim_orders_created_at ON esim_orders(created_at DESC);

-- Order policies
CREATE POLICY "Users can view own orders" ON esim_orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON esim_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON esim_orders
  FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_esim_orders_updated_at ON esim_orders;
CREATE TRIGGER update_esim_orders_updated_at BEFORE UPDATE
  ON esim_orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE esim_orders DROP CONSTRAINT IF EXISTS valid_order_status;
ALTER TABLE esim_orders ADD CONSTRAINT valid_order_status 
  CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'));

-- eSIM instances
CREATE TABLE IF NOT EXISTS esims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES esim_orders(id),
  iccid VARCHAR NOT NULL UNIQUE,
  customer_ref VARCHAR,
  qr_code_url VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'PROCESSING',
  assigned_date TIMESTAMP WITH TIME ZONE,
  last_action VARCHAR,
  action_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE esims ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_esims_user_id ON esims(user_id);
CREATE INDEX IF NOT EXISTS idx_esims_iccid ON esims(iccid);
CREATE INDEX IF NOT EXISTS idx_esims_order_id ON esims(order_id);
CREATE INDEX IF NOT EXISTS idx_esims_status ON esims(status);
CREATE INDEX IF NOT EXISTS idx_esims_assigned_date ON esims(assigned_date DESC);

-- eSIM policies
CREATE POLICY "Users can view own esims" ON esims
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create esims" ON esims
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own esims" ON esims
  FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_esims_updated_at ON esims;
CREATE TRIGGER update_esims_updated_at BEFORE UPDATE
  ON esims FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE esims DROP CONSTRAINT IF EXISTS valid_esim_status;
ALTER TABLE esims ADD CONSTRAINT valid_esim_status 
  CHECK (status IN ('PROCESSING', 'ASSIGNED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'));

ALTER TABLE esims DROP CONSTRAINT IF EXISTS valid_esim_action;
ALTER TABLE esims ADD CONSTRAINT valid_esim_action 
  CHECK (last_action IS NULL OR last_action IN ('CREATED', 'ASSIGNED', 'INSTALLED', 'SUSPENDED', 'RESTORED', 'CANCELLED'));

-- Bundle assignments and usage
CREATE TABLE IF NOT EXISTS esim_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  esim_id UUID NOT NULL REFERENCES esims(id),
  data_plan_id UUID NOT NULL REFERENCES data_plans(id),
  name VARCHAR NOT NULL,
  state VARCHAR NOT NULL DEFAULT 'PROCESSING',
  remaining_data BIGINT,
  used_data BIGINT DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE esim_bundles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_esim_bundles_esim_id ON esim_bundles(esim_id);
CREATE INDEX IF NOT EXISTS idx_esim_bundles_state ON esim_bundles(state);
CREATE INDEX IF NOT EXISTS idx_esim_bundles_name ON esim_bundles(name);
CREATE INDEX IF NOT EXISTS idx_esim_bundles_end_date ON esim_bundles(end_date);

-- Bundle policies
CREATE POLICY "Users can view own esim bundles" ON esim_bundles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM esims 
      WHERE esims.id = esim_bundles.esim_id 
      AND esims.user_id = auth.uid()
    )
  );
CREATE POLICY "System can create esim bundles" ON esim_bundles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update esim bundles" ON esim_bundles
  FOR UPDATE USING (true);

DROP TRIGGER IF EXISTS update_esim_bundles_updated_at ON esim_bundles;
CREATE TRIGGER update_esim_bundles_updated_at BEFORE UPDATE
  ON esim_bundles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE esim_bundles DROP CONSTRAINT IF EXISTS valid_bundle_state;
ALTER TABLE esim_bundles ADD CONSTRAINT valid_bundle_state 
  CHECK (state IN ('PROCESSING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'));

-- Create view for active bundles with plan details
CREATE OR REPLACE VIEW active_bundles AS
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