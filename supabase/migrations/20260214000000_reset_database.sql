-- ============================================================
-- DineDate 2026 - RESET: Drop all old tables from previous model
-- This migration drops the old "hire a date partner" schema
-- and prepares for the new "Blind Date x Restaurant Discovery" model
-- ============================================================

-- Drop old tables in dependency order (child tables first)
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.blocked_users CASCADE;
DROP TABLE IF EXISTS public.referral_rewards CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.promo_code_usages CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.phone_verifications CASCADE;
DROP TABLE IF EXISTS public.featured_slots CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.topup_requests CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.date_requests CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.partner_agreements CASCADE;
DROP TABLE IF EXISTS public.admin_config CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop old types if they exist
DROP TYPE IF EXISTS public.booking_status CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;
DROP TYPE IF EXISTS public.date_request_status CASCADE;
DROP TYPE IF EXISTS public.service_category CASCADE;
DROP TYPE IF EXISTS public.dispute_status CASCADE;
DROP TYPE IF EXISTS public.report_status CASCADE;
DROP TYPE IF EXISTS public.ticket_status CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.withdrawal_status CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.auto_booking_check() CASCADE;

-- NOTE: We keep the public.users table as it's linked to auth.users
-- But we need to make sure it has the right columns for DineDate

-- Add new columns to users table if they don't exist
DO $$ 
BEGIN
  -- Add wallet columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'wallet_balance') THEN
    ALTER TABLE public.users ADD COLUMN wallet_balance INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'wallet_escrow') THEN
    ALTER TABLE public.users ADD COLUMN wallet_escrow INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'vip_tier') THEN
    ALTER TABLE public.users ADD COLUMN vip_tier TEXT DEFAULT 'free' CHECK (vip_tier IN ('free', 'vip', 'svip'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'rating') THEN
    ALTER TABLE public.users ADD COLUMN rating NUMERIC(3,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'review_count') THEN
    ALTER TABLE public.users ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'real_avatar') THEN
    ALTER TABLE public.users ADD COLUMN real_avatar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'gender') THEN
    ALTER TABLE public.users ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'birth_year') THEN
    ALTER TABLE public.users ADD COLUMN birth_year INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'bio') THEN
    ALTER TABLE public.users ADD COLUMN bio TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'location') THEN
    ALTER TABLE public.users ADD COLUMN location TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_online') THEN
    ALTER TABLE public.users ADD COLUMN is_online BOOLEAN DEFAULT false;
  END IF;
END $$;
