-- ============================================================================
-- Pricing Block: Unused Days Discount
-- ============================================================================
-- Description: Apply discount for unused days in bundle
-- Category: DISCOUNT
-- Event: apply_unused_days_discount
-- Priority: 80
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
    created_by,
    created_at,
    updated_at
) VALUES (
    '1cbf12bf-d423-430b-9cc1-3674f434b4bc'::uuid,
    'Unused Days Discount',
    'Apply discount for unused days in bundle',
    'DISCOUNT',
    '{"all": [{"fact": "unusedDays", "value": 0, "operator": "greaterThan"}]}'::jsonb,
    80,
    true,
    true,
    'apply_unused_days_discount',
    '{}'::jsonb,
    '00000000-0000-0000-0000-000000000000'::uuid,
    '2025-08-03 16:32:22.278637+00'::timestamptz,
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