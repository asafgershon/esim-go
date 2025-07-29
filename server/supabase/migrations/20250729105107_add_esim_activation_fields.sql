-- Add activation fields to esims table for storing eSIM activation details
ALTER TABLE esims
ADD COLUMN IF NOT EXISTS activation_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS smdp_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS matching_id VARCHAR(255);

-- Add comments for clarity
COMMENT ON COLUMN esims.activation_code IS 'Activation code for manual eSIM installation';
COMMENT ON COLUMN esims.smdp_address IS 'SMDP+ address for eSIM activation';
COMMENT ON COLUMN esims.matching_id IS 'Matching ID (confirmation code) for eSIM activation';