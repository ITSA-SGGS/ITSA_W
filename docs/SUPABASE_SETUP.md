# ITSA Platform — Supabase Backend & Security Setup Guide

This guide provides step-by-step instructions for provisioning, configuring, and maintaining the Supabase backend infrastructure for the ITSA Web Platform.

---

## 1. Project Initialization & Linking

### Option A: Via Supabase Dashboard (GUI)
1. Log into [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and configure:
   - **Name**: `itsa-platform`
   - **Database Password**: Generate and securely store a strong password.
   - **Region**: Select the closest geographic region (e.g., `ap-south-1` Mumbai / India).
3. Once provisioned, copy the project URL and Anonymous API Key from **Project Settings → API**.

### Option B: Via Supabase CLI (Recommended for Developers)
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Authenticate the CLI:
   ```bash
   supabase login
   ```
3. Link your local project:
   ```bash
   supabase link --project-ref <your-project-id>
   ```

---

## 2. Executing Schema Migrations & Seeding

### 2.1 Applying Database Migrations
Run the initial migration SQL against your database:

**Via Supabase CLI**:
```bash
supabase db push
```

**Or via Supabase Dashboard SQL Editor**:
1. Open **SQL Editor** in the Supabase Dashboard.
2. Open [`supabase/migrations/20260902164800_initial_cms_schema.sql`](file:///home/moonwaker777/itsa-frontend/supabase/migrations/20260902164800_initial_cms_schema.sql).
3. Copy the entire file content, paste it into the SQL Editor, and click **Run**.

### 2.2 Seeding Initial ITSA Data
To populate organizational positions, the 2026–2027 committee roster, baseline settings, and the 5 archive photographs:

**Via Supabase CLI**:
```bash
supabase db reset # (in local development)
```

**Or via SQL Editor**:
1. Open [`supabase/seed.sql`](file:///home/moonwaker777/itsa-frontend/supabase/seed.sql).
2. Paste and execute the SQL script in the dashboard SQL Editor.

---

## 3. Environment Variables & API Key Security

Create a `.env` file in the project root based on [`.env.example`](file:///home/moonwaker777/itsa-frontend/.env.example):

```bash
cp .env.example .env
```

Populate the variables:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Key Security Classifications

| Key Type | Permitted in Frontend? | Exposure Risk | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | **YES** (Public) | None | Project API endpoint |
| `VITE_SUPABASE_ANON_KEY` | **YES** (Public) | Low (Protected by RLS) | Anonymous client requests, login, and public data reads |
| `SUPABASE_SERVICE_ROLE_KEY` | **NEVER** | **CRITICAL / FULL BYPASS** | Administrative backend bypass key. **MUST NEVER** be placed in frontend code, `.env`, or client bundles. |

---

## 4. Storage Buckets Configuration

The migration automatically creates three public storage buckets in `storage.buckets`:

1. **`team-photos`**: Committee and faculty portraits (Max size: 5MB, Allowed MIME types: JPEG, PNG, WebP, AVIF).
2. **`archive-media`**: Documentary photographs for the Visual Archive (Max size: 10MB, Allowed MIME types: JPEG, PNG, WebP, AVIF).
3. **`event-media`**: Event flyers, banner graphics, and symposium materials (Max size: 10MB, Allowed MIME types: JPEG, PNG, WebP, AVIF).

### Storage Access Rules:
- **Public Website (`anon`)**: Can read/view published media assets.
- **Admin Dashboard (`authenticated` with `is_admin`)**: Full upload, replace, and delete permissions.
- **Anonymous Uploads**: Strictly rejected.

---

## 5. Row Level Security (RLS) Architecture

Row Level Security is enabled on **100% of CMS tables**.

### Public Access Matrix (`anon` role):
- `events`: Can query rows where `is_published = true`.
- `committee_members`: Can query rows where `is_active = true`.
- `positions`: Can query rows where `is_active = true`.
- `archive_records`: Can query rows where `is_published = true`.
- `announcements`: Can query rows where `is_published = true` and `now()` is between `published_at` and `expires_at`.
- `site_settings`: Can query rows where `is_public = true`.

### Admin Access Matrix (`authenticated` role with active `admin_profiles` record):
- Full `SELECT`, `INSERT`, `UPDATE`, and `DELETE` access to all CMS tables and storage media.
- Evaluated via PostgreSQL `is_admin(auth.uid())` and `is_super_admin(auth.uid())` security functions.

---

## 6. Admin Account Provisioning & Role-Based Access Control (RBAC)

### 6.1 Creating the First Super Administrator
1. Sign up the user account via Supabase Auth (or Dashboard **Authentication → Users → Add User**):
   - **Email**: `admin@sggs.ac.in` (or designated coordinator email)
   - **Password**: Strong temporary password
2. In the Supabase Dashboard **SQL Editor**, grant Super Admin rights to that user ID:
   ```sql
   INSERT INTO public.admin_profiles (id, email, full_name, role, is_active)
   SELECT
     id,
     email,
     'Lead ITSA Coordinator',
     'SUPER_ADMIN',
     true
   FROM auth.users
   WHERE email = 'admin@sggs.ac.in'
   ON CONFLICT (id) DO UPDATE SET
     role = 'SUPER_ADMIN',
     is_active = true;
   ```

### 6.2 Administrator Role Hierarchy

| Role | Permissions |
|---|---|
| `SUPER_ADMIN` | Full CMS CRUD + Manage other admin profiles, roles, and global site settings |
| `ADMIN` | Full CMS CRUD (Events, Committee Members, Archive Records, Announcements) |
| `EDITOR` | Content creation and editing on Events and Announcements |

---

## 7. Verification Checklist

After running the migrations and seeding:
- [x] All 7 tables created with foreign keys and check constraints
- [x] Automatic `updated_at` triggers installed on all tables
- [x] Performance indexes created for categories, statuses, tiers, and display orders
- [x] RLS enabled and verified on all tables
- [x] Storage buckets `team-photos`, `archive-media`, `event-media` created
- [x] Zero student registration numbers present in schema or seed scripts
- [x] Service role key completely excluded from frontend environment files
