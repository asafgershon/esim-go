-- Create package assignments table
CREATE TABLE package_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_plan_id TEXT NOT NULL, -- This will store the eSIM Go plan ID
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'ACTIVATED', 'EXPIRED', 'CANCELLED')),
  plan_snapshot JSONB, -- Store the plan details at time of assignment
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_package_assignments_user_id ON package_assignments(user_id);
CREATE INDEX idx_package_assignments_assigned_by ON package_assignments(assigned_by);
CREATE INDEX idx_package_assignments_status ON package_assignments(status);
CREATE INDEX idx_package_assignments_created_at ON package_assignments(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_package_assignments_updated_at
  BEFORE UPDATE ON package_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE package_assignments ENABLE ROW LEVEL SECURITY;

-- Allow admins to select all assignments
CREATE POLICY package_assignments_admin_select ON package_assignments
  FOR SELECT 
  TO authenticated 
  USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Allow admins to insert assignments
CREATE POLICY package_assignments_admin_insert ON package_assignments
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

-- Allow admins to update assignments
CREATE POLICY package_assignments_admin_update ON package_assignments
  FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'role' = 'ADMIN')
  WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

-- Allow users to view their own assignments
CREATE POLICY package_assignments_user_select ON package_assignments
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());


    -- RLS policies
  ALTER TABLE package_assignments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY package_assignments_admin_select ON package_assignments FOR SELECT
   TO authenticated USING (auth.jwt() ->> 'role' = 'ADMIN');
  CREATE POLICY package_assignments_admin_insert ON package_assignments FOR INSERT
   TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');
