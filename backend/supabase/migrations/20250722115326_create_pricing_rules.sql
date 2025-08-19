-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('SYSTEM_MARKUP', 'SYSTEM_PROCESSING', 'BUSINESS_DISCOUNT', 'PROMOTION', 'SEGMENT')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Rule definition
    conditions JSONB NOT NULL DEFAULT '[]'::JSONB,
    actions JSONB NOT NULL DEFAULT '[]'::JSONB,
    
    -- Metadata
    priority INTEGER NOT NULL DEFAULT 50 CHECK (priority >= 0 AND priority <= 1000),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_editable BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (valid_until IS NULL OR valid_until > valid_from),
    CONSTRAINT has_conditions CHECK (jsonb_array_length(conditions) > 0),
    CONSTRAINT has_actions CHECK (jsonb_array_length(actions) > 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_pricing_rules_active ON public.pricing_rules(is_active, type) WHERE is_active = true;
CREATE INDEX idx_pricing_rules_priority ON public.pricing_rules(priority DESC);
CREATE INDEX idx_pricing_rules_validity ON public.pricing_rules(valid_from, valid_until) WHERE is_active = true;
CREATE INDEX idx_pricing_rules_type ON public.pricing_rules(type);

-- Enable RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active pricing rules" ON public.pricing_rules
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can view all pricing rules" ON public.pricing_rules
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

CREATE POLICY "Only admins can manage pricing rules" ON public.pricing_rules
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_pricing_rules_updated_at
    BEFORE UPDATE ON public.pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing pricing_markup_config to system rules
INSERT INTO public.pricing_rules (type, name, description, conditions, actions, priority, is_active, is_editable, created_by)
SELECT 
    'SYSTEM_MARKUP' as type,
    CONCAT(bundle_group, ' - ', duration_days, ' days') as name,
    CONCAT('Fixed markup of $', markup_amount, ' for ', bundle_group, ' ', duration_days, '-day bundles') as description,
    jsonb_build_array(
        jsonb_build_object(
            'field', 'bundleGroup',
            'operator', 'EQUALS',
            'value', bundle_group
        ),
        jsonb_build_object(
            'field', 'duration',
            'operator', 'EQUALS',
            'value', duration_days
        )
    ) as conditions,
    jsonb_build_array(
        jsonb_build_object(
            'type', 'ADD_MARKUP',
            'value', markup_amount::float,
            'metadata', jsonb_build_object()
        )
    ) as actions,
    100 as priority, -- High priority for system rules
    true as is_active,
    false as is_editable, -- System rules are not editable
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
FROM public.pricing_markup_config;

-- Migrate processing fee configurations to system rules
INSERT INTO public.pricing_rules (type, name, description, conditions, actions, priority, is_active, is_editable, created_by)
SELECT 
    'SYSTEM_PROCESSING' as type,
    'Israeli Card Processing Fee' as name,
    CONCAT('Processing fee of ', (israeli_cards_rate * 100), '% for Israeli cards') as description,
    jsonb_build_array(
        jsonb_build_object(
            'field', 'paymentMethod',
            'operator', 'EQUALS',
            'value', 'ISRAELI_CARD'
        )
    ) as conditions,
    jsonb_build_array(
        jsonb_build_object(
            'type', 'SET_PROCESSING_RATE',
            'value', (israeli_cards_rate * 100)::float,
            'metadata', jsonb_build_object()
        )
    ) as actions,
    90 as priority,
    is_active,
    false as is_editable,
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
FROM public.processing_fee_configurations
WHERE is_active = true
LIMIT 1;

INSERT INTO public.pricing_rules (type, name, description, conditions, actions, priority, is_active, is_editable, created_by)
SELECT 
    'SYSTEM_PROCESSING' as type,
    'Foreign Card Processing Fee' as name,
    CONCAT('Processing fee of ', (foreign_cards_rate * 100), '% for foreign cards') as description,
    jsonb_build_array(
        jsonb_build_object(
            'field', 'paymentMethod',
            'operator', 'IN',
            'value', jsonb_build_array('FOREIGN_CARD', 'VISA', 'MASTERCARD')
        )
    ) as conditions,
    jsonb_build_array(
        jsonb_build_object(
            'type', 'SET_PROCESSING_RATE',
            'value', (foreign_cards_rate * 100)::float,
            'metadata', jsonb_build_object()
        )
    ) as actions,
    90 as priority,
    is_active,
    false as is_editable,
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
FROM public.processing_fee_configurations
WHERE is_active = true
LIMIT 1;

-- Migrate existing pricing_configurations to business rules
INSERT INTO public.pricing_rules (type, name, description, conditions, actions, priority, is_active, is_editable, created_by)
SELECT 
    'BUSINESS_DISCOUNT' as type,
    name,
    description,
    CASE 
        WHEN country_id IS NOT NULL AND duration IS NOT NULL AND bundle_group IS NOT NULL THEN
            jsonb_build_array(
                jsonb_build_object('field', 'country', 'operator', 'EQUALS', 'value', country_id),
                jsonb_build_object('field', 'duration', 'operator', 'EQUALS', 'value', duration),
                jsonb_build_object('field', 'bundleGroup', 'operator', 'EQUALS', 'value', bundle_group)
            )
        WHEN country_id IS NOT NULL AND duration IS NOT NULL THEN
            jsonb_build_array(
                jsonb_build_object('field', 'country', 'operator', 'EQUALS', 'value', country_id),
                jsonb_build_object('field', 'duration', 'operator', 'EQUALS', 'value', duration)
            )
        WHEN country_id IS NOT NULL THEN
            jsonb_build_array(
                jsonb_build_object('field', 'country', 'operator', 'EQUALS', 'value', country_id)
            )
        WHEN region_id IS NOT NULL THEN
            jsonb_build_array(
                jsonb_build_object('field', 'region', 'operator', 'EQUALS', 'value', region_id)
            )
        ELSE
            '[]'::JSONB
    END as conditions,
    CASE 
        WHEN discount_per_day IS NOT NULL AND discount_per_day > 0 THEN
            jsonb_build_array(
                jsonb_build_object(
                    'type', 'APPLY_DISCOUNT_PERCENTAGE',
                    'value', (discount_rate * 100)::float,
                    'metadata', jsonb_build_object()
                ),
                jsonb_build_object(
                    'type', 'SET_DISCOUNT_PER_UNUSED_DAY',
                    'value', (discount_per_day * 100)::float,
                    'metadata', jsonb_build_object()
                )
            )
        ELSE
            jsonb_build_array(
                jsonb_build_object(
                    'type', 'APPLY_DISCOUNT_PERCENTAGE',
                    'value', (discount_rate * 100)::float,
                    'metadata', jsonb_build_object()
                )
            )
    END as actions,
    CASE 
        WHEN country_id IS NOT NULL AND duration IS NOT NULL AND bundle_group IS NOT NULL THEN 100
        WHEN country_id IS NOT NULL AND duration IS NOT NULL THEN 75
        WHEN country_id IS NOT NULL THEN 50
        WHEN region_id IS NOT NULL THEN 25
        ELSE 10
    END as priority,
    is_active,
    true as is_editable,
    COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::UUID) as created_by
FROM public.pricing_configurations
WHERE discount_rate > 0;

-- Add default unused days discount rule with a condition that always matches
INSERT INTO public.pricing_rules (type, name, description, conditions, actions, priority, is_active, is_editable, created_by)
VALUES (
    'BUSINESS_DISCOUNT',
    'Default Unused Days Discount',
    'Apply 10% discount per unused day for all bundles',
    jsonb_build_array(
        jsonb_build_object(
            'field', 'bundle.duration',
            'operator', 'GREATER_THAN',
            'value', 0
        )
    ), -- Condition that always matches (all bundles have duration > 0)
    jsonb_build_array(
        jsonb_build_object(
            'type', 'SET_DISCOUNT_PER_UNUSED_DAY',
            'value', 10,
            'metadata', jsonb_build_object('default', true)
        )
    ),
    1, -- Lowest priority
    true,
    true,
    '00000000-0000-0000-0000-000000000000'::UUID
);

-- Add comment for documentation
COMMENT ON TABLE public.pricing_rules IS 'Unified pricing rules engine supporting system and business rules';
COMMENT ON COLUMN public.pricing_rules.type IS 'Rule type: SYSTEM_* rules are immutable, others are business rules';
COMMENT ON COLUMN public.pricing_rules.conditions IS 'Array of conditions that must all match for rule to apply';
COMMENT ON COLUMN public.pricing_rules.actions IS 'Array of actions to execute when rule matches';
COMMENT ON COLUMN public.pricing_rules.priority IS 'Higher priority rules are evaluated first (0-1000)';
COMMENT ON COLUMN public.pricing_rules.is_editable IS 'Whether rule can be modified (false for system rules)';