-- ============================================================================
-- ITSA CMS: Security & RBAC Hardening Migration
-- Timestamp: 20260902184000
-- Purpose:
--   1. Harden SECURITY DEFINER helper functions with explicit search_path = public.
--   2. Implement strict role-tier separation (SUPER_ADMIN, ADMIN, EDITOR) at PostgreSQL RLS level.
--   3. Restrict site_settings mutation strictly to SUPER_ADMIN.
--   4. Restrict positions, committee_members, archive_records mutation to SUPER_ADMIN and ADMIN.
--   5. Restrict admin_profiles management strictly to SUPER_ADMIN.
-- ============================================================================

-- 1. HARDEN SECURITY DEFINER HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = user_id
      AND is_active = true
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = user_id
      AND is_active = true
      AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_content(user_id uuid)
RETURNS boolean AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = user_id
      AND is_active = true
      AND role IN ('SUPER_ADMIN', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. HARDEN RLS ON admin_profiles
DROP POLICY IF EXISTS "Super admins can manage all admin profiles" ON public.admin_profiles;
CREATE POLICY "Super admins can manage all admin profiles"
  ON public.admin_profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 3. HARDEN RLS ON site_settings (SUPER_ADMIN only for mutation)
DROP POLICY IF EXISTS "Admin insert site settings" ON public.site_settings;
CREATE POLICY "Super admin insert site settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin update site settings" ON public.site_settings;
CREATE POLICY "Super admin update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin delete site settings" ON public.site_settings;
CREATE POLICY "Super admin delete site settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 4. HARDEN RLS ON positions (SUPER_ADMIN & ADMIN only)
DROP POLICY IF EXISTS "Admin insert positions" ON public.positions;
CREATE POLICY "Admin insert positions"
  ON public.positions FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admin update positions" ON public.positions;
CREATE POLICY "Admin update positions"
  ON public.positions FOR UPDATE
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admin delete positions" ON public.positions;
CREATE POLICY "Admin delete positions"
  ON public.positions FOR DELETE
  TO authenticated
  USING (public.can_manage_content(auth.uid()));

-- 5. HARDEN RLS ON committee_members (SUPER_ADMIN & ADMIN only)
DROP POLICY IF EXISTS "Admin insert committee members" ON public.committee_members;
CREATE POLICY "Admin insert committee members"
  ON public.committee_members FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admin update committee members" ON public.committee_members;
CREATE POLICY "Admin update committee members"
  ON public.committee_members FOR UPDATE
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admin delete committee members" ON public.committee_members;
CREATE POLICY "Admin delete committee members"
  ON public.committee_members FOR DELETE
  TO authenticated
  USING (public.can_manage_content(auth.uid()));

-- 6. HARDEN RLS ON archive_records (SUPER_ADMIN & ADMIN only)
DROP POLICY IF EXISTS "Admin insert archive records" ON public.archive_records;
CREATE POLICY "Admin insert archive records"
  ON public.archive_records FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admin update archive records" ON public.archive_records;
CREATE POLICY "Admin update archive records"
  ON public.archive_records FOR UPDATE
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admin delete archive records" ON public.archive_records;
CREATE POLICY "Admin delete archive records"
  ON public.archive_records FOR DELETE
  TO authenticated
  USING (public.can_manage_content(auth.uid()));
