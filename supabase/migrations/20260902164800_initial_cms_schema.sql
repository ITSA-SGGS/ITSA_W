-- ============================================================================
-- ITSA WEB PLATFORM — INITIAL CMS & SECURITY SCHEMA MIGRATION
-- Generated: 2026-09-02
-- Target: Supabase PostgreSQL (Auth, Database, Storage, Row Level Security)
-- ============================================================================

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Automatic timestamp updater
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. ADMINISTRATIVE PROFILES & ROLE-BASED ACCESS CONTROL (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin authorization helper functions (SECURITY DEFINER to prevent recursive RLS)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. CORE CMS TABLES
-- ============================================================================

--------------------------------------------------------------------------------
-- TABLE: events
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('TECHNICAL', 'SPORTS', 'CULTURAL')),
  year integer CHECK (year IS NULL OR (year >= 1980 AND year <= 2100)),
  event_date date,
  start_time time,
  end_time time,
  venue text,
  registration_url text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED')),
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- TABLE: positions
-- Defines organizational positions dynamically without altering source code.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('CORE', 'TY_LEADERSHIP', 'SY_COORDINATOR', 'FACULTY')),
  domain text,
  description text,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- TABLE: committee_members
-- NO registration_number column exists. Privacy & student protection enforced.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('CORE', 'TY_LEADERSHIP', 'SY_COORDINATOR', 'FACULTY')),
  domain text,
  photo_url text,
  linkedin_url text,
  github_url text,
  tenure_year text NOT NULL DEFAULT '2026–2027',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_committee_members_updated_at
  BEFORE UPDATE ON public.committee_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- TABLE: archive_records
-- Minimalist documentary photographic archive records.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.archive_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  image_url text NOT NULL,
  year integer CHECK (year IS NULL OR (year >= 1980 AND year <= 2100)),
  event_name text,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_archive_records_updated_at
  BEFORE UPDATE ON public.archive_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- TABLE: announcements
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  link_url text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  expires_at timestamptz,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- TABLE: site_settings
-- Clean key/value configuration store for site-wide telemetry and notices.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON public.events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_display_order ON public.events(display_order);

-- Positions indexes
CREATE INDEX IF NOT EXISTS idx_positions_tier ON public.positions(tier);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON public.positions(is_active);
CREATE INDEX IF NOT EXISTS idx_positions_display_order ON public.positions(display_order);

-- Committee members indexes
CREATE INDEX IF NOT EXISTS idx_committee_members_tier ON public.committee_members(tier);
CREATE INDEX IF NOT EXISTS idx_committee_members_is_active ON public.committee_members(is_active);
CREATE INDEX IF NOT EXISTS idx_committee_members_display_order ON public.committee_members(display_order);
CREATE INDEX IF NOT EXISTS idx_committee_members_domain ON public.committee_members(domain);

-- Archive records indexes
CREATE INDEX IF NOT EXISTS idx_archive_records_is_published ON public.archive_records(is_published);
CREATE INDEX IF NOT EXISTS idx_archive_records_display_order ON public.archive_records(display_order);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON public.announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON public.announcements(published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);

-- Site settings indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_is_public ON public.site_settings(is_public);

-- Admin profiles index
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_is_active ON public.admin_profiles(is_active);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- RLS POLICIES: admin_profiles
--------------------------------------------------------------------------------
-- 1. Users can view their own profile
CREATE POLICY "Users can view own admin profile"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Super Admins have full access to view and manage all admin profiles
CREATE POLICY "Super admins can manage all admin profiles"
  ON public.admin_profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

--------------------------------------------------------------------------------
-- RLS POLICIES: events
--------------------------------------------------------------------------------
-- Public can read ONLY published events
CREATE POLICY "Public read access for published events"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Authorized admins can read all events (including drafts)
CREATE POLICY "Admin read access for all events"
  ON public.events FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Authorized admins can insert events
CREATE POLICY "Admin insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can update events
CREATE POLICY "Admin update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can delete events
CREATE POLICY "Admin delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

--------------------------------------------------------------------------------
-- RLS POLICIES: positions
--------------------------------------------------------------------------------
-- Public can read active positions
CREATE POLICY "Public read access for active positions"
  ON public.positions FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Authorized admins can read all positions
CREATE POLICY "Admin read access for all positions"
  ON public.positions FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Authorized admins can insert positions
CREATE POLICY "Admin insert positions"
  ON public.positions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can update positions
CREATE POLICY "Admin update positions"
  ON public.positions FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can delete positions
CREATE POLICY "Admin delete positions"
  ON public.positions FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

--------------------------------------------------------------------------------
-- RLS POLICIES: committee_members
--------------------------------------------------------------------------------
-- Public can read active committee members
CREATE POLICY "Public read access for active committee members"
  ON public.committee_members FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Authorized admins can read all committee members
CREATE POLICY "Admin read access for all committee members"
  ON public.committee_members FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Authorized admins can insert committee members
CREATE POLICY "Admin insert committee members"
  ON public.committee_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can update committee members
CREATE POLICY "Admin update committee members"
  ON public.committee_members FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can delete committee members
CREATE POLICY "Admin delete committee members"
  ON public.committee_members FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

--------------------------------------------------------------------------------
-- RLS POLICIES: archive_records
--------------------------------------------------------------------------------
-- Public can read ONLY published archive records
CREATE POLICY "Public read access for published archive records"
  ON public.archive_records FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Authorized admins can read all archive records
CREATE POLICY "Admin read access for all archive records"
  ON public.archive_records FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Authorized admins can insert archive records
CREATE POLICY "Admin insert archive records"
  ON public.archive_records FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can update archive records
CREATE POLICY "Admin update archive records"
  ON public.archive_records FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can delete archive records
CREATE POLICY "Admin delete archive records"
  ON public.archive_records FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

--------------------------------------------------------------------------------
-- RLS POLICIES: announcements
--------------------------------------------------------------------------------
-- Public can read published & unexpired announcements
CREATE POLICY "Public read access for active announcements"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND (published_at IS NULL OR published_at <= now())
    AND (expires_at IS NULL OR expires_at >= now())
  );

-- Authorized admins can read all announcements
CREATE POLICY "Admin read access for all announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Authorized admins can insert announcements
CREATE POLICY "Admin insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can update announcements
CREATE POLICY "Admin update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can delete announcements
CREATE POLICY "Admin delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

--------------------------------------------------------------------------------
-- RLS POLICIES: site_settings
--------------------------------------------------------------------------------
-- Public can read public settings
CREATE POLICY "Public read access for public site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Authorized admins can read all settings
CREATE POLICY "Admin read access for all site settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Authorized admins can insert site settings
CREATE POLICY "Admin insert site settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can update site settings
CREATE POLICY "Admin update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Authorized admins can delete site settings
CREATE POLICY "Admin delete site settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- 6. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================

-- Create dedicated storage buckets with size limits and MIME restrictions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('team-photos', 'team-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('archive-media', 'archive-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('event-media', 'event-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for storage.objects
-- 1. Public Read Access
CREATE POLICY "Public Read Access for Media Buckets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('team-photos', 'archive-media', 'event-media'));

-- 2. Admin Upload / Insert Access
CREATE POLICY "Admin Upload Access for Media Buckets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('team-photos', 'archive-media', 'event-media')
    AND public.is_admin(auth.uid())
  );

-- 3. Admin Update Access
CREATE POLICY "Admin Update Access for Media Buckets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('team-photos', 'archive-media', 'event-media')
    AND public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id IN ('team-photos', 'archive-media', 'event-media')
    AND public.is_admin(auth.uid())
  );

-- 4. Admin Delete Access
CREATE POLICY "Admin Delete Access for Media Buckets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('team-photos', 'archive-media', 'event-media')
    AND public.is_admin(auth.uid())
  );
