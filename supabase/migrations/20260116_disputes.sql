-- Create disputes table for booking complaints
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
    resolution TEXT CHECK (resolution IN ('refund_full', 'refund_partial', 'release_to_partner', 'no_action')),
    resolution_amount INTEGER DEFAULT 0,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each booking can only have one active dispute
    CONSTRAINT unique_booking_dispute UNIQUE (booking_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_user ON disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
-- Users can create disputes for their own bookings
CREATE POLICY "Users can create disputes"
    ON disputes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own disputes
CREATE POLICY "Users can view own disputes"
    ON disputes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Partners can view disputes related to their bookings
CREATE POLICY "Partners can view related disputes"
    ON disputes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = disputes.booking_id
            AND bookings.partner_id = auth.uid()
        )
    );

-- Service role can manage all disputes (for admin and edge functions)
CREATE POLICY "Service role can manage all disputes"
    ON disputes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add disputed status to bookings if not exists
DO $$
BEGIN
    -- Check if the constraint exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'bookings_status_check'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    END IF;

    -- Add new constraint with disputed status
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
        CHECK (status IN ('pending', 'accepted', 'rejected', 'arrived', 'in_progress', 'completed_pending', 'completed', 'auto_rejected', 'disputed', 'cancelled'));
EXCEPTION
    WHEN others THEN
        -- Constraint might not exist or table structure is different
        NULL;
END
$$;

-- Add dispute_paused_at column to bookings for tracking when auto-complete was paused
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'dispute_paused_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN dispute_paused_at TIMESTAMPTZ;
    END IF;
END
$$;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS disputes_updated_at_trigger ON disputes;
CREATE TRIGGER disputes_updated_at_trigger
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_disputes_updated_at();
