-- ============================================================================
-- ITSA PLATFORM — NEON POSTGRESQL MIGRATION 002
-- Migration: 002_auth_sessions.sql
-- Description:
--   1. Adds last_login_at timestamp column to admin_users table.
--   2. Creates admin_sessions table for secure server-side session management.
--   3. Creates performance indexes for session lookup and expiration cleanup.
-- ============================================================================

-- 1. ADD last_login_at TO admin_users
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 2. CREATE TABLE: admin_sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_address text
);

-- 3. INDEXES FOR FAST LOOKUP AND CLEANUP
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
