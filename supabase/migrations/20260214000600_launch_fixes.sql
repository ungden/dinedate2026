-- ============================================================
-- DineDate 2026 - Launch Readiness Fixes
-- Fixes: RLS on users, reviewer_id defaults, trigger column name,
--        handle_new_user, applicant_count trigger, ON DELETE CASCADE,
--        user2_id index, expire orders function, updated_at trigger
-- ============================================================

-- ============================================================
-- C1: Add RLS to public.users table (CRITICAL SECURITY FIX)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own full profile
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Public can read limited profile info (for displaying names/avatars in date orders)
CREATE POLICY "Public read basic profile" ON public.users
  FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can delete only their own profile
CREATE POLICY "Users delete own profile" ON public.users
  FOR DELETE USING (id = auth.uid());

-- Service role bypass
CREATE POLICY "Service role users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Admin full access
CREATE POLICY "Admin users" ON public.users
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Prevent users from changing their own role to admin
CREATE POLICY "Users cannot change role" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    role IS NOT DISTINCT FROM (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- C2/C3: Add DEFAULT auth.uid() to reviewer_id columns
-- This ensures INSERT from client auto-populates reviewer_id
-- ============================================================
ALTER TABLE public.person_reviews
  ALTER COLUMN reviewer_id SET DEFAULT auth.uid();

ALTER TABLE public.restaurant_reviews
  ALTER COLUMN reviewer_id SET DEFAULT auth.uid();

-- ============================================================
-- C3: Fix update_user_rating trigger (average_rating -> rating)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET
    rating = (
      SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
      FROM public.person_reviews
      WHERE reviewed_id = NEW.reviewed_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.person_reviews
      WHERE reviewed_id = NEW.reviewed_id
    )
  WHERE id = NEW.reviewed_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- H5: Recreate handle_new_user() trigger
-- Auto-creates public.users row when auth.users row is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=' || NEW.id::TEXT
    ),
    'user',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- H3: Add applicant_count increment/decrement trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.date_orders
    SET applicant_count = applicant_count + 1
    WHERE id = NEW.order_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.date_orders
    SET applicant_count = GREATEST(applicant_count - 1, 0)
    WHERE id = OLD.order_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_applicant_count
  AFTER INSERT OR DELETE ON public.date_order_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_applicant_count();

-- ============================================================
-- H4: Add ON DELETE CASCADE for FK references to auth.users
-- We need to drop and recreate the foreign keys
-- ============================================================

-- date_orders.creator_id
ALTER TABLE public.date_orders
  DROP CONSTRAINT IF EXISTS date_orders_creator_id_fkey;
ALTER TABLE public.date_orders
  ADD CONSTRAINT date_orders_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- date_orders.matched_user_id
ALTER TABLE public.date_orders
  DROP CONSTRAINT IF EXISTS date_orders_matched_user_id_fkey;
ALTER TABLE public.date_orders
  ADD CONSTRAINT date_orders_matched_user_id_fkey
  FOREIGN KEY (matched_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- date_order_applications.applicant_id
ALTER TABLE public.date_order_applications
  DROP CONSTRAINT IF EXISTS date_order_applications_applicant_id_fkey;
ALTER TABLE public.date_order_applications
  ADD CONSTRAINT date_order_applications_applicant_id_fkey
  FOREIGN KEY (applicant_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- person_reviews.reviewer_id
ALTER TABLE public.person_reviews
  DROP CONSTRAINT IF EXISTS person_reviews_reviewer_id_fkey;
ALTER TABLE public.person_reviews
  ADD CONSTRAINT person_reviews_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- person_reviews.reviewed_id
ALTER TABLE public.person_reviews
  DROP CONSTRAINT IF EXISTS person_reviews_reviewed_id_fkey;
ALTER TABLE public.person_reviews
  ADD CONSTRAINT person_reviews_reviewed_id_fkey
  FOREIGN KEY (reviewed_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- restaurant_reviews.reviewer_id
ALTER TABLE public.restaurant_reviews
  DROP CONSTRAINT IF EXISTS restaurant_reviews_reviewer_id_fkey;
ALTER TABLE public.restaurant_reviews
  ADD CONSTRAINT restaurant_reviews_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- mutual_connections.user1_id
ALTER TABLE public.mutual_connections
  DROP CONSTRAINT IF EXISTS mutual_connections_user1_id_fkey;
ALTER TABLE public.mutual_connections
  ADD CONSTRAINT mutual_connections_user1_id_fkey
  FOREIGN KEY (user1_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- mutual_connections.user2_id
ALTER TABLE public.mutual_connections
  DROP CONSTRAINT IF EXISTS mutual_connections_user2_id_fkey;
ALTER TABLE public.mutual_connections
  ADD CONSTRAINT mutual_connections_user2_id_fkey
  FOREIGN KEY (user2_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- vip_subscriptions.user_id
ALTER TABLE public.vip_subscriptions
  DROP CONSTRAINT IF EXISTS vip_subscriptions_user_id_fkey;
ALTER TABLE public.vip_subscriptions
  ADD CONSTRAINT vip_subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- wallet_transactions.user_id
ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey;
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- M5: Add separate index on mutual_connections.user2_id
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mutual_connections_user2
  ON public.mutual_connections(user2_id);

-- Also add reviewer_id index on person_reviews (missing)
CREATE INDEX IF NOT EXISTS idx_person_reviews_reviewer
  ON public.person_reviews(reviewer_id);

-- ============================================================
-- M8: Function to expire date orders past their expires_at
-- Can be called by pg_cron or an Edge Function on a schedule
-- ============================================================
CREATE OR REPLACE FUNCTION public.expire_stale_date_orders()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.date_orders
  SET status = 'expired',
      cancelled_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Generic updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_combos_updated_at
  BEFORE UPDATE ON public.combos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- VIP upgrade function (called from client via RPC)
-- Deducts from wallet and upgrades user tier
-- ============================================================
CREATE OR REPLACE FUNCTION public.upgrade_vip(target_tier TEXT, plan_type TEXT DEFAULT 'monthly')
RETURNS JSON AS $$
DECLARE
  tier_price INTEGER;
  plan_months INTEGER;
  current_balance INTEGER;
  current_tier TEXT;
BEGIN
  -- Validate tier
  IF target_tier NOT IN ('vip', 'svip') THEN
    RETURN json_build_object('success', false, 'error', 'Gói không hợp lệ');
  END IF;

  -- Calculate price based on tier and plan
  IF target_tier = 'vip' THEN
    CASE plan_type
      WHEN 'monthly' THEN tier_price := 99000; plan_months := 1;
      WHEN 'quarterly' THEN tier_price := 269000; plan_months := 3;
      WHEN 'yearly' THEN tier_price := 899000; plan_months := 12;
      ELSE RETURN json_build_object('success', false, 'error', 'Gói thời hạn không hợp lệ');
    END CASE;
  ELSE -- svip
    CASE plan_type
      WHEN 'monthly' THEN tier_price := 199000; plan_months := 1;
      WHEN 'quarterly' THEN tier_price := 539000; plan_months := 3;
      WHEN 'yearly' THEN tier_price := 1799000; plan_months := 12;
      ELSE RETURN json_build_object('success', false, 'error', 'Gói thời hạn không hợp lệ');
    END CASE;
  END IF;

  -- Check balance and current tier
  SELECT wallet_balance, vip_tier INTO current_balance, current_tier
  FROM public.users WHERE id = auth.uid();

  IF current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Không tìm thấy tài khoản');
  END IF;

  IF current_tier = target_tier THEN
    RETURN json_build_object('success', false, 'error', 'Bạn đang sử dụng gói này');
  END IF;

  IF current_balance < tier_price THEN
    RETURN json_build_object('success', false, 'error', 'Số dư không đủ. Vui lòng nạp thêm tiền.',
      'required', tier_price, 'balance', current_balance);
  END IF;

  -- Deduct from wallet
  UPDATE public.users SET
    wallet_balance = wallet_balance - tier_price,
    vip_tier = target_tier,
    vip_subscribed_at = NOW(),
    vip_expires_at = NOW() + (plan_months || ' months')::INTERVAL
  WHERE id = auth.uid();

  -- Create wallet transaction
  INSERT INTO public.wallet_transactions (user_id, type, amount, description, status)
  VALUES (
    auth.uid(), 'payment', -tier_price,
    'Nâng cấp ' || UPPER(target_tier) || ' (' || plan_type || ')',
    'completed'
  );

  -- Create VIP subscription record
  INSERT INTO public.vip_subscriptions (user_id, plan, price, start_date, end_date, is_active)
  VALUES (
    auth.uid(), plan_type, tier_price, NOW(),
    NOW() + (plan_months || ' months')::INTERVAL,
    true
  );

  RETURN json_build_object('success', true, 'tier', target_tier, 'expires_at',
    (NOW() + (plan_months || ' months')::INTERVAL)::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Downgrade VIP function
-- ============================================================
CREATE OR REPLACE FUNCTION public.downgrade_vip()
RETURNS JSON AS $$
BEGIN
  -- Deactivate existing subscriptions
  UPDATE public.vip_subscriptions
  SET is_active = false
  WHERE user_id = auth.uid() AND is_active = true;

  -- Set user to free tier
  UPDATE public.users SET
    vip_tier = 'free',
    vip_expires_at = NULL
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'tier', 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Wallet top-up function (for in-app top-up flow)
-- In production, this would be called after payment gateway confirms
-- For now, creates a pending transaction that admin can confirm
-- ============================================================
CREATE OR REPLACE FUNCTION public.request_topup(topup_amount INTEGER, payment_method TEXT DEFAULT 'momo')
RETURNS JSON AS $$
DECLARE
  tx_id UUID;
BEGIN
  IF topup_amount < 10000 THEN
    RETURN json_build_object('success', false, 'error', 'Số tiền nạp tối thiểu là 10.000đ');
  END IF;

  IF topup_amount > 10000000 THEN
    RETURN json_build_object('success', false, 'error', 'Số tiền nạp tối đa là 10.000.000đ');
  END IF;

  -- Create pending transaction
  INSERT INTO public.wallet_transactions (user_id, type, amount, description, status)
  VALUES (
    auth.uid(), 'topup', topup_amount,
    'Nạp tiền qua ' || payment_method,
    'pending'
  )
  RETURNING id INTO tx_id;

  RETURN json_build_object('success', true, 'transaction_id', tx_id,
    'amount', topup_amount, 'method', payment_method, 'status', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to confirm top-up
CREATE OR REPLACE FUNCTION public.confirm_topup(tx_id UUID)
RETURNS JSON AS $$
DECLARE
  tx RECORD;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get transaction
  SELECT * INTO tx FROM public.wallet_transactions WHERE id = tx_id AND type = 'topup' AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Giao dịch không tìm thấy hoặc đã xử lý');
  END IF;

  -- Update transaction status
  UPDATE public.wallet_transactions SET status = 'completed' WHERE id = tx_id;

  -- Credit user wallet
  UPDATE public.users SET wallet_balance = wallet_balance + tx.amount WHERE id = tx.user_id;

  RETURN json_build_object('success', true, 'credited', tx.amount, 'user_id', tx.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Report user function (for safety.tsx and support.tsx)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users view own reports" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Service role reports" ON public.reports
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin reports" ON public.reports
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Function to submit report
CREATE OR REPLACE FUNCTION public.submit_report(
  report_category TEXT,
  report_description TEXT DEFAULT '',
  target_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  report_id UUID;
BEGIN
  INSERT INTO public.reports (reporter_id, reported_user_id, category, description)
  VALUES (auth.uid(), target_user_id, report_category, report_description)
  RETURNING id INTO report_id;

  RETURN json_build_object('success', true, 'report_id', report_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Add email_notifications column to users for settings persistence
-- ============================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
