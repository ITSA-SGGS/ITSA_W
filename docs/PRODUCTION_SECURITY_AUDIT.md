# ITSA Web Platform — Production Security, RBAC & Architecture Audit

## 1. System Overview & Tech Stack
- **Frontend Framework**: React 19, TypeScript 5.7.3, Vite 8
- **Styling**: Tailwind CSS 3.4.17 with dark/light mode system
- **Backend**: Supabase (PostgreSQL 15+, Supabase Auth, Supabase Storage)
- **Security Model**: PostgreSQL Row Level Security (RLS) + Role-Based Access Control (RBAC) + Zero-Secret Frontend

---

## 2. RBAC Model & Permission Hierarchy

| Module / Scope | Public / Visitor | EDITOR | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|
| **Public Site** (`/`) | Read published content | Read | Read | Read |
| **Admin Dashboard** (`/admin/dashboard`) | Access Denied | Read overview | Read overview | Full telemetry |
| **Events** (`/admin/events`) | Published only | Create, Edit, Publish, Delete | Create, Edit, Publish, Delete | Full CRUD |
| **Announcements** (`/admin/announcements`) | Active published only | Create, Edit, Publish, Delete | Create, Edit, Publish, Delete | Full CRUD |
| **People & Committee** (`/admin/people`) | Active roster only | Read-only | Create, Edit, Photo upload, Delete | Full CRUD |
| **Positions Hierarchy** (`/admin/positions`) | Active positions only | Read-only | Create, Edit, Reorder, Delete | Full CRUD |
| **Visual Archive** (`/admin/archive`) | Published records only | Read-only | Create, Upload, Edit, Delete | Full CRUD |
| **Admin Users & Roles** (`/admin/users`) | Access Denied | Access Denied | Read-only | Full RBAC Management |
| **Global Site Settings** (`/admin/settings`) | Public settings only | Read-only | Read-only | Full Mutation & Save |

---

## 3. Database Tables & Row Level Security (RLS)

1. **`admin_profiles`**:
   - `SELECT`: Own profile (for authenticated user) or all profiles (for `SUPER_ADMIN`).
   - `INSERT / UPDATE / DELETE`: Strictly guarded by `is_super_admin(auth.uid())`. Non-admins and standard admins cannot elevate privileges or create arbitrary admin accounts.

2. **`events`**:
   - `SELECT`: `is_published = true` for public; all records for `is_admin(auth.uid())`.
   - `INSERT / UPDATE / DELETE`: Allowed for all active administrative roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`).

3. **`announcements`**:
   - `SELECT`: `is_published = true AND (published_at <= now() OR null) AND (expires_at >= now() OR null)` for public.
   - `INSERT / UPDATE / DELETE`: Allowed for `is_admin(auth.uid())`.

4. **`committee_members`**:
   - `SELECT`: `is_active = true` for public.
   - `INSERT / UPDATE / DELETE`: Allowed for `can_manage_content(auth.uid())` (`SUPER_ADMIN`, `ADMIN`).

5. **`positions`**:
   - `SELECT`: `is_active = true` for public.
   - `INSERT / UPDATE / DELETE`: Allowed for `can_manage_content(auth.uid())` (`SUPER_ADMIN`, `ADMIN`).

6. **`archive_records`**:
   - `SELECT`: `is_published = true` for public.
   - `INSERT / UPDATE / DELETE`: Allowed for `can_manage_content(auth.uid())` (`SUPER_ADMIN`, `ADMIN`).

7. **`site_settings`**:
   - `SELECT`: `is_public = true` for public.
   - `INSERT / UPDATE / DELETE`: Strictly guarded by `is_super_admin(auth.uid())`.

---

## 4. Supabase Storage Buckets

| Bucket Name | Public Read | Allowed MIME Types | Max File Size | Managed Paths |
|---|---|---|---|---|
| `event-media` | Yes | JPEG, PNG, WebP, AVIF | 10 MB | `covers/${timestamp}-${rand}.${ext}` |
| `team-photos` | Yes | JPEG, PNG, WebP, AVIF | 5 MB | `portraits/${timestamp}-${rand}.${ext}` |
| `archive-media` | Yes | JPEG, PNG, WebP, AVIF | 10 MB | `archives/${timestamp}-${rand}.${ext}` |

---

## 5. Security Safeguards Verified

- **Zero Student Registration Numbers**: Strictly zero student registration numbers stored in any table or displayed in any UI/tooltips/metadata.
- **Zero Exposed Secrets**: `SUPABASE_SERVICE_ROLE_KEY` is not present in frontend code or environment files.
- **XSS & Protocol Protection**: All user-supplied action URLs, social links, and registration links pass through `sanitizeUrl()`, blocking `javascript:`, `data:`, `vbscript:` schemes.
- **PostgreSQL Function Hardening**: All `SECURITY DEFINER` functions explicitly declare `SET search_path = public` to prevent search path hijacking.
- **Last Super Admin Safeguard**: Service and database layers disallow deactivating or demoting the last active `SUPER_ADMIN` account.
- **Authentic Photographic Fallback**: The 5 authentic ITSA archive photographs in `public/archive/` remain permanently preserved as local fallback whenever Supabase has zero published archive records.
