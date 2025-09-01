-- ============================================================================
-- Pricing Block: Psychological Rounding
-- ============================================================================
-- Description: Apply psychological price rounding (.99)
-- Category: ROUNDING
-- Event: apply_psychological_rounding
-- Priority: 10
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
    'a52106bc-5303-47b1-adae-892aa0b48735'::uuid,
    'Psychological Rounding',
    'Apply psychological price rounding (.99)',
    'ROUNDING',
    '{"all": []}'::jsonb,
    10,
    true,
    true,
    'apply_psychological_rounding',
    '{"strategy": "nearest-whole"}'::jsonb,
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