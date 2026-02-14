-- Rate Limits Table for Persistent Rate Limit Tracking
-- This table stores rate limit state that persists across server restarts
-- Used by Supabase Edge Functions for IP/user-based rate limiting

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identifier: can be IP address, user_id, or combination
    identifier TEXT NOT NULL,
    -- Endpoint category (auth, booking, message, etc.)
    endpoint TEXT NOT NULL,
    -- Current token count
    tokens DECIMAL(10, 2) NOT NULL DEFAULT 0,
    -- Last time tokens were refilled
    last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Track when this record was created
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Composite unique constraint
    UNIQUE(identifier, endpoint)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(identifier, endpoint);

-- Create index for cleanup job
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_refill ON rate_limits(last_refill);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access to rate_limits"
    ON rate_limits
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to check and update rate limit
-- Returns: tokens_remaining (negative means rate limited)
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_tokens INTEGER DEFAULT 60,
    p_refill_rate INTEGER DEFAULT 60,
    p_refill_interval_seconds INTEGER DEFAULT 60
) RETURNS TABLE(
    allowed BOOLEAN,
    tokens_remaining DECIMAL,
    retry_after_seconds INTEGER
) AS $$
DECLARE
    v_record rate_limits%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
    v_time_passed_seconds DECIMAL;
    v_tokens_to_add DECIMAL;
    v_new_tokens DECIMAL;
    v_retry_after INTEGER;
BEGIN
    -- Get or create rate limit record
    SELECT * INTO v_record
    FROM rate_limits
    WHERE identifier = p_identifier AND endpoint = p_endpoint
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Create new record with full tokens
        INSERT INTO rate_limits (identifier, endpoint, tokens, last_refill)
        VALUES (p_identifier, p_endpoint, p_max_tokens - 1, v_now)
        RETURNING * INTO v_record;

        RETURN QUERY SELECT TRUE, v_record.tokens, 0;
        RETURN;
    END IF;

    -- Calculate tokens to add based on time elapsed
    v_time_passed_seconds := EXTRACT(EPOCH FROM (v_now - v_record.last_refill));
    v_tokens_to_add := FLOOR(v_time_passed_seconds / p_refill_interval_seconds) * p_refill_rate;

    -- Update tokens (cap at max)
    v_new_tokens := LEAST(p_max_tokens, v_record.tokens + v_tokens_to_add);

    -- Check if we have tokens
    IF v_new_tokens < 1 THEN
        -- Calculate retry after
        v_retry_after := CEIL(p_refill_interval_seconds - MOD(v_time_passed_seconds, p_refill_interval_seconds));

        -- Update last_refill if we added tokens
        IF v_tokens_to_add > 0 THEN
            UPDATE rate_limits
            SET tokens = v_new_tokens, last_refill = v_now
            WHERE id = v_record.id;
        END IF;

        RETURN QUERY SELECT FALSE, v_new_tokens, v_retry_after;
        RETURN;
    END IF;

    -- Consume a token
    v_new_tokens := v_new_tokens - 1;

    -- Update record
    UPDATE rate_limits
    SET tokens = v_new_tokens, last_refill = v_now
    WHERE id = v_record.id;

    RETURN QUERY SELECT TRUE, v_new_tokens, 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old rate limit records (call via cron)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete records older than 1 hour
    DELETE FROM rate_limits
    WHERE last_refill < NOW() - INTERVAL '1 hour';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits TO service_role;

-- Add comment for documentation
COMMENT ON TABLE rate_limits IS 'Persistent rate limit tracking for API endpoints. Uses token bucket algorithm.';
COMMENT ON FUNCTION check_rate_limit IS 'Check and consume a rate limit token. Returns allowed=false if rate limited.';
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Cleanup stale rate limit records. Should be called by cron every hour.';
