-- ============================================================================
-- ITSA PLATFORM — NEON POSTGRESQL INITIAL SCHEMA MIGRATION
-- Migration: 001_initial_schema.sql
-- Target: Neon Serverless PostgreSQL
-- Description:
--   Creates the core 7 tables, constraints, updated_at triggers, and performance
--   indexes for the decoupled backend architecture.
-- ============================================================================

-- ============================================================================
-- 1. TIMESTAMP TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TABLE: admin_users (Decoupled from Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ============================================================================
-- 3. TABLE: events
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
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

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_display_order ON events(display_order);

-- ============================================================================
-- 4. TABLE: positions
-- ============================================================================
CREATE TABLE IF NOT EXISTS positions (
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

CREATE TRIGGER trg_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE INDEX IF NOT EXISTS idx_positions_tier ON positions(tier);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(is_active);
CREATE INDEX IF NOT EXISTS idx_positions_display_order ON positions(display_order);

-- ============================================================================
-- 5. TABLE: committee_members
-- Note: Includes department column (resolved from audit discrepancy).
-- Zero student registration numbers are present or permitted.
-- ============================================================================
CREATE TABLE IF NOT EXISTS committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('CORE', 'TY_LEADERSHIP', 'SY_COORDINATOR', 'FACULTY')),
  domain text,
  department text,
  photo_url text,
  linkedin_url text,
  github_url text,
  tenure_year text NOT NULL DEFAULT '2026–2027',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_committee_members_updated_at
  BEFORE UPDATE ON committee_members
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE INDEX IF NOT EXISTS idx_committee_members_tier ON committee_members(tier);
CREATE INDEX IF NOT EXISTS idx_committee_members_is_active ON committee_members(is_active);
CREATE INDEX IF NOT EXISTS idx_committee_members_display_order ON committee_members(display_order);
CREATE INDEX IF NOT EXISTS idx_committee_members_domain ON committee_members(domain);

-- ============================================================================
-- 6. TABLE: archive_records
-- ============================================================================
CREATE TABLE IF NOT EXISTS archive_records (
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

CREATE TRIGGER trg_archive_records_updated_at
  BEFORE UPDATE ON archive_records
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE INDEX IF NOT EXISTS idx_archive_records_is_published ON archive_records(is_published);
CREATE INDEX IF NOT EXISTS idx_archive_records_display_order ON archive_records(display_order);

-- ============================================================================
-- 7. TABLE: announcements
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
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

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);

-- ============================================================================
-- 8. TABLE: site_settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_is_public ON site_settings(is_public);
