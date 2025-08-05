-- Create enum for coupon types
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed_amount');

-- Create enum for coupon applicability
CREATE TYPE coupon_applicability AS ENUM ('global', 'region_specific', 'bundle_specific');

-- Create coupons table
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    coupon_type coupon_type NOT NULL,
    value NUMERIC NOT NULL, -- Percentage or fixed amount
    
    -- Validity constraints
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    
    -- Usage limits
    max_total_usage INTEGER,
    max_per_user INTEGER,
    
    -- Spending requirements
    min_spend NUMERIC,
    max_discount NUMERIC,
    
    -- Applicability
    applicability coupon_applicability DEFAULT 'global',
    
    -- Optional region restrictions (comma-separated country codes)
    allowed_regions TEXT[],
    
    -- Optional bundle-specific restrictions
    allowed_bundle_ids UUID[],
    
    -- Corporate email domain specific
    corporate_domain TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Soft delete and active status
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create coupon usage logs
CREATE TABLE coupon_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    order_id UUID, -- Optional reference to the order
    
    -- Discount details
    original_amount NUMERIC NOT NULL,
    discounted_amount NUMERIC NOT NULL,
    discount_amount NUMERIC NOT NULL,
    
    -- Audit fields
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent multiple uses if max_per_user is set
    UNIQUE(coupon_id, user_id)
);

-- Create corporate email domains table
CREATE TABLE corporate_email_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT NOT NULL UNIQUE,
    discount_percentage NUMERIC NOT NULL,
    max_discount NUMERIC,
    
    -- Applicability constraints
    min_spend NUMERIC,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_validity ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupon_usage_logs_user ON coupon_usage_logs(user_id);
CREATE INDEX idx_coupon_usage_logs_coupon ON coupon_usage_logs(coupon_id);
CREATE INDEX idx_corporate_domains ON corporate_email_domains(domain);

-- Row Level Security for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage coupons" 
    ON coupons 
    FOR ALL 
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE (raw_app_meta_data->>'role')::text = 'admin'));

-- Row Level Security for coupon usage logs
ALTER TABLE coupon_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own usage logs" 
    ON coupon_usage_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Row Level Security for corporate email domains
ALTER TABLE corporate_email_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage corporate domains" 
    ON corporate_email_domains 
    FOR ALL 
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE (raw_app_meta_data->>'role')::text = 'admin'));

-- Seed data for hardcoded coupons
INSERT INTO coupons (
    code, description, coupon_type, value, 
    valid_from, valid_until, 
    max_total_usage, max_per_user, 
    min_spend, max_discount,
    applicability,
    allowed_regions
) VALUES 
    (
        'WELCOME10', 
        '10% off welcome discount', 
        'percentage', 
        10, 
        NULL, 
        NULL, 
        1000, 
        1, 
        NULL, 
        50,
        'global',
        NULL
    ),
    (
        'SAVE20', 
        '20% off with minimum $50 spend', 
        'percentage', 
        20, 
        NULL, 
        NULL, 
        500, 
        1, 
        50, 
        100,
        'global',
        NULL
    ),
    (
        'SUMMER2025', 
        '15% off for EU/US/ASIA', 
        'percentage', 
        15, 
        '2025-06-01'::TIMESTAMPTZ, 
        '2025-08-31'::TIMESTAMPTZ, 
        250, 
        1, 
        NULL, 
        75,
        'region_specific',
        ARRAY['EU', 'US', 'ASIA']
    ),
    (
        'FIXED50', 
        '$50 off with minimum $100 spend', 
        'fixed_amount', 
        50, 
        NULL, 
        NULL, 
        100, 
        1, 
        100, 
        50,
        'global',
        NULL
    );

-- Seed data for corporate email domains
INSERT INTO corporate_email_domains (
    domain, discount_percentage, max_discount, min_spend
) VALUES 
    ('company.com', 15, 100, 50),
    ('enterprise.org', 20, 150, 75),
    ('university.edu', 25, 200, 100),
    ('government.gov', 30, 250, 125);