-- ============================================================================
-- Pricing Rule: Base Cost Pricing
-- ============================================================================
-- Description: Initialize base price from bundle cost
-- Category: INITIALIZATION
-- Event: set_base_price
-- Priority: 99 (highest)
-- Created: 2025-08-03
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
    'ca57ac6d-c580-45a4-9398-273146d52cfd'::uuid,
    'Cost Block',
    'Initialize base price from bundle cost',
    'INITIALIZATION',
    '{"all": [{"fact": "selectedBundle", "value": null, "operator": "notEqual"}]}'::jsonb,
    99,
    true,
    true,
    'set_base_price',
    '{}'::jsonb,
    '2025-08-03 16:32:22.278637+00'::timestamptz,
    '2025-08-03 16:32:22.278637+00'::timestamptz
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