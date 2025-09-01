-- ============================================================================
-- Pricing Block: Fixed Price for Ukraine
-- ============================================================================
-- Description: Set fixed price for Ukraine
-- Category: fixed-price
-- Event: apply_fixed_price
-- Priority: 1 (highest priority for country-specific overrides)
-- Created: 2025-08-05
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
    'a1b2c3d4-5678-90ab-cdef-123456789012'::uuid,
    'Set Fixed Price',
    'Set fixed price for Ukraine',
    'fixed-price',
    '{"all": [{"fact": "country", "path": "$.country", "value": "UA", "operator": "equal"}]}'::jsonb,
    1,
    true,
    true,
    'apply_fixed_price',
    '{"actions": {"value": 25}}'::jsonb,
    '2025-08-05 08:40:28.254802+00'::timestamptz,
    '2025-08-10 13:27:43.949699+00'::timestamptz
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