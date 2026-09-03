# ITSA Web Platform — CMS & Backend Architecture Specification

## 1. Executive Summary

This document establishes the technical blueprint for transitioning the **Information Technology Students Association (ITSA), SGGSIE&T** web platform from a static React frontend to a modern, dynamic, and content-managed web application backed by **Supabase** (PostgreSQL, Auth, Storage, and Row Level Security).

The core tenet of this architecture is **absolute preservation of the public user experience**:
- The public website's design, Apple-inspired minimalism, Linux/Matrix visual atmosphere, performance, and dark/light theming remain completely intact.
- An authenticated, role-secured **Admin Dashboard** (`/admin/*`) will be introduced to empower ITSA coordinators to manage events, committee personnel, photographic archives, and site notices dynamically without altering source code.
- Data fetching will implement a **resilient hybrid strategy**: database data is consumed live, with seamless fallback to static fixtures ensuring 100% public uptime under any network or initialization state.

---

## 2. Current Architecture Assessment

### 2.1 Technology Stack & Tooling
- **Framework**: React 19 (`19.1.0`) with TypeScript (`5.7.3`)
- **Bundler / Dev Server**: Vite 8 (`8.2.2`)
- **Styling**: Tailwind CSS (`3.4.17`) with CSS variables (`globals.css`) and custom theme extensions
- **Icons**: Lucide React (`1.16.0`)
- **Routing**: Pure Single Page Application (SPA) with in-page hash anchors (`#hero`, `#events`, `#team`, `#gallery`) and modal state controls.

### 2.2 Component Hierarchy & Data Consumption Map

| Component | Responsibility | Current Data Source | Future Dynamic Data Model |
|---|---|---|---|
| [`Hero.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Hero.tsx) | Brand identity, terminal prompt, telemetry | Hardcoded JSX | `site_settings` (academic year, telemetry, announcements) |
| [`HeroCanvas.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/HeroCanvas.tsx) | Interactive matrix canvas & physics | Hardcoded glyph sets | Static constants (remains local for 60fps performance) |
| [`Events.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Events.tsx) | 3-Category editorial selector rows | Hardcoded category list | `event_categories` table |
| [`CategoryEventsModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/CategoryEventsModal.tsx) | Detailed event listings per category | [`mockData.ts`](file:///home/moonwaker777/itsa-frontend/src/data/mockData.ts) constants | `events` table (filtered by category, status) |
| [`Quote.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Quote.tsx) | Standalone cinematic quote section | Hardcoded JSX | `site_quotes` or `site_settings` |
| [`Team.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Team.tsx) | Core, TY, SY, and Faculty directory | [`mockData.ts`](file:///home/moonwaker777/itsa-frontend/src/data/mockData.ts) arrays | `committee_members` & `departments/domains` tables |
| [`ProfileModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/ProfileModal.tsx) | Member portrait modal with initials fallback | Passed `CommitteeMember` prop | `committee_members` (linked to Supabase Storage avatars) |
| [`Gallery.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Gallery.tsx) | Curated 5-image documentary archive grid | [`mockData.ts`](file:///home/moonwaker777/itsa-frontend/src/data/mockData.ts) (`GALLERY_ITEMS`) | `archive_records` table |
| [`LightboxModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/LightboxModal.tsx) | Fullscreen uncropped photo lightbox | Passed `GalleryItem` prop | `archive_records` (linked to Supabase Storage media) |
| [`Navbar.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Navbar.tsx) | Sticky navigation, branding, theme toggle | Static links & assets | Static with optional dynamic notification pill |
| [`Footer.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Footer.tsx) | Institutional info & social links | Hardcoded JSX | `site_settings` / `social_links` |

### 2.3 Hardcoded Content vs Database Needs

1. **Events**: Currently hardcoded across `SAMPLE_TECHNICAL_EVENTS`, `SAMPLE_SPORTS_EVENTS`, and `SAMPLE_CULTURAL_EVENTS`. Needs database-driven CRUD with fields for title, subtitle, category, description, date/year, venue, registration URL, and published status.
2. **Committee / Members**: Currently hardcoded across `CORE_COMMITTEE`, `TY_LEADERSHIP`, `SY_COORDINATOR_GROUPS`, and `FACULTY_DIGNITARIES`. Needs database-driven CRUD with fields for name, position, tier (`CORE`, `TY_LEADERSHIP`, `SY_COORDINATOR`, `FACULTY`), domain (`OVERALL`, `TECHNICAL`, `ANCHORING`, `MEDIA`, `FINANCE`, `SPORTS`, `ALUMNI`, `OPERATIONS`), photo URL, display order, and academic year.
3. **Archive Records**: Currently 5 local JPEG photographs. Needs database-driven management for image uploads, editorial captions, indices, aspect ratios, and active display flags.
4. **Site Telemetry & Metadata**: Academic year (`2026–2027`), social links, and announcements.

### 2.4 Privacy & Registration Number Audit
- **Audit Result**: Confirmed **ZERO** student registration numbers (e.g. `2023BITxxx`) are exposed in the current codebase or UI.
- **Rule**: Internal administrative identifiers (if any) must never be returned in public queries. Public database views and Row Level Security will explicitly filter out non-public fields.

---

## 3. Proposed Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (Vite SPA)                         │
├───────────────────────────────────────┬─────────────────────────────────────┤
│            PUBLIC PORTAL              │           ADMIN DASHBOARD           │
│              Route: `/`               │          Route: `/admin/*`          │
│                                       │                                     │
│  ┌─────────────────────────────────┐ │  ┌─────────────────────────────────┐ │
│  │ Hero / Canvas / Telemetry       │ │  │ Secure Auth Guard (Supabase Auth)│ │
│  │ Events Section & Modal          │ │  │ Events Manager (CRUD)            │ │
│  │ Quote Transition                │ │  │ People / Committee Manager (CRUD)│ │
│  │ The People (Core/TY/SY/Faculty) │ │  │ Archive / Photo Manager (Upload) │ │
│  │ Visual Archive (5-Frame Grid)   │ │  │ Site Settings & Telemetry Manager│ │
│  │ Lightbox Viewer / Footer        │ │  │ Profile & Password Management    │ │
│  └─────────────────────────────────┘ │  └─────────────────────────────────┘ │
│                   │                   │                   │                 │
│                   ▼                   ▼                   ▼                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     DATA ACCESS & SERVICES LAYER                      │  │
│  │  - `eventsService.ts`      - `teamService.ts`                         │  │
│  │  - `archiveService.ts`     - `authService.ts`                         │  │
│  │  - `storageService.ts`     - `siteContentService.ts`                  │  │
│  │  (Hybrid Fetching: Supabase Live Query with Static Mock Fallback)     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE BACKEND PLATFORM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐  │
│  │    POSTGRESQL DB      │ │   SUPABASE AUTH      │ │  SUPABASE STORAGE  │  │
│  │  - `events`           │ │  - Admin Email/Pass  │ │  - `team-photos`   │  │
│  │  - `committee_members`│ │  - JWT Session mgmt  │ │  - `archive-media` │  │
│  │  - `archive_records`  │ │  - MFA Support       │ │  - `site-assets`   │  │
│  │  - `site_settings`    │ │  - Secure Cookies/LS │ │  (Public CDN URLs) │  │
│  └───────────────────────┘ └──────────────────────┘ └────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                  ROW LEVEL SECURITY (RLS) POLICIES                    │  │
│  │  - `anon` role (Public): SELECT only on `is_published = true`         │  │
│  │  - `authenticated` role (Admin): FULL (SELECT, INSERT, UPDATE, DELETE)│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Supabase System Responsibilities

### 4.1 Database Layer (PostgreSQL)

#### A. Table: `events`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, `default gen_random_uuid()` | Unique event identifier |
| `index` | `text` | Not Null (e.g. `'01'`, `'02'`) | Display ordering index |
| `title` | `text` | Not Null | Event title (e.g. `'TECHNOVA'`) |
| `subtitle` | `text` | Not Null | Event subtitle/type |
| `description` | `text` | Not Null | Detailed description |
| `category` | `text` | Not Null | `'TECHNICAL EVENTS' \| 'SPORTS EVENTS' \| 'CULTURAL EVENTS'` |
| `year` | `text` | Not Null (e.g. `'2026'`) | Academic/event year |
| `event_date` | `timestamptz` | Nullable | Scheduled datetime |
| `venue` | `text` | Nullable | Location / hall |
| `registration_url`| `text` | Nullable | Link to registration form |
| `is_published` | `boolean` | `default true` | Visibility toggle |
| `created_at` | `timestamptz` | `default now()` | Audit timestamp |
| `updated_at` | `timestamptz` | `default now()` | Audit timestamp |

#### B. Table: `committee_members`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, `default gen_random_uuid()` | Unique member identifier |
| `slug` | `text` | Unique, Not Null | URL/kebab identifier (e.g. `'tanishq-raut'`) |
| `name` | `text` | Not Null | Member full name |
| `position` | `text` | Not Null | Title (e.g. `'President'`, `'Technical Head'`) |
| `tier` | `text` | Not Null | `'CORE' \| 'TY_LEADERSHIP' \| 'SY_COORDINATOR' \| 'FACULTY'` |
| `domain` | `text` | Nullable | `'OVERALL' \| 'TECHNICAL' \| 'ANCHORING' \| 'MEDIA' \| 'FINANCE' \| 'SPORTS' \| 'ALUMNI' \| 'OPERATIONS'` |
| `photo_url` | `text` | Nullable | Supabase Storage URL or fallback path |
| `department` | `text` | Nullable | Department (for faculty dignitaries) |
| `display_order` | `integer` | `default 0` | Explicit sorting sequence |
| `academic_year` | `text` | `default '2026–2027'` | Academic tenure |
| `is_active` | `boolean` | `default true` | Active member status |
| `created_at` | `timestamptz` | `default now()` | Audit timestamp |
| `updated_at` | `timestamptz` | `default now()` | Audit timestamp |

#### C. Table: `archive_records`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, `default gen_random_uuid()` | Unique archive identifier |
| `index` | `text` | Not Null (e.g. `'01'`, `'02'`) | Visual archive index |
| `title` | `text` | Not Null | Minimal record label (e.g. `'Archive Record 01'`) |
| `category` | `text` | `default 'ARCHIVE'` | Archive category tag |
| `meta` | `text` | `default 'ITSA · SGGSIE&T Records'` | Telemetry/record citation |
| `image_url` | `text` | Not Null | Supabase Storage URL or static path |
| `aspect` | `text` | `'wide' \| 'square' \| 'tall'` | Display proportion guideline |
| `focal_point` | `text` | `default 'center 35%'` | CSS object-position coordinate |
| `display_order` | `integer` | `default 0` | Grid position (1=Lead Anchor, 2=Secondary, etc.) |
| `is_published` | `boolean` | `default true` | Visibility toggle |
| `created_at` | `timestamptz` | `default now()` | Audit timestamp |

#### D. Table: `site_settings`
Key-value store for global configurations:
- `academic_year` (`'2026–2027'`)
- `telemetry_status` (`'SYS: LINUX_KERNEL_STABLE'`)
- `hero_announcement` (optional banner text)
- `contact_email` (`'itsa@sggs.ac.in'`)

---

## 5. Security & Authentication Model

### 5.1 Row Level Security (RLS) Policy Architecture

All tables will have RLS strictly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

1. **Public (`anon` role)**:
   - `SELECT` permission **ONLY** on rows where `is_published = true` (or `is_active = true`).
   - Zero access to `INSERT`, `UPDATE`, or `DELETE`.
   - Zero access to sensitive audit fields or admin logs.

2. **Admin (`authenticated` role)**:
   - Full `SELECT`, `INSERT`, `UPDATE`, `DELETE` on all application tables.
   - Access verified via Supabase JWT signature and user role verification.

```sql
-- Example RLS Policy Pattern
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy
CREATE POLICY "Public users can view published events"
ON events FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- 2. Admin Full Access Policy
CREATE POLICY "Authenticated admins have full access"
ON events FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### 5.2 Storage Security
- **Bucket `team-photos`**: Public read access, authenticated write/update/delete.
- **Bucket `archive-media`**: Public read access, authenticated write/update/delete.
- Maximum upload size constrained (e.g. 5MB per photo).
- MIME types restricted to `image/jpeg`, `image/png`, `image/webp`.

### 5.3 Secrets & Environment Hygiene
- `VITE_SUPABASE_URL`: Public endpoint (safe for frontend client).
- `VITE_SUPABASE_ANON_KEY`: Public client anonymous key (restricted by RLS).
- `SUPABASE_SERVICE_ROLE_KEY`: **NEVER** embedded or committed in frontend source code or client builds.

---

## 6. Data Flow & State Management

### 6.1 Public Website Flow
```
User navigates to `/`
       ↓
React Service Layer (`eventsService.ts`, `teamService.ts`, `archiveService.ts`)
       ↓
Attempts live Supabase query (cached / stale-while-revalidate)
 ├── Success → Render live dynamic records from database
 └── Offline / Error / Empty → Seamlessly fallback to static `mockData.ts`
       ↓
Public UI renders with zero layout shift, zero breaking changes
```

### 6.2 Admin Dashboard Flow
```
Admin navigates to `/admin`
       ↓
`AuthGuard` checks Supabase JWT session
 ├── Not Authenticated → Render Apple-minimalist `/admin/login`
 └── Authenticated → Render `/admin/dashboard`
       ↓
Admin performs mutation (e.g. Upload photo / Add event / Update member)
       ↓
`SupabaseClient` sends authenticated RPC / Mutation with JWT
       ↓
PostgreSQL validates Row Level Security → Applies mutation
       ↓
Admin UI displays toast feedback; Public site displays updated data
```

---

## 7. Migration & Rollout Strategy

To maintain zero downtime and zero risk:

1. **Phase 1: Environment & Client Initialization**
   - Install `@supabase/supabase-js` (and `react-router-dom` for cleanly separating `/admin` from `/`).
   - Configure typed Supabase client with environment variable validation (`.env.example`).

2. **Phase 2: Database Schema & Storage Setup**
   - Execute SQL migrations for `events`, `committee_members`, `archive_records`, `site_settings`.
   - Apply Row Level Security policies and create Storage buckets.

3. **Phase 3: Service Layer & Resilient Hooks**
   - Implement data services with built-in fallback to `mockData.ts`.
   - Connect existing public components to custom hooks (`useEvents`, `useTeam`, `useArchive`).

4. **Phase 4: Admin Authentication & Dashboard UI**
   - Build lightweight, premium Admin UI conforming to ITSA's Apple-inspired minimalism.
   - Implement CRUD panels for Events, Committee Members, and Archive Media.

5. **Phase 5: Data Seeding & Final Verification**
   - Seed database with all current official committee members and 5 archive photographs.
   - Verify complete end-to-end functionality across desktop, tablet, and mobile.
