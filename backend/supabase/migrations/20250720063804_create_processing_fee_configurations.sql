-- Processing fee configurations table
CREATE TABLE processing_fee_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Main processing fees (stored as decimals, e.g., 1.4% = 0.014)
    israeli_cards_rate DECIMAL(5,4) NOT NULL DEFAULT 0.014,     -- 1.4%
    foreign_cards_rate DECIMAL(5,4) NOT NULL DEFAULT 0.039,     -- 3.9%
    premium_diners_rate DECIMAL(5,4) NOT NULL DEFAULT 0.003,    -- 0.3%
    premium_amex_rate DECIMAL(5,4) NOT NULL DEFAULT 0.008,      -- 0.8%
    bit_payment_rate DECIMAL(5,4) NOT NULL DEFAULT 0.001,       -- 0.1%
    
    -- Fixed fees (stored in ILS agorot, e.g., 9.90 ILS = 990)
    fixed_fee_nis INTEGER NOT NULL DEFAULT 0,                   -- ILS 0
    fixed_fee_foreign INTEGER NOT NULL DEFAULT 0,               -- ILS 0
    monthly_fixed_cost INTEGER NOT NULL DEFAULT 0,              -- per agreement
    bank_withdrawal_fee INTEGER NOT NULL DEFAULT 990,           -- ILS 9.90
    monthly_minimum_fee INTEGER NOT NULL DEFAULT 0,             -- ILS 0
    setup_cost INTEGER NOT NULL DEFAULT 25000,                  -- ILS 250
    
    -- Additional services (stored in ILS agorot)
    three_d_secure_fee INTEGER NOT NULL DEFAULT 0,              -- Custom pricing
    chargeback_fee INTEGER NOT NULL DEFAULT 5000,               -- ILS 50
    cancellation_fee INTEGER NOT NULL DEFAULT 3000,             -- ILS 30
    invoice_service_fee INTEGER NOT NULL DEFAULT 6900,          -- ILS 69
    apple_google_pay_fee INTEGER NOT NULL DEFAULT 0,            -- ILS 0
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from),
    CONSTRAINT valid_rates CHECK (
        israeli_cards_rate >= 0 AND israeli_cards_rate <= 1 AND
        foreign_cards_rate >= 0 AND foreign_cards_rate <= 1 AND
        premium_diners_rate >= 0 AND premium_diners_rate <= 1 AND
        premium_amex_rate >= 0 AND premium_amex_rate <= 1 AND
        bit_payment_rate >= 0 AND bit_payment_rate <= 1
    )
);

-- Index for querying active configurations
CREATE INDEX idx_processing_fee_active_effective 
ON processing_fee_configurations (is_active, effective_from, effective_to) 
WHERE is_active = true;

-- Index for historical queries
CREATE INDEX idx_processing_fee_created_at 
ON processing_fee_configurations (created_at DESC);

-- Ensure only one active configuration at any given time
CREATE UNIQUE INDEX idx_processing_fee_single_active 
ON processing_fee_configurations (is_active) 
WHERE is_active = true AND effective_to IS NULL;

-- Enable RLS
ALTER TABLE processing_fee_configurations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read, but only admins to write
CREATE POLICY "Users can read processing fee configurations" ON processing_fee_configurations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage processing fee configurations" ON processing_fee_configurations
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default configuration
INSERT INTO processing_fee_configurations (
    created_by, 
    notes
) VALUES (
    'system_default',
    'Default processing fee configuration based on payment provider quote'
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_processing_fee_configurations_updated_at 
    BEFORE UPDATE ON processing_fee_configurations 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();