-- ============================================================================
-- Pricing Block: Region Rounding
-- ============================================================================
-- Description: Apply region-specific price rounding
-- Category: region-rounding
-- Event: apply_region_rounding
-- Priority: 5
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
    '07080900-1234-5601-2345-123456789012'::uuid,
    'Region Rounding',
    'Apply region-specific price rounding',
    'region-rounding',
    '{"all": []}'::jsonb,
    5,
    true,
    true,
    'apply_region_rounding',
    '{"actions": {"value": 0.99}}'::jsonb,
    '2025-08-05 08:40:28.929797+00'::timestamptz,
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