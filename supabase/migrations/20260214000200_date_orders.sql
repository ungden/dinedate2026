-- ============================================================
-- DineDate 2026 - Date Orders (core booking entity)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.date_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
  combo_id UUID NOT NULL REFERENCES public.combos(id),
  date_time TIMESTAMPTZ NOT NULL,
  description TEXT DEFAULT '',
  preferred_gender TEXT CHECK (preferred_gender IN ('male', 'female', 'other') OR preferred_gender IS NULL),
  payment_split TEXT NOT NULL DEFAULT 'split' CHECK (payment_split IN ('split', 'creator_pays', 'applicant_pays')),
  -- Pricing (calculated at creation time)
  combo_price INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL DEFAULT 100000,   -- 100k per person
  creator_total INTEGER NOT NULL,
  applicant_total INTEGER NOT NULL,
  restaurant_commission INTEGER NOT NULL,
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matched', 'confirmed', 'completed', 'expired', 'cancelled', 'no_show')),
  matched_user_id UUID REFERENCES auth.users(id),
  matched_at TIMESTAMPTZ,
  -- Metadata
  max_applicants INTEGER DEFAULT 20,
  applicant_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Applications
CREATE TABLE IF NOT EXISTS public.date_order_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.date_orders(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, applicant_id)  -- One application per user per order
);

-- Table bookings (auto-created on match)
CREATE TABLE IF NOT EXISTS public.table_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_order_id UUID NOT NULL REFERENCES public.date_orders(id),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
  date_time TIMESTAMPTZ NOT NULL,
  party_size INTEGER DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  confirmation_code TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_date_orders_creator ON public.date_orders(creator_id);
CREATE INDEX idx_date_orders_status ON public.date_orders(status);
CREATE INDEX idx_date_orders_restaurant ON public.date_orders(restaurant_id);
CREATE INDEX idx_date_orders_datetime ON public.date_orders(date_time);
CREATE INDEX idx_date_orders_expires ON public.date_orders(expires_at);
CREATE INDEX idx_applications_order ON public.date_order_applications(order_id);
CREATE INDEX idx_applications_applicant ON public.date_order_applications(applicant_id);
CREATE INDEX idx_table_bookings_order ON public.table_bookings(date_order_id);

-- RLS
ALTER TABLE public.date_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_order_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_bookings ENABLE ROW LEVEL SECURITY;

-- Date orders: anyone can view active ones, own orders always visible
CREATE POLICY "View active date orders" ON public.date_orders
  FOR SELECT USING (status = 'active' OR creator_id = auth.uid() OR matched_user_id = auth.uid());

CREATE POLICY "Create own date orders" ON public.date_orders
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Update own date orders" ON public.date_orders
  FOR UPDATE USING (creator_id = auth.uid());

-- Applications: creator of order can see all, applicant sees own
CREATE POLICY "View applications" ON public.date_order_applications
  FOR SELECT USING (
    applicant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.date_orders WHERE id = order_id AND creator_id = auth.uid())
  );

CREATE POLICY "Create application" ON public.date_order_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

-- Table bookings: involved users can see
CREATE POLICY "View table bookings" ON public.table_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_orders
      WHERE id = date_order_id
      AND (creator_id = auth.uid() OR matched_user_id = auth.uid())
    )
  );

-- Service role bypass for all
CREATE POLICY "Service role date_orders" ON public.date_orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role applications" ON public.date_order_applications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role table_bookings" ON public.table_bookings FOR ALL USING (auth.role() = 'service_role');

-- Admin access
CREATE POLICY "Admin date_orders" ON public.date_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin applications" ON public.date_order_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin table_bookings" ON public.table_bookings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
