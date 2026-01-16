-- Create profile_views table to track profile view analytics
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be NULL for anonymous views
    viewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Track source of view (optional for future analytics)
    source TEXT DEFAULT 'direct' CHECK (source IN ('direct', 'search', 'featured', 'recommendation'))
);

-- Create indexes for efficient counting and querying
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_id ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_composite ON profile_views(viewed_id, viewed_at DESC);

-- Create a partial index for views in the last 30 days (common query pattern)
CREATE INDEX IF NOT EXISTS idx_profile_views_recent ON profile_views(viewed_id, viewed_at)
    WHERE viewed_at > NOW() - INTERVAL '30 days';

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_views
-- Anyone can insert a view (logged in users will have viewer_id set)
CREATE POLICY "Authenticated users can create profile views"
    ON profile_views FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Can only create view for others (not self)
        viewer_id IS NULL OR viewer_id != viewed_id
    );

-- Users can view their own profile view statistics (as the viewed user)
CREATE POLICY "Users can view their own profile view stats"
    ON profile_views FOR SELECT
    TO authenticated
    USING (auth.uid() = viewed_id);

-- Service role can manage all views
CREATE POLICY "Service role can manage all profile views"
    ON profile_views FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create a helper function to get profile view count for a user in a period
CREATE OR REPLACE FUNCTION get_profile_view_count(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO view_count
    FROM profile_views
    WHERE viewed_id = p_user_id
    AND viewed_at > NOW() - (p_days || ' days')::INTERVAL;

    RETURN view_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to compare view counts between periods
CREATE OR REPLACE FUNCTION get_profile_view_trend(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    current_period INTEGER,
    previous_period INTEGER,
    trend_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH current_views AS (
        SELECT COUNT(*)::INTEGER as cnt
        FROM profile_views
        WHERE viewed_id = p_user_id
        AND viewed_at > NOW() - (p_days || ' days')::INTERVAL
    ),
    previous_views AS (
        SELECT COUNT(*)::INTEGER as cnt
        FROM profile_views
        WHERE viewed_id = p_user_id
        AND viewed_at > NOW() - (p_days * 2 || ' days')::INTERVAL
        AND viewed_at <= NOW() - (p_days || ' days')::INTERVAL
    )
    SELECT
        c.cnt as current_period,
        p.cnt as previous_period,
        CASE
            WHEN p.cnt = 0 THEN 100.0
            ELSE ROUND(((c.cnt - p.cnt)::NUMERIC / p.cnt) * 100, 1)
        END as trend_percentage
    FROM current_views c, previous_views p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
