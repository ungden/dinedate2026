-- Create reports table for user reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate reports from same user for same reported user (in pending/reviewed status)
    CONSTRAINT unique_active_report UNIQUE (reporter_id, reported_user_id, status)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate blocks
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_user_id),
    -- Cannot block yourself
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_user_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_user_id);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
-- Users can create reports (but not for themselves)
CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = reporter_id
        AND auth.uid() != reported_user_id
    );

-- Users can view their own reports (as reporter)
CREATE POLICY "Users can view own reports"
    ON reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id);

-- Admin can view all reports (assuming role column exists or using a specific admin check)
-- For now, we'll allow service role to access all
CREATE POLICY "Service role can manage all reports"
    ON reports FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for blocked_users
-- Users can create blocks (but not for themselves)
CREATE POLICY "Users can create blocks"
    ON blocked_users FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = blocker_id
        AND auth.uid() != blocked_user_id
    );

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
    ON blocked_users FOR SELECT
    TO authenticated
    USING (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete own blocks"
    ON blocked_users FOR DELETE
    TO authenticated
    USING (auth.uid() = blocker_id);

-- Service role can manage all blocks
CREATE POLICY "Service role can manage all blocks"
    ON blocked_users FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add is_banned column to users if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_banned'
    ) THEN
        ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

-- Create index on is_banned for filtering
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS reports_updated_at_trigger ON reports;
CREATE TRIGGER reports_updated_at_trigger
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();
