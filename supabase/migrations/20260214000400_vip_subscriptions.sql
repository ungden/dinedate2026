-- ============================================================
-- DineDate 2026 - VIP Subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'quarterly', 'yearly')),
  price INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add VIP subscription columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_subscribed_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS food_preferences TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_dates INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_connections INTEGER DEFAULT 0;

-- Drop partner-specific columns (safely with IF EXISTS)
ALTER TABLE public.users DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE public.users DROP COLUMN IF EXISTS available_now;
ALTER TABLE public.users DROP COLUMN IF EXISTS available_tonight;
ALTER TABLE public.users DROP COLUMN IF EXISTS is_partner_verified;
ALTER TABLE public.users DROP COLUMN IF EXISTS is_pro;
ALTER TABLE public.users DROP COLUMN IF EXISTS partner_agreed_at;
ALTER TABLE public.users DROP COLUMN IF EXISTS partner_agreed_version;
ALTER TABLE public.users DROP COLUMN IF EXISTS partner_rules;
ALTER TABLE public.users DROP COLUMN IF EXISTS voice_intro_url;

-- Update role constraint: remove 'partner' option
-- (Do NOT drop if there are existing partner rows - just update them first)
UPDATE public.users SET role = 'user' WHERE role = 'partner';

-- Index
CREATE INDEX idx_vip_subscriptions_user ON public.vip_subscriptions(user_id);
CREATE INDEX idx_vip_subscriptions_active ON public.vip_subscriptions(is_active, end_date);

-- RLS
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own subscriptions" ON public.vip_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role vip_subscriptions" ON public.vip_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin vip_subscriptions" ON public.vip_subscriptions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
