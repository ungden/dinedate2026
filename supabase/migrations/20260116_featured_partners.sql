-- Create featured_slots table for paid partner placements
CREATE TABLE IF NOT EXISTS featured_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_type TEXT NOT NULL CHECK (slot_type IN ('homepage_top', 'search_top', 'category_top')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    amount_paid INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_featured_slots_user ON featured_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_slots_status ON featured_slots(status);
CREATE INDEX IF NOT EXISTS idx_featured_slots_type ON featured_slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_featured_slots_dates ON featured_slots(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_featured_slots_active ON featured_slots(status, slot_type, end_date)
    WHERE status = 'active';

-- Enable RLS
ALTER TABLE featured_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for featured_slots
-- Users can view all active featured slots (for display purposes)
CREATE POLICY "Anyone can view active featured slots"
    ON featured_slots FOR SELECT
    TO authenticated
    USING (status = 'active');

-- Users can view their own featured slots (any status)
CREATE POLICY "Users can view own featured slots"
    ON featured_slots FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can manage all featured slots (for edge functions)
CREATE POLICY "Service role can manage all featured slots"
    ON featured_slots FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_featured_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS featured_slots_updated_at_trigger ON featured_slots;
CREATE TRIGGER featured_slots_updated_at_trigger
    BEFORE UPDATE ON featured_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_featured_slots_updated_at();

-- Function to automatically expire slots
CREATE OR REPLACE FUNCTION expire_featured_slots()
RETURNS void AS $$
BEGIN
    UPDATE featured_slots
    SET status = 'expired'
    WHERE status = 'active'
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run expire function (if pg_cron is available)
-- This is optional and depends on your Supabase setup
-- SELECT cron.schedule('expire-featured-slots', '*/5 * * * *', 'SELECT expire_featured_slots()');
