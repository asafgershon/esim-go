-- ============================================================================
-- Pricing Rule: Standard Profit Protection
-- ============================================================================
-- Description: Ensures minimum profit margin of $1.50
-- Category: keep-profit
-- Event: apply_profit_constraint
-- Priority: 20
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
    'c3d4e5f6-7890-12cd-ef01-123456789012'::uuid,
    'Minimum 1.5$ profit',
    'Ensures minimum profit margin of $1.50',
    'keep-profit',
    '{"all": []}'::jsonb,
    20,
    true,
    true,
    'apply_profit_constraint',
    '{"value": 1.5}'::jsonb,
    '2025-08-05 08:40:28.490107+00'::timestamptz,
    '2025-08-05 08:40:28.490107+00'::timestamptz
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