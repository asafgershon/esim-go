-- ============================================================================
-- Pricing Rule: Bundle Markup Matrix
-- ============================================================================
-- Description: Apply markup matrix for unlimited bundles
-- Category: markup
-- Event: apply_markup
-- Priority: 90
-- Created: 2025-08-03
-- ============================================================================
-- Markup Matrix Configuration:
-- - Standard Unlimited Lite: 1 day=$3, 3 days=$5, 5 days=$9, 7 days=$12, 10 days=$15, 15 days=$17, 30 days=$20
-- - Standard Unlimited Plus: 1 day=$4, 3 days=$6, 5 days=$10, 7 days=$13, 10 days=$16, 15 days=$18, 30 days=$21
-- - Standard Unlimited Essential: 1 day=$3, 3 days=$5, 5 days=$9, 7 days=$12, 10 days=$15, 15 days=$17, 30 days=$20
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
    '09000102-3456-7823-4567-123456789012'::uuid,
    'Unlimited Bundle Markup',
    'Apply markup matrix for unlimited bundles',
    'markup',
    '{"any": [{"all": [{"fact": "selectedBundle", "value": null, "operator": "notEqual"}, {"fact": "selectedBundle", "path": "$.is_unlimited", "value": true, "operator": "equal"}]}, {"all": [{"fact": "previousBundle", "value": null, "operator": "notEqual"}, {"fact": "previousBundle", "path": "$.is_unlimited", "value": true, "operator": "equal"}]}]}'::jsonb,
    90,
    true,
    true,
    'apply_markup',
    '{
        "markupMatrix": {
            "Standard Unlimited Lite": {
                "1": 3,
                "3": 5,
                "5": 9,
                "7": 12,
                "10": 15,
                "15": 17,
                "30": 20
            },
            "Standard Unlimited Plus": {
                "1": 4,
                "3": 6,
                "5": 10,
                "7": 13,
                "10": 16,
                "15": 18,
                "30": 21
            },
            "Standard Unlimited Essential": {
                "1": 3,
                "3": 5,
                "5": 9,
                "7": 12,
                "10": 15,
                "15": 17,
                "30": 20
            }
        }
    }'::jsonb,
    '2025-08-05 08:40:29.144461+00'::timestamptz,
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