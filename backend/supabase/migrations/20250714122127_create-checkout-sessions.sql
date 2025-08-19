-- Migration: Create checkout_sessions table
-- Purpose: Secure server-side checkout flow management for eSIM Go platform
-- Date: 2025-01-14

-- Create the checkout_sessions table
CREATE TABLE IF NOT EXISTS checkout_sessions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User relationship (allow null for anonymous checkout)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan information
  plan_id TEXT NOT NULL,
  plan_snapshot JSONB NOT NULL, -- Store plan details at time of session creation
  
  -- Pricing breakdown (calculated server-side)
  pricing JSONB NOT NULL DEFAULT '{}',
  -- Expected structure:
  -- {
  --   "subtotal": 3375,
  --   "taxes": 0,
  --   "fees": 0,
  --   "total": 3375,
  --   "currency": "USD"
  -- }
  
  -- Step completion tracking
  steps JSONB NOT NULL DEFAULT '{}',
  -- Expected structure:
  -- {
  --   "authentication": {"completed": true, "completedAt": "2025-01-14T..."},
  --   "delivery": {"completed": false, "method": null},
  --   "payment": {"completed": false, "paymentMethodId": null}
  -- }
  
  -- Session security and lifecycle
  token_hash TEXT UNIQUE, -- Hashed version of the JWT token for lookup
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  
  -- Payment integration
  payment_intent_id TEXT, -- Stripe/payment provider reference
  payment_status TEXT CHECK (payment_status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED')),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional metadata for debugging/analytics
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_token_hash ON checkout_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires_at ON checkout_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_payment_intent ON checkout_sessions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_created_at ON checkout_sessions(created_at);

-- Create index for user + expiration lookups (without the immutable function issue)
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_expires 
ON checkout_sessions(user_id, expires_at);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_checkout_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_checkout_sessions_updated_at
  BEFORE UPDATE ON checkout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_checkout_sessions_updated_at();

-- Function to clean up expired sessions (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_checkout_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM checkout_sessions 
  WHERE expires_at < NOW() - INTERVAL '1 hour'; -- Keep expired sessions for 1 hour for debugging
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access their own sessions + anonymous sessions
CREATE POLICY "Users can manage their own checkout sessions"
ON checkout_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policy: Anonymous users can access sessions without user_id
CREATE POLICY "Anonymous users can access anonymous sessions"
ON checkout_sessions
FOR ALL
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

-- RLS Policy: Service role can access all sessions (for server-side operations)
CREATE POLICY "Service role can access all checkout sessions"
ON checkout_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Helper function to validate checkout session token
CREATE OR REPLACE FUNCTION validate_checkout_session_token(session_token TEXT)
RETURNS TABLE(
  session_id UUID,
  user_id UUID,
  is_valid BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.user_id,
    (cs.expires_at > NOW()) as is_valid,
    cs.expires_at
  FROM checkout_sessions cs
  WHERE cs.token_hash = encode(sha256(session_token::bytea), 'hex')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if all required steps are completed
CREATE OR REPLACE FUNCTION is_checkout_session_complete(session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  session_steps JSONB;
  auth_completed BOOLEAN DEFAULT FALSE;
  delivery_completed BOOLEAN DEFAULT FALSE;
  payment_completed BOOLEAN DEFAULT FALSE;
BEGIN
  SELECT steps INTO session_steps
  FROM checkout_sessions
  WHERE id = session_id;
  
  IF session_steps IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check authentication step
  auth_completed := COALESCE((session_steps->'authentication'->>'completed')::BOOLEAN, FALSE);
  
  -- Check delivery step  
  delivery_completed := COALESCE((session_steps->'delivery'->>'completed')::BOOLEAN, FALSE);
  
  -- Check payment step
  payment_completed := COALESCE((session_steps->'payment'->>'completed')::BOOLEAN, FALSE);
  
  RETURN auth_completed AND delivery_completed AND payment_completed;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easily querying active sessions
CREATE OR REPLACE VIEW active_checkout_sessions AS
SELECT 
  cs.*,
  is_checkout_session_complete(cs.id) as is_complete,
  (cs.expires_at - NOW()) as time_remaining
FROM checkout_sessions cs
WHERE cs.expires_at > NOW();

-- Comments for documentation
COMMENT ON TABLE checkout_sessions IS 'Secure server-side checkout session management for eSIM Go platform';
COMMENT ON COLUMN checkout_sessions.plan_snapshot IS 'Immutable snapshot of plan details at session creation time';
COMMENT ON COLUMN checkout_sessions.pricing IS 'Server-calculated pricing breakdown to prevent client tampering';
COMMENT ON COLUMN checkout_sessions.steps IS 'Progress tracking for multi-step checkout flow';
COMMENT ON COLUMN checkout_sessions.token_hash IS 'SHA256 hash of JWT token for secure session lookup';
COMMENT ON FUNCTION cleanup_expired_checkout_sessions() IS 'Maintenance function to remove old expired sessions';
COMMENT ON FUNCTION is_checkout_session_complete(UUID) IS 'Validates if all required checkout steps are completed';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON checkout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON checkout_sessions TO service_role;
GRANT EXECUTE ON FUNCTION validate_checkout_session_token(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_checkout_session_complete(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_checkout_sessions() TO service_role;