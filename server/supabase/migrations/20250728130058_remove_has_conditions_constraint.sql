-- Remove the has_conditions constraint to allow pricing rules without conditions
-- This enables "universal" rules that apply to all scenarios

ALTER TABLE pricing_rules DROP CONSTRAINT IF EXISTS has_conditions;

-- Add a comment explaining the change
COMMENT ON COLUMN pricing_rules.conditions IS 'Array of rule conditions (can be empty for universal rules)';