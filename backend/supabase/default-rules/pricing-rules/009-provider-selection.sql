-- ============================================================================
-- Pricing Block: Provider Selection
-- ============================================================================
-- Description: Select Maya Mobile as primary provider, fallback to eSIM-Go
-- Category: PROVIDER_SELECTION
-- Event: select_provider
-- Priority: 100 (highest - executes first)
-- Created: 2025-09-01
-- ============================================================================

INSERT INTO public.pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    priority,
    is_active,
    is_editable,
    event_type,
    params,
    created_at,
    updated_at
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'Provider Selection',
    'Select Maya Mobile as primary provider, fallback to eSIM-Go',
    'PROVIDER_SELECTION',
    '{"all": [{"fact": "availableBundles", "operator": "greaterThan", "path": ".length", "value": 0}]}'::jsonb,
    100,
    true,
    true,
    'select_provider',
    '{"preferredProvider": "MAYA", "fallbackProvider": "ESIM_GO"}'::jsonb,
    '2025-09-01 12:00:00.000000+00'::timestamptz,
    '2025-09-01 12:00:00.000000+00'::timestamptz
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    conditions = EXCLUDED.conditions,
    priority = EXCLUDED.priority,
    is_active = EXCLUDED.is_active,
    is_editable = EXCLUDED.is_editable,
    event_type = EXCLUDED.event_type,
    params = EXCLUDED.params,
    updated_at = NOW();