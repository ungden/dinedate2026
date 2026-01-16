-- Add onboarding_completed column to users table
-- This tracks whether a user has completed the onboarding tutorial

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

-- Add onboarding_completed_at timestamp to track when user completed onboarding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'onboarding_completed_at'
    ) THEN
        ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
END
$$;

-- Create index for efficient queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Whether the user has completed the onboarding tutorial';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when the user completed the onboarding tutorial';
