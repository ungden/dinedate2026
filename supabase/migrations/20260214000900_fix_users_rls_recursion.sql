-- ============================================================
-- Fix infinite recursion in RLS policies on public.users
-- The "Admin users" and "Users cannot change role" policies
-- query public.users within their own USING/WITH CHECK clauses,
-- causing PostgreSQL error 42P17.
-- Fix: use a SECURITY DEFINER function to check admin role.
-- ============================================================

-- 1. Create a helper function that checks admin role without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Create a helper to get current user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Drop the problematic policies
DROP POLICY IF EXISTS "Admin users" ON public.users;
DROP POLICY IF EXISTS "Users cannot change role" ON public.users;

-- 4. Recreate Admin policy using the SECURITY DEFINER function
CREATE POLICY "Admin users" ON public.users
  FOR ALL USING (public.is_admin());

-- 5. Recreate "Users cannot change role" policy using the helper function
CREATE POLICY "Users cannot change role" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    role IS NOT DISTINCT FROM public.get_my_role()
  );
