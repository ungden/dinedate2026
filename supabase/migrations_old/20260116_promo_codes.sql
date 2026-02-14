-- Promo Codes / Coupon System for DineDate
-- ==========================================

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL, -- Percentage (1-100) or VND amount
    min_order_amount INTEGER DEFAULT 0, -- Minimum order to apply
    max_discount_amount INTEGER DEFAULT 0, -- Max discount for percentage (0 = no limit)
    usage_limit INTEGER DEFAULT 0, -- Total uses allowed (0 = unlimited)
    used_count INTEGER DEFAULT 0, -- Current total uses
    user_limit INTEGER DEFAULT 1, -- Uses per user (0 = unlimited)
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    first_booking_only BOOLEAN DEFAULT FALSE, -- Only for users with no prior bookings
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo_code_usages table for tracking who used what
CREATE TABLE IF NOT EXISTS promo_code_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    discount_amount INTEGER NOT NULL, -- Actual discount applied
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_code_usages_promo ON promo_code_usages(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usages_user ON promo_code_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usages_booking ON promo_code_usages(booking_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
-- Anyone can read active promo codes (to validate)
CREATE POLICY "Anyone can read active promo codes"
    ON promo_codes FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Service role can manage all promo codes (for admin and edge functions)
CREATE POLICY "Service role can manage all promo codes"
    ON promo_codes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for promo_code_usages
-- Users can view their own usage history
CREATE POLICY "Users can view own promo usage"
    ON promo_code_usages FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can manage all usages
CREATE POLICY "Service role can manage all promo usages"
    ON promo_code_usages FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS promo_codes_updated_at_trigger ON promo_codes;
CREATE TRIGGER promo_codes_updated_at_trigger
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_promo_codes_updated_at();

-- Add promo_code_id and discount_amount to bookings table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'promo_code_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN promo_code_id UUID REFERENCES promo_codes(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'promo_discount'
    ) THEN
        ALTER TABLE bookings ADD COLUMN promo_discount INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'original_amount'
    ) THEN
        ALTER TABLE bookings ADD COLUMN original_amount INTEGER DEFAULT 0;
    END IF;
END
$$;

-- Create index for bookings promo_code_id
CREATE INDEX IF NOT EXISTS idx_bookings_promo_code ON bookings(promo_code_id);

-- Insert default promo code: NEWUSER - 20% off first booking
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, user_limit, valid_until, is_active, first_booking_only, created_by)
VALUES (
    'NEWUSER',
    'Giam 20% cho nguoi dung moi - Booking dau tien',
    'percentage',
    20,
    0, -- No minimum
    500000, -- Max 500k VND discount
    0, -- Unlimited total uses
    1, -- 1 use per user
    '2027-12-31 23:59:59+07', -- Valid until end of 2027
    TRUE,
    TRUE, -- First booking only
    NULL
)
ON CONFLICT (code) DO NOTHING;
