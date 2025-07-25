-- Force recreation of pricing_rules table for new rules engine
-- This migration completely replaces the old pricing rules system

-- Drop the old pricing_rules table and all dependencies (destructive)
DROP TABLE IF EXISTS pricing_rules CASCADE;

-- Create new pricing_rules table matching the rules engine schema exactly
CREATE TABLE pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Rule identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Rule categorization (matches RuleCategory enum)
    category TEXT NOT NULL CHECK (category IN ('DISCOUNT', 'CONSTRAINT', 'FEE', 'BUNDLE_ADJUSTMENT')),
    
    -- Rule definition (structured for new engine)
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Rule metadata
    priority INTEGER NOT NULL DEFAULT 50 CHECK (priority >= 0 AND priority <= 1000),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_editable BOOLEAN NOT NULL DEFAULT true,
    
    -- Temporal validity
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (valid_until IS NULL OR valid_until > valid_from),
    CONSTRAINT has_conditions CHECK (jsonb_array_length(conditions) > 0),
    CONSTRAINT has_actions CHECK (jsonb_array_length(actions) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_pricing_rules_category ON pricing_rules(category);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC);
CREATE INDEX idx_pricing_rules_validity ON pricing_rules(valid_from, valid_until);
CREATE INDEX idx_pricing_rules_created_by ON pricing_rules(created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert system rules that bootstrap the pricing engine
-- Default Markup Rule (15% markup on base cost)
INSERT INTO pricing_rules (
    name, 
    description, 
    category, 
    conditions, 
    actions, 
    priority, 
    is_active, 
    is_editable,
    created_by
) VALUES (
    'System Markup - 15%',
    'Apply standard 15% markup to all bundles',
    'BUNDLE_ADJUSTMENT',
    '[{"field": "bundle.cost", "operator": "GREATER_THAN", "value": 0, "type": "number"}]'::jsonb,
    '[{"type": "ADD_MARKUP", "value": 0.15, "metadata": {"description": "Standard markup", "basis": "percentage"}}]'::jsonb,
    900,
    true,
    false,
    '00000000-0000-0000-0000-000000000000'
);

-- Minimum Profit Constraint ($1.50)
INSERT INTO pricing_rules (
    name, 
    description, 
    category, 
    conditions, 
    actions, 
    priority, 
    is_active, 
    is_editable,
    created_by
) VALUES (
    'Minimum Profit Constraint',
    'Ensure minimum $1.50 profit on all sales',
    'CONSTRAINT',
    '[{"field": "pricing.netProfit", "operator": "EXISTS", "value": true, "type": "boolean"}]'::jsonb,
    '[{"type": "SET_MINIMUM_PROFIT", "value": 1.50, "metadata": {"description": "Business requirement", "currency": "USD"}}]'::jsonb,
    950,
    true,
    false,
    '00000000-0000-0000-0000-000000000000'
);

-- Comment on table
COMMENT ON TABLE pricing_rules IS 'New pricing rules engine - structured rule definitions with category-based execution';
COMMENT ON COLUMN pricing_rules.category IS 'Rule category: DISCOUNT, CONSTRAINT, FEE, BUNDLE_ADJUSTMENT';
COMMENT ON COLUMN pricing_rules.conditions IS 'Array of rule conditions using ConditionOperator enum';
COMMENT ON COLUMN pricing_rules.actions IS 'Array of rule actions using ActionType enum';