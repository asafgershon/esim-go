-- Check the esims table structure and data
-- First, let's see the column structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'esims'
ORDER BY ordinal_position;

-- Now let's check the actual data, focusing on the activation fields
SELECT 
    id,
    iccid,
    qr_code_url,
    activation_code,
    smdp_address,
    matching_id,
    status,
    created_at
FROM esims
ORDER BY created_at DESC
LIMIT 5;

-- Let's also check a specific order's eSIM data
-- Replace 'YOUR_ORDER_ID' with the actual order ID
SELECT 
    e.id,
    e.iccid,
    e.qr_code_url,
    e.activation_code,
    e.smdp_address,
    e.matching_id,
    o.reference,
    o.status as order_status
FROM esims e
JOIN esim_orders o ON e.order_id = o.id
WHERE o.id = '62847f24-569d-42ff-83b6-1b111005d0bc';

-- Alternative: Find by ICCID
SELECT 
    id,
    iccid,
    qr_code_url,
    activation_code,
    smdp_address,
    matching_id
FROM esims
WHERE iccid = '8944422711100793655';