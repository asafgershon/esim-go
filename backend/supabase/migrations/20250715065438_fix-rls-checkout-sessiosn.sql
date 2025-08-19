-- Drop the existing constraint
ALTER TABLE checkout_sessions DROP CONSTRAINT IF EXISTS checkout_sessions_payment_status_check;

-- Add the updated constraint with all statuses
ALTER TABLE checkout_sessions ADD CONSTRAINT checkout_sessions_payment_status_check 
CHECK (payment_status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED'));