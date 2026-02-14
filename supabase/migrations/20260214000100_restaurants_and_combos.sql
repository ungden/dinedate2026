-- ============================================================
-- DineDate 2026 - Restaurants & Combos
-- ============================================================

-- Restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  address TEXT NOT NULL,
  area TEXT NOT NULL,           -- District/area
  city TEXT NOT NULL DEFAULT 'Hà Nội',
  cuisine_types TEXT[] DEFAULT '{}',
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  images TEXT[] DEFAULT '{}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  commission_rate NUMERIC(4,2) NOT NULL DEFAULT 0.15,  -- 15% default
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  opening_hours TEXT,           -- e.g. "10:00-22:00"
  max_capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Combos (set menus for 2 people)
CREATE TABLE IF NOT EXISTS public.combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  items TEXT[] DEFAULT '{}',    -- List of dish names
  price INTEGER NOT NULL,       -- Total price for 2 people (VND)
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_restaurants_city ON public.restaurants(city);
CREATE INDEX idx_restaurants_area ON public.restaurants(area);
CREATE INDEX idx_restaurants_status ON public.restaurants(status);
CREATE INDEX idx_combos_restaurant ON public.combos(restaurant_id);
CREATE INDEX idx_combos_available ON public.combos(is_available);

-- RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;

-- Everyone can read active restaurants and available combos
CREATE POLICY "Anyone can view active restaurants" ON public.restaurants
  FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can view available combos" ON public.combos
  FOR SELECT USING (is_available = true);

-- Admin full access
CREATE POLICY "Admin full access restaurants" ON public.restaurants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin full access combos" ON public.combos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role bypass
CREATE POLICY "Service role restaurants" ON public.restaurants
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role combos" ON public.combos
  FOR ALL USING (auth.role() = 'service_role');
