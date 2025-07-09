-- Sample data plans for testing
-- These represent typical eSIM Go unlimited data plans

-- Europe Plans
INSERT INTO data_plans (name, description, countries, region, duration, price, is_unlimited, bundle_group) VALUES
('esim_UNLIMITED_7D_EU_V2', 'Unlimited data in Europe for 7 days', 
 '["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]'::json, 
 'Europe', 7, 29.99, true, 'EUROPE_UNLIMITED'),
('esim_UNLIMITED_30D_EU_V2', 'Unlimited data in Europe for 30 days', 
 '["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]'::json, 
 'Europe', 30, 89.99, true, 'EUROPE_UNLIMITED'),
('esim_UNLIMITED_90D_EU_V2', 'Unlimited data in Europe for 90 days', 
 '["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]'::json, 
 'Europe', 90, 249.99, true, 'EUROPE_UNLIMITED');

-- Asia Plans
INSERT INTO data_plans (name, description, countries, region, duration, price, is_unlimited, bundle_group) VALUES
('esim_UNLIMITED_7D_ASIA_V2', 'Unlimited data in Asia for 7 days', 
 '["JP", "KR", "SG", "MY", "TH", "VN", "ID", "PH", "HK", "MO", "TW", "IN", "LK", "BD", "NP", "PK"]'::json, 
 'Asia', 7, 34.99, true, 'ASIA_UNLIMITED'),
('esim_UNLIMITED_30D_ASIA_V2', 'Unlimited data in Asia for 30 days', 
 '["JP", "KR", "SG", "MY", "TH", "VN", "ID", "PH", "HK", "MO", "TW", "IN", "LK", "BD", "NP", "PK"]'::json, 
 'Asia', 30, 99.99, true, 'ASIA_UNLIMITED');

-- Americas Plans
INSERT INTO data_plans (name, description, countries, region, duration, price, is_unlimited, bundle_group) VALUES
('esim_UNLIMITED_7D_USA_V2', 'Unlimited data in USA for 7 days', 
 '["US"]'::json, 
 'Americas', 7, 39.99, true, 'USA_UNLIMITED'),
('esim_UNLIMITED_30D_USA_V2', 'Unlimited data in USA for 30 days', 
 '["US"]'::json, 
 'Americas', 30, 119.99, true, 'USA_UNLIMITED'),
('esim_UNLIMITED_7D_AMERICAS_V2', 'Unlimited data in Americas for 7 days', 
 '["US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "EC", "UY", "PY", "BO", "VE", "GY", "SR", "GF"]'::json, 
 'Americas', 7, 44.99, true, 'AMERICAS_UNLIMITED');

-- Global Plans
INSERT INTO data_plans (name, description, countries, region, duration, price, is_unlimited, bundle_group) VALUES
('esim_UNLIMITED_7D_GLOBAL_V2', 'Unlimited data globally for 7 days', 
 '["US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "JP", "KR", "SG", "MY", "TH", "VN", "ID", "PH", "HK", "MO", "TW", "IN", "AU", "NZ", "ZA", "EG", "MA", "TN", "KE", "NG", "GH"]'::json, 
 'Global', 7, 69.99, true, 'GLOBAL_UNLIMITED'),
('esim_UNLIMITED_30D_GLOBAL_V2', 'Unlimited data globally for 30 days', 
 '["US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "JP", "KR", "SG", "MY", "TH", "VN", "ID", "PH", "HK", "MO", "TW", "IN", "AU", "NZ", "ZA", "EG", "MA", "TN", "KE", "NG", "GH"]'::json, 
 'Global', 30, 199.99, true, 'GLOBAL_UNLIMITED');

-- Regional specific plans
INSERT INTO data_plans (name, description, countries, region, duration, price, is_unlimited, bundle_group) VALUES
('esim_UNLIMITED_7D_MEA_V2', 'Unlimited data in Middle East & Africa for 7 days', 
 '["AE", "SA", "QA", "KW", "BH", "OM", "JO", "IL", "EG", "MA", "TN", "ZA", "KE", "NG", "GH", "ET", "TZ", "UG", "RW"]'::json, 
 'Middle East & Africa', 7, 49.99, true, 'MEA_UNLIMITED'),
('esim_UNLIMITED_7D_OCEANIA_V2', 'Unlimited data in Oceania for 7 days', 
 '["AU", "NZ", "FJ", "PG", "NC", "PF", "WS", "TO", "VU", "SB"]'::json, 
 'Oceania', 7, 44.99, true, 'OCEANIA_UNLIMITED');

-- Add some indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_plans_price_range ON data_plans(price);
CREATE INDEX IF NOT EXISTS idx_data_plans_duration_region ON data_plans(duration, region);