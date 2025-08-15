-- Pricing Blocks Migration SQL
-- Generated from rules-engine-2 code blocks
-- This script inserts all existing pricing rules into the pricing_blocks table

-- Clear existing data (optional - comment out if you want to preserve existing rules)
-- TRUNCATE TABLE pricing_blocks;

-- 1. Discount Rule
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    '02187861-2fee-4485-bfba-c5ab6e1c6943',
    'Discount',
    'Apply percentage discount for unlimited data plans',
    'discount',
    '{
        "all": [
            {
                "fact": "request",
                "path": "$.dataType",
                "value": "unlimited",
                "operator": "equal"
            }
        ]
    }'::jsonb,
    '{
        "type": "apply-discount",
        "params": {
            "ruleId": "02187861-2fee-4485-bfba-c5ab6e1c6943",
            "actions": {
                "type": "APPLY_DISCOUNT_PERCENTAGE",
                "value": 10
            }
        }
    }'::jsonb,
    100,
    true,
    true
);

-- 2. Fixed Price Rule (Ukraine)
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    'a1b2c3d4-5678-90ab-cdef-123456789012',
    'Set Fixed Price',
    'Set fixed price for Ukraine',
    'fixed-price',
    '{
        "all": [
            {
                "fact": "country",
                "path": "$.country",
                "value": "UA",
                "operator": "equal"
            }
        ]
    }'::jsonb,
    '{
        "type": "apply-fixed-price",
        "params": {
            "ruleId": "fixed-price",
            "actions": {
                "type": "set-fixed-price",
                "value": 88
            }
        }
    }'::jsonb,
    100,
    true,
    true
);

-- 3. Base Price Initialization
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    'b2c3d4e5-6789-01bc-def0-123456789012',
    'Initialize Base Price from Cost',
    'Sets the initial base price from the selected bundle cost',
    'cost',
    '{
        "all": [
            {
                "fact": "selectedBundle",
                "operator": "notEqual",
                "value": null
            },
            {
                "fact": "selectedBundle",
                "path": "$.price",
                "operator": "greaterThan",
                "value": 0
            },
            {
                "fact": "selectedBundle",
                "path": "$.esim_go_name",
                "operator": "notEqual",
                "value": null
            }
        ]
    }'::jsonb,
    '{
        "type": "set-base-price",
        "params": {
            "source": "bundle-cost"
        }
    }'::jsonb,
    100,
    true,
    true
);

-- 4. Keep Profit Rule
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    'c3d4e5f6-7890-12cd-ef01-123456789012',
    'Minimum 1.5$ profit',
    'Ensures minimum profit margin of $1.50',
    'keep-profit',
    '{
        "all": []
    }'::jsonb,
    '{
        "type": "apply-profit-constraint",
        "params": {
            "value": 1.5
        }
    }'::jsonb,
    100,
    true,
    true
);

-- 5. Processing Fee - Israeli Card
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    'd4e5f607-8901-23de-f012-123456789012',
    'Processing fee for israeli credit cards',
    'Apply 1.4% processing fee for Israeli cards',
    'processing-fee',
    '{
        "all": [
            {
                "fact": "paymentMethod",
                "value": "ISRAELI_CARD",
                "operator": "equal"
            }
        ]
    }'::jsonb,
    '{
        "type": "apply-processing-fee",
        "params": {
            "type": "SET_PROCESSING_RATE",
            "value": 1.4,
            "method": "ISRAELI_CARD"
        }
    }'::jsonb,
    30,
    true,
    true
);

-- 6. Processing Fee - International Card (Diners)
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    'e5f60708-9012-34ef-0123-123456789012',
    'Processing fee for international credit cards',
    'Apply 3.9% processing fee for Diners cards',
    'processing-fee',
    '{
        "all": [
            {
                "fact": "paymentMethod",
                "value": "DINERS",
                "operator": "equal"
            }
        ]
    }'::jsonb,
    '{
        "type": "apply-processing-fee",
        "params": {
            "type": "SET_PROCESSING_RATE",
            "value": 3.9,
            "method": "DINERS"
        }
    }'::jsonb,
    30,
    true,
    true
);

-- 7. Psychological Rounding
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    'f6070809-0123-45f0-1234-123456789012',
    'Premium Bundle Psychological Pricing',
    'Apply psychological rounding to nearest whole number',
    'psychological-rounding',
    '{
        "all": []
    }'::jsonb,
    '{
        "type": "apply-psychological-rounding",
        "params": {
            "strategy": "nearest-whole"
        }
    }'::jsonb,
    1,
    true,
    true
);

-- 8. Region Rounding
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    '07080900-1234-5601-2345-123456789012',
    'Region Rounding',
    'Apply region-specific price rounding',
    'region-rounding',
    '{
        "all": []
    }'::jsonb,
    '{
        "type": "apply-region-rounding",
        "params": {
            "ruleId": "region-rounding",
            "actions": {
                "type": "set-region-rounding",
                "value": 0.99
            }
        }
    }'::jsonb,
    100,
    true,
    true
);

-- 9. Unused Days Discount
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    '08090001-2345-6712-3456-123456789012',
    'Unused Days Discount',
    'Apply discount for unused days when exact duration match not found',
    'unused-days',
    '{
        "all": [
            {
                "fact": "isExactMatch",
                "path": "$.isExactMatch",
                "operator": "equal",
                "value": false
            },
            {
                "fact": "unusedDays",
                "operator": "greaterThan",
                "value": 0
            }
        ]
    }'::jsonb,
    '{
        "type": "apply-unused-days-discount",
        "params": {
            "type": "APPLY_UNUSED_DAYS_DISCOUNT",
            "unusedDays": "$unusedDays"
        }
    }'::jsonb,
    85,
    true,
    true
);

-- 10. Markup Rule (Main unlimited markup matrix)
INSERT INTO pricing_blocks (
    id,
    name,
    description,
    category,
    conditions,
    action,
    priority,
    is_active,
    is_editable
) VALUES (
    '09000102-3456-7823-4567-123456789012',
    'Unlimited Bundle Markup',
    'Apply markup matrix for unlimited bundles',
    'markup',
    '{
        "any": [
            {
                "all": [
                    {
                        "fact": "selectedBundle",
                        "value": null,
                        "operator": "notEqual"
                    },
                    {
                        "fact": "selectedBundle",
                        "path": "$.is_unlimited",
                        "value": true,
                        "operator": "equal"
                    }
                ]
            },
            {
                "all": [
                    {
                        "fact": "previousBundle",
                        "value": null,
                        "operator": "notEqual"
                    },
                    {
                        "fact": "previousBundle",
                        "path": "$.is_unlimited",
                        "value": true,
                        "operator": "equal"
                    }
                ]
            }
        ]
    }'::jsonb,
    '{
        "type": "apply-markup",
        "params": {
            "type": "ADD_MARKUP",
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
        }
    }'::jsonb,
    50,
    true,
    true
);