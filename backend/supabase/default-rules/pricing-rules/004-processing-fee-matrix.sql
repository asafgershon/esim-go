-- ============================================================================
-- Pricing Rule: Processing Fees for All Payment Methods
-- ============================================================================
-- Description: Processing fee for Israeli credit cards
-- Category: FEE
-- Event: apply_processing_fee
-- Priority: 40 (inactive by default)
-- Created: 2025-08-10
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
    '9761877f-792b-4086-9508-63a9080fb4f1'::uuid,
    'Payment Processing Fees',
    'Processing fee for Israeli credit cards',
    'FEE',
    '{"all": [{"fact": "paymentMethod", "value": "ISRAELI_CARD", "operator": "equal"}]}'::jsonb,
    40,
    false,
    true,
    'apply_processing_fee',
    '{"type": "SET_PROCESSING_RATE", "feesMatrix": {"DINERS": {"fixedFee": 0, "percentageFee": 3.9}, "FOREIGN_CARD": {"fixedFee": 0.3, "percentageFee": 2.9}, "ISRAELI_CARD": {"fixedFee": 0, "percentageFee": 1.4}}}'::jsonb,
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