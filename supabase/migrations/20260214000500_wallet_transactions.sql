-- ============================================================
-- DineDate 2026 - Wallet Transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('topup', 'payment', 'escrow', 'refund', 'withdraw')),
  amount INTEGER NOT NULL,  -- positive for credit, negative for debit
  description TEXT DEFAULT '',
  -- Optional references
  date_order_id UUID REFERENCES public.date_orders(id),
  -- Metadata
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_wallet_transactions_order ON public.wallet_transactions(date_order_id) WHERE date_order_id IS NOT NULL;

-- RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own transactions
CREATE POLICY "View own transactions" ON public.wallet_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Only service role / triggers can insert transactions (no direct user inserts)
CREATE POLICY "Service role wallet_transactions" ON public.wallet_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Admin access
CREATE POLICY "Admin wallet_transactions" ON public.wallet_transactions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
