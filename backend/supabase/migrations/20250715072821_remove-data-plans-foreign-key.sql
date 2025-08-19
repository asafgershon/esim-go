-- Remove the foreign key constraint
ALTER TABLE esim_orders DROP CONSTRAINT esim_orders_data_plan_id_fkey;

-- Make data_plan_id nullable and store plan info differently
ALTER TABLE esim_orders ALTER COLUMN data_plan_id DROP NOT NULL;

-- Add a plan_data JSON column to store dynamic plan info
ALTER TABLE esim_orders ADD COLUMN plan_data JSONB;