-- Phone Verifications Table for OTP Storage
-- Created: 2026-01-16

-- Create phone_verifications table
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(15) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON phone_verifications(expires_at);

-- Add phone_verified and phone_verified_at columns to users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_verified') THEN
    ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_verified_at') THEN
    ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index for phone verification status
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- Enable Row Level Security
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phone_verifications
-- Users can only read their own verification records
CREATE POLICY "Users can view own verification records" ON phone_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update/delete (handled by edge functions)
-- No direct insert/update/delete policies for regular users

-- Function to clean up expired OTP records (optional, can be run as cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM phone_verifications
  WHERE expires_at < NOW()
  AND verified = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO service_role;

COMMENT ON TABLE phone_verifications IS 'Stores OTP codes for phone number verification';
COMMENT ON COLUMN phone_verifications.user_id IS 'Reference to the user requesting verification';
COMMENT ON COLUMN phone_verifications.phone IS 'Phone number being verified (Vietnamese format)';
COMMENT ON COLUMN phone_verifications.otp_code IS '6-digit OTP code';
COMMENT ON COLUMN phone_verifications.expires_at IS 'OTP expiration timestamp (5 minutes from creation)';
COMMENT ON COLUMN phone_verifications.verified IS 'Whether the OTP was successfully verified';
COMMENT ON COLUMN phone_verifications.attempts IS 'Number of verification attempts (max 5)';
