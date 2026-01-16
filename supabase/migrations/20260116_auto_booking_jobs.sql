-- ============================================================================
-- Auto Booking Jobs Migration
-- ============================================================================
-- This migration sets up scheduled jobs for auto-completing and auto-rejecting bookings.
--
-- IMPORTANT: pg_cron is only available on Supabase Pro plans and above.
-- For free tier, use Supabase Dashboard > SQL Editor to run these manually,
-- or set up external cron (e.g., GitHub Actions, Vercel Cron, or any scheduler).
-- ============================================================================

-- Add new columns to bookings table for tracking auto-actions
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS auto_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_rejected BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on status and timestamps
CREATE INDEX IF NOT EXISTS idx_bookings_status_updated_at ON bookings(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_created_at ON bookings(status, created_at);

-- ============================================================================
-- OPTION 1: Using pg_cron (Supabase Pro+ only)
-- ============================================================================
-- Enable pg_cron extension (requires Supabase Pro plan)
-- Uncomment the following lines if you have pg_cron access:

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- -- Schedule auto-complete job to run every hour
-- SELECT cron.schedule(
--     'auto-complete-bookings',
--     '0 * * * *', -- Every hour at minute 0
--     $$
--     SELECT net.http_post(
--         url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-complete-bookings',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--         ),
--         body := '{}'::jsonb
--     );
--     $$
-- );

-- -- Schedule auto-reject job to run every hour
-- SELECT cron.schedule(
--     'auto-reject-bookings',
--     '30 * * * *', -- Every hour at minute 30 (offset to avoid collision)
--     $$
--     SELECT net.http_post(
--         url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-reject-bookings',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--         ),
--         body := '{}'::jsonb
--     );
--     $$
-- );

-- ============================================================================
-- OPTION 2: Using Database Webhooks + pg_net (Alternative)
-- ============================================================================
-- If pg_cron is not available, you can use pg_net to call functions directly.
-- Enable pg_net extension:

-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- OPTION 3: Manual Setup via Supabase Dashboard
-- ============================================================================
-- If neither pg_cron nor automated scheduling is available:
--
-- 1. Go to Supabase Dashboard > Database > Extensions
-- 2. Enable "pg_cron" (if available on your plan)
-- 3. Go to Database > SQL Editor
-- 4. Run the cron.schedule commands above
--
-- OR set up external cron jobs:
--
-- For GitHub Actions (.github/workflows/auto-booking-jobs.yml):
-- ```yaml
-- name: Auto Booking Jobs
-- on:
--   schedule:
--     - cron: '0 * * * *'  # Every hour
-- jobs:
--   auto-complete:
--     runs-on: ubuntu-latest
--     steps:
--       - name: Call auto-complete-bookings
--         run: |
--           curl -X POST \
--             "${SUPABASE_URL}/functions/v1/auto-complete-bookings" \
--             -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
--             -H "Content-Type: application/json"
--   auto-reject:
--     runs-on: ubuntu-latest
--     steps:
--       - name: Call auto-reject-bookings
--         run: |
--           curl -X POST \
--             "${SUPABASE_URL}/functions/v1/auto-reject-bookings" \
--             -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
--             -H "Content-Type: application/json"
-- ```
--
-- For Vercel Cron (vercel.json):
-- ```json
-- {
--   "crons": [
--     {
--       "path": "/api/cron/auto-complete-bookings",
--       "schedule": "0 * * * *"
--     },
--     {
--       "path": "/api/cron/auto-reject-bookings",
--       "schedule": "30 * * * *"
--     }
--   ]
-- }
-- ```
-- Then create API routes that call the Supabase edge functions.

-- ============================================================================
-- Helper function to check booking deadlines (useful for debugging)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_pending_auto_actions()
RETURNS TABLE (
    booking_id UUID,
    status TEXT,
    action_type TEXT,
    time_since_update INTERVAL,
    deadline_passed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Bookings pending auto-completion (24h after completed_pending)
    SELECT
        b.id as booking_id,
        b.status::TEXT,
        'auto_complete'::TEXT as action_type,
        (NOW() - b.updated_at) as time_since_update,
        (NOW() - b.updated_at) > INTERVAL '24 hours' as deadline_passed
    FROM bookings b
    WHERE b.status = 'completed_pending'

    UNION ALL

    -- Bookings pending auto-rejection (4h after pending)
    SELECT
        b.id as booking_id,
        b.status::TEXT,
        'auto_reject'::TEXT as action_type,
        (NOW() - b.created_at) as time_since_update,
        (NOW() - b.created_at) > INTERVAL '4 hours' as deadline_passed
    FROM bookings b
    WHERE b.status = 'pending'

    ORDER BY deadline_passed DESC, time_since_update DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_pending_auto_actions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_auto_actions() TO service_role;

-- ============================================================================
-- Add comment for documentation
-- ============================================================================
COMMENT ON FUNCTION get_pending_auto_actions() IS
'Returns all bookings that are pending auto-completion or auto-rejection.
Use this to monitor which bookings will be processed by the scheduled jobs.
- auto_complete: Bookings in completed_pending status > 24 hours
- auto_reject: Bookings in pending status > 4 hours';
