-- ============================================================
-- DineDate 2026 - Admin Tables
-- Recreates tables needed by admin dashboard that were dropped
-- in 20260214000000_reset_database.sql: disputes, support_tickets,
-- ticket_messages, promo_codes, promo_code_usages, error_logs
-- Also adds is_hidden column to review tables
-- ============================================================

-- ============================================================
-- 1. Disputes table (references date_orders, not old bookings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_order_id UUID NOT NULL REFERENCES public.date_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('no_show', 'bad_behavior', 'wrong_restaurant', 'food_quality', 'other')),
  description TEXT DEFAULT '',
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
  resolution TEXT CHECK (resolution IN ('refund_full', 'refund_partial', 'no_action')),
  resolution_amount INTEGER,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_user ON public.disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_date_order ON public.disputes(date_order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own disputes" ON public.disputes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own disputes" ON public.disputes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role disputes" ON public.disputes
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin disputes" ON public.disputes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 2. Support tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('booking', 'payment', 'account', 'technical', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date_order_id UUID REFERENCES public.date_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own tickets" ON public.support_tickets
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role tickets" ON public.support_tickets
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin tickets" ON public.support_tickets
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 3. Ticket messages (chat thread within a ticket)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ticket messages" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );
CREATE POLICY "Users create messages on own tickets" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );
CREATE POLICY "Service role ticket_messages" ON public.ticket_messages
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin ticket_messages" ON public.ticket_messages
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 4. Promo codes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount INTEGER DEFAULT 0,
  max_discount INTEGER,
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_first_booking_only BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Users can read active promo codes
CREATE POLICY "Users read active promos" ON public.promo_codes
  FOR SELECT USING (is_active = true);
CREATE POLICY "Service role promo_codes" ON public.promo_codes
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin promo_codes" ON public.promo_codes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 5. Promo code usages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promo_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_order_id UUID REFERENCES public.date_orders(id) ON DELETE SET NULL,
  discount_amount INTEGER NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id, date_order_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_usages_code ON public.promo_code_usages(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usages_user ON public.promo_code_usages(user_id);

ALTER TABLE public.promo_code_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usages" ON public.promo_code_usages
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role promo_usages" ON public.promo_code_usages
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin promo_usages" ON public.promo_code_usages
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 6. Error logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error')),
  url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(is_resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role error_logs" ON public.error_logs
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin error_logs" ON public.error_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 7. Add is_hidden column to review tables
-- ============================================================
ALTER TABLE public.person_reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- ============================================================
-- 8. Add is_banned column to users (if not exists)
-- ============================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- ============================================================
-- 9. updated_at triggers for new tables
-- ============================================================
CREATE TRIGGER trigger_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
