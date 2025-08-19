-- Migration: Add orderId column to checkout_sessions table
-- Purpose: Store the created order ID when checkout session is completed
-- Date: 2025-01-16

-- Add orderId column to checkout_sessions table
ALTER TABLE checkout_sessions 
ADD COLUMN order_id UUID REFERENCES esim_orders(id) ON DELETE SET NULL;

-- Add index for performance when querying by order_id
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_order_id ON checkout_sessions(order_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN checkout_sessions.order_id IS 'References the created order when checkout session is completed successfully'; 