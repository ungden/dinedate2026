-- ============================================================
-- DineDate 2026 - Reviews & Mutual Connections
-- ============================================================

-- Person reviews (rate the person you met)
CREATE TABLE IF NOT EXISTS public.person_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_order_id UUID NOT NULL REFERENCES public.date_orders(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  reviewed_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  want_to_meet_again BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date_order_id, reviewer_id)  -- One review per person per date
);

-- Restaurant reviews
CREATE TABLE IF NOT EXISTS public.restaurant_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_order_id UUID NOT NULL REFERENCES public.date_orders(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
  food_rating INTEGER NOT NULL CHECK (food_rating >= 1 AND food_rating <= 5),
  ambiance_rating INTEGER NOT NULL CHECK (ambiance_rating >= 1 AND ambiance_rating <= 5),
  service_rating INTEGER NOT NULL CHECK (service_rating >= 1 AND service_rating <= 5),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  comment TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date_order_id, reviewer_id)
);

-- Mutual connections (both said "want to meet again")
CREATE TABLE IF NOT EXISTS public.mutual_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id),
  user2_id UUID NOT NULL REFERENCES auth.users(id),
  date_order_id UUID NOT NULL REFERENCES public.date_orders(id),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date_order_id)  -- One connection per date
);

-- Indexes
CREATE INDEX idx_person_reviews_reviewed ON public.person_reviews(reviewed_id);
CREATE INDEX idx_person_reviews_order ON public.person_reviews(date_order_id);
CREATE INDEX idx_restaurant_reviews_restaurant ON public.restaurant_reviews(restaurant_id);
CREATE INDEX idx_restaurant_reviews_order ON public.restaurant_reviews(date_order_id);
CREATE INDEX idx_mutual_connections_users ON public.mutual_connections(user1_id, user2_id);

-- RLS
ALTER TABLE public.person_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutual_connections ENABLE ROW LEVEL SECURITY;

-- Person reviews: public read, own write
CREATE POLICY "View person reviews" ON public.person_reviews
  FOR SELECT USING (true);

CREATE POLICY "Create person review" ON public.person_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Restaurant reviews: public read
CREATE POLICY "View restaurant reviews" ON public.restaurant_reviews
  FOR SELECT USING (true);

CREATE POLICY "Create restaurant review" ON public.restaurant_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Mutual connections: involved users only
CREATE POLICY "View own connections" ON public.mutual_connections
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Service role
CREATE POLICY "Service role person_reviews" ON public.person_reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role restaurant_reviews" ON public.restaurant_reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role mutual_connections" ON public.mutual_connections FOR ALL USING (auth.role() = 'service_role');

-- Admin
CREATE POLICY "Admin person_reviews" ON public.person_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin restaurant_reviews" ON public.restaurant_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin mutual_connections" ON public.mutual_connections FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Function: auto-create mutual connection when both reviewed with want_to_meet_again
CREATE OR REPLACE FUNCTION public.check_mutual_connection()
RETURNS TRIGGER AS $$
DECLARE
  other_review RECORD;
  order_record RECORD;
BEGIN
  IF NEW.want_to_meet_again = false THEN
    RETURN NEW;
  END IF;

  -- Find the other person's review for the same date
  SELECT * INTO other_review
  FROM public.person_reviews
  WHERE date_order_id = NEW.date_order_id
    AND reviewer_id != NEW.reviewer_id
    AND want_to_meet_again = true;

  -- If both want to meet again, create mutual connection
  IF FOUND THEN
    -- Get the date order to know both user IDs
    SELECT * INTO order_record
    FROM public.date_orders
    WHERE id = NEW.date_order_id;

    INSERT INTO public.mutual_connections (user1_id, user2_id, date_order_id)
    VALUES (
      LEAST(order_record.creator_id, order_record.matched_user_id),
      GREATEST(order_record.creator_id, order_record.matched_user_id),
      NEW.date_order_id
    )
    ON CONFLICT (date_order_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_mutual_connection
  AFTER INSERT ON public.person_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_connection();

-- Function: update restaurant average rating after review
CREATE OR REPLACE FUNCTION public.update_restaurant_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.restaurants SET
    average_rating = (
      SELECT COALESCE(AVG(overall_rating), 0)
      FROM public.restaurant_reviews
      WHERE restaurant_id = NEW.restaurant_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.restaurant_reviews
      WHERE restaurant_id = NEW.restaurant_id
    ),
    updated_at = NOW()
  WHERE id = NEW.restaurant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_restaurant_rating
  AFTER INSERT ON public.restaurant_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_restaurant_rating();

-- Function: update user average rating after person review
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
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

CREATE TRIGGER trigger_update_user_rating
  AFTER INSERT ON public.person_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating();
