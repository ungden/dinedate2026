-- ============================================================
-- DineDate 2026 - Topup Requests (SePay payment integration)
-- Tracks pending bank transfer topup requests matched by transfer_code
-- ============================================================

CREATE TABLE IF NOT EXISTS public.topup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  transfer_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_topup_requests_user ON public.topup_requests(user_id);
CREATE INDEX idx_topup_requests_code ON public.topup_requests(transfer_code) WHERE status = 'pending';
CREATE INDEX idx_topup_requests_status ON public.topup_requests(status, created_at DESC);

-- RLS
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own topup requests
CREATE POLICY "View own topup requests" ON public.topup_requests
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own topup requests
CREATE POLICY "Create own topup requests" ON public.topup_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can cancel their own pending requests
CREATE POLICY "Cancel own pending topup requests" ON public.topup_requests
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Service role can do anything (webhook uses service role key)
CREATE POLICY "Service role topup_requests" ON public.topup_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Admin access
CREATE POLICY "Admin topup_requests" ON public.topup_requests
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
