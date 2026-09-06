-- ============================================================================
-- ITSA PLATFORM — NEON POSTGRESQL MIGRATION 003
-- Migration: 003_seed_idempotency_constraints.sql
-- Description:
--   1. Adds unique index on positions (name, tier) for seed idempotency.
--   2. Adds unique index on committee_members (name, position, tenure_year) for seed idempotency.
--   3. Adds unique index on archive_records (image_url) for seed idempotency.
-- ============================================================================

-- 1. UNIQUE INDEX ON positions(name, tier)
CREATE UNIQUE INDEX IF NOT EXISTS uq_positions_name_tier ON positions (name, tier);

-- 2. UNIQUE INDEX ON committee_members(name, position, tenure_year)
CREATE UNIQUE INDEX IF NOT EXISTS uq_committee_members_identity ON committee_members (name, position, tenure_year);

-- 3. UNIQUE INDEX ON archive_records(image_url)
CREATE UNIQUE INDEX IF NOT EXISTS uq_archive_records_image_url ON archive_records (image_url);
