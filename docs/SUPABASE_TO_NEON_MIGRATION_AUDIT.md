# Comprehensive Migration Audit: Supabase to Neon PostgreSQL & Custom Backend

**Project:** ITSA Web Platform (`itsa-frontend`)
**Target Database:** Neon Serverless PostgreSQL
**Audit Date:** September 3, 2026
**Status:** Complete Architectural Audit (Read-Only Inspection)

---

## 1. Executive Summary & Architectural Paradigm Shift

The ITSA platform is currently built as a Single Page Application (SPA) using React 19, TypeScript, and Vite, utilizing **Supabase** as a Backend-as-a-Service (BaaS). In the current architecture, the browser frontend communicates directly with Supabase via `@supabase/supabase-js`, relying on:
1. **PostgREST** for client-side database queries (`supabase.from(...)`).
2. **Supabase Auth** (GoTrue) for email/password authentication, JWT issuance, and session token storage in browser `localStorage`.
3. **Supabase Storage** for uploading and serving public images across three buckets (`team-photos`, `event-media`, `archive-media`).
4. **PostgreSQL Row Level Security (RLS)** and custom PostgreSQL functions (`is_admin`, `is_super_admin`, `can_manage_content`) to enforce RBAC directly inside the database engine.

### Why Migrating to Neon Requires a Dedicated Backend Service
**Neon** is a serverless, branching PostgreSQL database. Unlike Supabase, Neon:
- **Does NOT expose a public client-side REST API (PostgREST)** for arbitrary browser queries. Exposing database connection strings or connection pools directly to an untrusted browser bundle is a critical security vulnerability.
- **Does NOT include an authentication engine (Supabase Auth / GoTrue)**.
- **Does NOT provide object/blob storage (Supabase Storage)**.
- **Does NOT manage browser session tokens or auto-refresh loops**.

**Core Migration Requirement:**
Migrating from Supabase to Neon cannot simply be a matter of swapping environment variables. It requires the introduction of a lightweight, secure **Backend API Service** (e.g., Node.js / Express / Fastify in TypeScript) placed between the React frontend and Neon PostgreSQL. The backend will take over:
1. User credential validation (password hashing with bcrypt/argon2) and session/JWT issuance.
2. Server-side Role-Based Access Control (RBAC) middleware.
3. Parameterized SQL queries against Neon using connection pooling (`@neondatabase/serverless` or `pg`).
4. File/media storage orchestration (via S3, Cloudflare R2, or local storage disk).

---

## 2. Priority 1: Repository-Wide Supabase Usage Inventory

A comprehensive code search was executed across the entire repository for all Supabase symbols, imports, environment variables, and query patterns.

### 2.1 Package Dependencies
| File | Line | Symbol / Statement | Purpose |
|---|---|---|---|
| [`package.json`](file:///home/moonwaker777/itsa-frontend/package.json) | Line 11 | `"@supabase/supabase-js": "^2.113.0"` | Client library for Auth, Database, and Storage |
| [`package-lock.json`](file:///home/moonwaker777/itsa-frontend/package-lock.json) | Lines 703–781 | `@supabase/*` subpackages | Bundled client modules (auth-js, postgrest-js, storage-js, realtime-js, phoenix) |

### 2.2 Client Initialization & Environment Configuration
| File | Lines | Code Pattern | Context |
|---|---|---|---|
| [`src/lib/supabase.ts`](file:///home/moonwaker777/itsa-frontend/src/lib/supabase.ts) | 1, 4–5, 10–15, 20–30 | `createClient<Database>(...)`, `import.meta.env.VITE_SUPABASE_URL`, `import.meta.env.VITE_SUPABASE_ANON_KEY`, `isSupabaseConfigured` | Instantiates typed client with mock fallback when variables are unset |
| [`.env.example`](file:///home/moonwaker777/itsa-frontend/.env.example) | Lines 8, 11 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Environment template for developer setup |
| [`src/pages/admin/AdminLogin.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/AdminLogin.tsx) | Line 90 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | UI warning message shown when unconfigured |
| [`src/hooks/useAuth.ts`](file:///home/moonwaker777/itsa-frontend/src/hooks/useAuth.ts) | Line 75 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Exception message thrown on unconfigured login attempt |

### 2.3 Supabase Auth (`supabase.auth.*`)
| File | Line | Supabase Method | Caller Function | Component / Consumer |
|---|---|---|---|---|
| [`src/hooks/useAuth.ts`](file:///home/moonwaker777/itsa-frontend/src/hooks/useAuth.ts) | Line 44 | `supabase.auth.getSession()` | `useEffect` initialization | Mount check for active session |
| [`src/hooks/useAuth.ts`](file:///home/moonwaker777/itsa-frontend/src/hooks/useAuth.ts) | Line 57 | `supabase.auth.onAuthStateChange(...)` | `useEffect` listener | Reactive session/user synchronization |
| [`src/hooks/useAuth.ts`](file:///home/moonwaker777/itsa-frontend/src/hooks/useAuth.ts) | Line 78 | `supabase.auth.signInWithPassword({ email, password })` | `signInWithPassword` | [`AdminLogin.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/AdminLogin.tsx) |
| [`src/hooks/useAuth.ts`](file:///home/moonwaker777/itsa-frontend/src/hooks/useAuth.ts) | Line 96 | `supabase.auth.signOut()` | `signOut` | [`AdminSidebar.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/AdminSidebar.tsx), [`AdminMobileNav.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/AdminMobileNav.tsx), [`ProtectedRoute.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/ProtectedRoute.tsx) |

### 2.4 Supabase PostgREST Database Queries (`supabase.from(...)`)
| Service File | Line | Query Chain | Target Table | Caller Hook / Component |
|---|---|---|---|---|
| [`src/hooks/useAuth.ts`](file:///home/moonwaker777/itsa-frontend/src/hooks/useAuth.ts) | 15–20 | `supabase.from('admin_profiles').select('*').eq('id', userId).eq('is_active', true).single()` | `admin_profiles` | `fetchAdminProfile` -> `useAuth` |
| [`src/services/adminUsersService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/adminUsersService.ts) | 59–62 | `supabase.from('admin_profiles').select('*').order('created_at', { ascending: true })` | `admin_profiles` | `getAllAdminProfiles` -> `useAdminUsers` -> [`UsersPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/UsersPage.tsx) |
| [`src/services/adminUsersService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/adminUsersService.ts) | 125–130 | `supabase.from('admin_profiles').update(payload).eq('id', id).select().single()` | `admin_profiles` | `updateAdminProfile` -> `useAdminUsers` -> [`UsersPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/UsersPage.tsx) |
| [`src/services/adminUsersService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/adminUsersService.ts) | 169–172 | `supabase.from('admin_profiles').delete().eq('id', id)` | `admin_profiles` | `revokeAdminProfile` -> `useAdminUsers` -> [`UsersPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/UsersPage.tsx) |
| [`src/services/announcementsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/announcementsService.ts) | 47–54 | `supabase.from('announcements').select('*').eq('is_published', true).or(...).or(...).order(...).order(...)` | `announcements` | `getPublishedAnnouncements` -> `useAnnouncements` |
| [`src/services/announcementsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/announcementsService.ts) | 85–90 | `supabase.from('announcements').select('*').order('display_order', ...).order('created_at', ...)` | `announcements` | `getAllAdminAnnouncements` -> `useAnnouncements` -> [`AnnouncementsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/AnnouncementsPage.tsx) |
| [`src/services/announcementsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/announcementsService.ts) | 144–149 | `supabase.from('announcements').insert([payload]).select().single()` | `announcements` | `createAnnouncement` -> `useAnnouncements` -> [`AnnouncementsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/AnnouncementsPage.tsx) |
| [`src/services/announcementsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/announcementsService.ts) | 188–194 | `supabase.from('announcements').update(payload).eq('id', id).select().single()` | `announcements` | `updateAnnouncement` -> `useAnnouncements` -> [`AnnouncementsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/AnnouncementsPage.tsx) |
| [`src/services/announcementsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/announcementsService.ts) | 221–224 | `supabase.from('announcements').delete().eq('id', id)` | `announcements` | `deleteAnnouncement` -> `useAnnouncements` -> [`AnnouncementsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/AnnouncementsPage.tsx) |
| [`src/services/archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) | 93–98 | `supabase.from('archive_records').select('*').eq('is_published', true).order(...).order(...)` | `archive_records` | `getPublishedArchiveRecords` -> `useArchive` -> [`HomePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/HomePage.tsx), [`Gallery.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Gallery.tsx) |
| [`src/services/archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) | 129–134 | `supabase.from('archive_records').select('*').order('display_order', ...).order('created_at', ...)` | `archive_records` | `getAllAdminArchiveRecords` -> `useArchive` -> [`ArchivePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/ArchivePage.tsx) |
| [`src/services/archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) | 192–197 | `supabase.from('archive_records').insert([payload]).select().single()` | `archive_records` | `createArchiveRecord` -> `useArchive` -> [`ArchivePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/ArchivePage.tsx) |
| [`src/services/archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) | 237–243 | `supabase.from('archive_records').update(payload).eq('id', id).select().single()` | `archive_records` | `updateArchiveRecord` -> `useArchive` -> [`ArchivePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/ArchivePage.tsx) |
| [`src/services/archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) | 270–273 | `supabase.from('archive_records').delete().eq('id', id)` | `archive_records` | `deleteArchiveRecord` -> `useArchive` -> [`ArchivePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/ArchivePage.tsx) |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 133–138 | `supabase.from('events').select('*').eq('is_published', true).order(...).order(...)` | `events` | `getPublishedEvents` -> `useEvents` -> [`HomePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/HomePage.tsx), [`Events.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Events.tsx) |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 169–175 | `supabase.from('events').select('*').eq('is_published', true).eq('category', normCat)...` | `events` | `getPublishedEventsByCategory` -> `useEvents` -> [`Events.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Events.tsx) |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 206–211 | `supabase.from('events').select('*').order('display_order', ...).order('created_at', ...)` | `events` | `getAllAdminEvents` -> `useEvents` -> [`EventsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/EventsPage.tsx), [`DashboardPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/DashboardPage.tsx) |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 276–281 | `supabase.from('events').insert([payload]).select().single()` | `events` | `createEvent` -> `useEvents` -> [`EventsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/EventsPage.tsx) |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 327–333 | `supabase.from('events').update(payload).eq('id', id).select().single()` | `events` | `updateEvent` -> `useEvents` -> [`EventsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/EventsPage.tsx) |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 350–353 | `supabase.from('events').delete().eq('id', id)` | `events` | `deleteEvent` -> `useEvents` -> [`EventsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/EventsPage.tsx) |
| [`src/services/positionsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/positionsService.ts) | 74–79 | `supabase.from('positions').select('*').order('display_order', ...).order('name', ...)` | `positions` | `getAllAdminPositions` -> `usePositions` -> [`PositionsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PositionsPage.tsx), [`DashboardPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/DashboardPage.tsx) |
| [`src/services/positionsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/positionsService.ts) | 105–110 | `supabase.from('positions').select('*').eq('is_active', true).order(...).order(...)` | `positions` | `getActivePositions` -> `usePositions` -> [`PersonModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/PersonModal.tsx) |
| [`src/services/positionsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/positionsService.ts) | 152–156 | `supabase.from('committee_members').select('*', { count: 'exact', head: true }).ilike('position', normName)` | `committee_members` | `checkPositionInUse` -> `deletePosition` |
| [`src/services/positionsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/positionsService.ts) | 211–217 | `supabase.from('positions').select('id').ilike('name', name).eq('tier', ...).eq('is_active', true).maybeSingle()` | `positions` | `createPosition` (duplicate verification) |
| [`src/services/positionsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/positionsService.ts) | 223–228 | `supabase.from('positions').insert([payload]).select().single()` | `positions` | `createPosition` -> `usePositions` -> [`PositionsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PositionsPage.tsx) |
| [`src/services/positionsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/positionsService.ts) | 262–268 | `supabase.from('positions').update(payload).eq('id', id).select().single()` | `positions` | `updatePosition` -> `usePositions` -> [`PositionsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PositionsPage.tsx) |
| [`src/services/positionsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/positionsService.ts) | 302–305 | `supabase.from('positions').delete().eq('id', id)` | `positions` | `deletePosition` -> `usePositions` -> [`PositionsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PositionsPage.tsx) |
| [`src/services/siteSettingsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/siteSettingsService.ts) | 36–40 | `supabase.from('site_settings').select('key, value').eq('is_public', true)` | `site_settings` | `getPublicSiteSettings` -> `useSiteSettings` -> [`Quote.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Quote.tsx) |
| [`src/services/siteSettingsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/siteSettingsService.ts) | 79–90 | `supabase.from('site_settings').upsert({ key, value, ... }, { onConflict: 'key' })` | `site_settings` | `updateSiteSetting` -> `useSiteSettings` -> [`SettingsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/SettingsPage.tsx) |
| [`src/services/siteSettingsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/siteSettingsService.ts) | 130–133 | `supabase.from('site_settings').upsert(upsertRows, { onConflict: 'key' })` | `site_settings` | `saveBatchSiteSettings` -> `useSiteSettings` -> [`SettingsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/SettingsPage.tsx) |
| [`src/services/teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) | 84–89 | `supabase.from('committee_members').select('*').eq('is_active', true).order(...).order(...)` | `committee_members` | `getActiveCommitteeMembers` -> `useTeam` -> [`HomePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/HomePage.tsx), [`Team.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Team.tsx) |
| [`src/services/teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) | 118–125 | `supabase.from('committee_members').select('*').eq('is_active', true).eq('tier', tier)...` | `committee_members` | `getActiveCommitteeMembersByTier` -> `useTeam` |
| [`src/services/teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) | 155–160 | `supabase.from('committee_members').select('*').order('display_order', ...).order('created_at', ...)` | `committee_members` | `getAllAdminMembers` -> `useTeam` -> [`PeoplePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PeoplePage.tsx), [`DashboardPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/DashboardPage.tsx) |
| [`src/services/teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) | 215–220 | `supabase.from('committee_members').insert([payload]).select().single()` | `committee_members` | `createMember` -> `useTeam` -> [`PeoplePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PeoplePage.tsx) |
| [`src/services/teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) | 263–269 | `supabase.from('committee_members').update(payload).eq('id', id).select().single()` | `committee_members` | `updateMember` -> `useTeam` -> [`PeoplePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PeoplePage.tsx) |
| [`src/services/teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) | 296–299 | `supabase.from('committee_members').delete().eq('id', id)` | `committee_members` | `deleteMember` -> `useTeam` -> [`PeoplePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PeoplePage.tsx) |

### 2.5 Supabase Storage (`supabase.storage.*`)
| Service File | Lines | Operation | Bucket Name | Caller / Purpose |
|---|---|---|---|---|
| [`src/services/teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) | 327–333 | `supabase.storage.from('team-photos').upload(...)` | `team-photos` | `uploadMemberPhoto` -> [`PersonModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/PersonModal.tsx) |
| [`src/services/teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) | 338–340 | `supabase.storage.from('team-photos').getPublicUrl(filePath)` | `team-photos` | Generates public portrait URL |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 67–70 | `supabase.storage.from('event-media').getPublicUrl(trimmed)` | `event-media` | `resolveEventImageUrl` resolution |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 398–404 | `supabase.storage.from('event-media').upload(...)` | `event-media` | `uploadEventCoverImage` -> [`EventModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/EventModal.tsx) |
| [`src/services/eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) | 409–411 | `supabase.storage.from('event-media').getPublicUrl(filePath)` | `event-media` | Generates public event banner URL |
| [`src/services/archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) | 29–32 | `supabase.storage.from('archive-media').getPublicUrl(trimmed)` | `archive-media` | `resolveArchiveImageUrl` resolution |
| [`src/services/archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) | 301–307 | `supabase.storage.from('archive-media').upload(...)` | `archive-media` | `uploadArchiveImage` -> [`ArchiveModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/ArchiveModal.tsx) |
| [`src/services/archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) | 312–314 | `supabase.storage.from('archive-media').getPublicUrl(filePath)` | `archive-media` | Generates public archive photo URL |

### 2.6 RPC Calls (`.rpc(...)`)
- **Audit Finding:** **Zero `.rpc(...)` calls exist in the frontend codebase**. The frontend does not invoke any stored procedures directly; all business logic and RLS evaluation were triggered implicitly by PostgREST queries against table endpoints.

---

## 3. Priority 2: Service & Hook Architectural Dependency Chains

Below is the complete trace from React Components through custom Hooks and Services to Supabase and the underlying Storage/Postgres entities.

```mermaid
flowchart TD
    subgraph UI_Layer [React Component Layer]
        C1[HomePage / Events.tsx]
        C2[HomePage / Team.tsx / ProfileModal]
        C3[HomePage / Gallery.tsx / LightboxModal]
        C4[HomePage / Quote.tsx]
        C5[Admin / EventsPage / EventModal]
        C6[Admin / PeoplePage / PersonModal]
        C7[Admin / PositionsPage / PositionModal]
        C8[Admin / ArchivePage / ArchiveModal]
        C9[Admin / AnnouncementsPage / Modal]
        C10[Admin / UsersPage / AdminUserModal]
        C11[Admin / SettingsPage]
        C12[AdminLogin / ProtectedRoute]
    end

    subgraph Hook_Layer [React Custom Hooks]
        H1[useEvents]
        H2[useTeam]
        H3[useArchive]
        H4[useSiteSettings]
        H5[usePositions]
        H6[useAnnouncements]
        H7[useAdminUsers]
        H8[useAuth]
    end

    subgraph Service_Layer [Frontend Services]
        S1[eventsService.ts]
        S2[teamService.ts]
        S3[archiveService.ts]
        S4[siteSettingsService.ts]
        S5[positionsService.ts]
        S6[announcementsService.ts]
        S7[adminUsersService.ts]
        S8[supabase.ts Client]
    end

    subgraph Supabase_Entity [Supabase Engine (Current)]
        T1[(public.events)]
        T2[(public.committee_members)]
        T3[(public.archive_records)]
        T4[(public.site_settings)]
        T5[(public.positions)]
        T6[(public.announcements)]
        T7[(public.admin_profiles)]
        T8[(auth.users)]
        B1{{Bucket: event-media}}
        B2{{Bucket: team-photos}}
        B3{{Bucket: archive-media}}
    end

    C1 --> H1
    C5 --> H1
    H1 --> S1
    S1 --> S8
    S8 --> T1
    S8 --> B1

    C2 --> H2
    C6 --> H2
    H2 --> S2
    S2 --> S8
    S8 --> T2
    S8 --> B2

    C3 --> H3
    C8 --> H3
    H3 --> S3
    S3 --> S8
    S8 --> T3
    S8 --> B3

    C4 --> H4
    C11 --> H4
    H4 --> S4
    S4 --> S8
    S8 --> T4

    C6 --> H5
    C7 --> H5
    H5 --> S5
    S5 --> S8
    S8 --> T5
    S5 --> T2

    C9 --> H6
    H6 --> S6
    S6 --> S8
    S8 --> T6

    C10 --> H7
    H7 --> S7
    S7 --> S8
    S8 --> T7

    C12 --> H8
    H8 --> S8
    S8 --> T8
    S8 --> T7
```

### 3.1 Module-by-Module Trace

#### 1. Events Module
- **Public View:** [`HomePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/HomePage.tsx) -> [`Events.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Events.tsx) -> `useEvents(category)` -> `getPublishedEvents()` / `getPublishedEventsByCategory()` -> `supabase.from('events').select(...)` -> `public.events` (filtered by `is_published = true`).
- **Admin Management:** [`EventsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/EventsPage.tsx) + [`EventModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/EventModal.tsx) -> `useEvents({ adminMode: true })` -> `getAllAdminEvents()` / `createEvent()` / `updateEvent()` / `deleteEvent()` -> `supabase.from('events')`.
- **Media Upload:** [`EventModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/EventModal.tsx) -> `uploadEventCoverImage(file)` -> `supabase.storage.from('event-media').upload('covers/...')` -> Bucket `event-media`.

#### 2. People & Committee Module
- **Public View:** [`HomePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/HomePage.tsx) -> [`Team.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Team.tsx) -> `useTeam()` -> `getActiveCommitteeMembers()` -> `supabase.from('committee_members').select(...)` -> `public.committee_members` (filtered by `is_active = true`).
- **Admin Management:** [`PeoplePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PeoplePage.tsx) + [`PersonModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/PersonModal.tsx) -> `useTeam({ adminMode: true })` -> `getAllAdminMembers()` / `createMember()` / `updateMember()` / `deleteMember()` -> `supabase.from('committee_members')`.
- **Media Upload:** [`PersonModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/PersonModal.tsx) -> `uploadMemberPhoto(file)` -> `supabase.storage.from('team-photos').upload('portraits/...')` -> Bucket `team-photos`.

#### 3. Positions Hierarchy Module
- **Admin Management:** [`PositionsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/PositionsPage.tsx) + [`PositionModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/PositionModal.tsx) -> `usePositions({ adminMode: true })` -> `getAllAdminPositions()` / `createPosition()` / `updatePosition()` / `deletePosition()` -> `supabase.from('positions')`.
- **Reference Guard:** Before deleting a position, `positionsService.ts` checks `checkPositionInUse(positionName)` by querying `supabase.from('committee_members').select('*', { count: 'exact', head: true }).ilike('position', normName)`. Deletion is aborted if referenced.
- **Dropdown Suggestions:** [`PersonModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/PersonModal.tsx) -> `usePositions()` -> `getActivePositions()` -> populates available roles for selected tier.

#### 4. Visual Archive Module
- **Public View:** [`HomePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/HomePage.tsx) -> [`Gallery.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Gallery.tsx) + [`LightboxModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/LightboxModal.tsx) -> `useArchive()` -> `getPublishedArchiveRecords()` -> `supabase.from('archive_records').select(...)` -> `public.archive_records` (with permanent fallback to the 5 authentic local files in `/public/archive/`).
- **Admin Management:** [`ArchivePage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/ArchivePage.tsx) + [`ArchiveModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/ArchiveModal.tsx) -> `useArchive({ adminMode: true })` -> `getAllAdminArchiveRecords()` / `createArchiveRecord()` / `updateArchiveRecord()` / `deleteArchiveRecord()` -> `supabase.from('archive_records')`.
- **Media Upload:** [`ArchiveModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/ArchiveModal.tsx) -> `uploadArchiveImage(file)` -> `supabase.storage.from('archive-media').upload('archives/...')` -> Bucket `archive-media`.

#### 5. Announcements Module
- **Public Query:** `getPublishedAnnouncements()` -> `supabase.from('announcements').select('*').eq('is_published', true)` with active date window filtering.
- **Admin Management:** [`AnnouncementsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/AnnouncementsPage.tsx) + [`AnnouncementModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/AnnouncementModal.tsx) -> `useAnnouncements({ adminMode: true })` -> `getAllAdminAnnouncements()` / `createAnnouncement()` / `updateAnnouncement()` / `deleteAnnouncement()` -> `supabase.from('announcements')`.

#### 6. Site Settings Module
- **Public Query:** [`Quote.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Quote.tsx) -> `useSiteSettings()` -> `getPublicSiteSettings()` -> `supabase.from('site_settings').select('key, value').eq('is_public', true)` -> `public.site_settings`.
- **Admin Management:** [`SettingsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/SettingsPage.tsx) -> `useSiteSettings()` -> `saveBatchSiteSettings(map)` / `updateSiteSetting(key, val)` -> `supabase.from('site_settings').upsert(...)`.

#### 7. Admin Users & RBAC Module
- **Admin Management:** [`UsersPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/UsersPage.tsx) + [`AdminUserModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/AdminUserModal.tsx) -> `useAdminUsers()` -> `getAllAdminProfiles()` / `updateAdminProfile()` / `toggleAdminActive()` / `revokeAdminProfile()` -> `supabase.from('admin_profiles')`.

#### 8. Authentication Module
- **Authentication Flow:** [`AdminLogin.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/AdminLogin.tsx) -> `useAuth()` -> `signInWithPassword(email, pass)` -> `supabase.auth.signInWithPassword(...)` -> `auth.users`.
- **Profile Authorization:** On session change -> `fetchAdminProfile(user.id)` -> `supabase.from('admin_profiles').select('*').eq('id', user.id).single()`.
- **Route Guard:** [`ProtectedRoute.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/ProtectedRoute.tsx) intercepts all `/admin/*` routes. Validates `isAuthenticated` and `isAdmin` (where `isAdmin = Boolean(adminProfile && adminProfile.is_active)`).

---

## 4. Priority 3: Authentication & RBAC Audit

### 4.1 Login Mechanics
1. User enters email and password at `/admin/login`.
2. `AdminLogin.tsx` calls `signInWithPassword(email, password)` via `useAuth()`.
3. `useAuth.ts` calls `supabase.auth.signInWithPassword({ email, password })`.
4. Supabase Auth checks credentials against `auth.users`. If valid, it returns an access token (JWT) and refresh token.
5. In `useAuth.ts`, the `onAuthStateChange` listener intercepts the event, sets `user` and `session`, and invokes `fetchAdminProfile(session.user.id)`.
6. `fetchAdminProfile` executes a query against `public.admin_profiles` matching `id = userId` and `is_active = true`.
7. If the profile exists and is active, state variables are populated:
   - `adminProfile`: `{ id, email, full_name, role, is_active, ... }`
   - `isAuthenticated`: `Boolean(user)`
   - `isAdmin`: `Boolean(adminProfile && adminProfile.is_active)`
   - `isSuperAdmin`: `Boolean(adminProfile && adminProfile.is_active && adminProfile.role === 'SUPER_ADMIN')`
8. `AdminLogin.tsx` navigates the user to `/admin/dashboard` (or the previous restricted route attempted).

### 4.2 Session Maintenance
- The Supabase client in `src/lib/supabase.ts` is configured with:
  ```typescript
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
  ```
- Sessions are stored in the browser's `localStorage` under the key `sb-<project-ref>-auth-token`.
- On application bootstrap, `supabase.auth.getSession()` retrieves the cached JWT.
- If the JWT has expired, `@supabase/supabase-js` automatically issues a refresh token request to Supabase Auth.
- **Neon Gap:** Neon has no token refresh service and cannot persist sessions in `localStorage` securely. In the Neon architecture, sessions must be managed via HTTP-Only, Secure, SameSite cookies or signed JWTs issued by the custom backend.

### 4.3 Role Hierarchy & Access Matrix

| Role | Permitted Actions | Blocked Actions |
|---|---|---|
| **SUPER_ADMIN** | Full CMS CRUD on all tables; Edit/Revoke Admin Users; Mutate Global Site Settings. | Cannot deactivate or demote the last remaining active `SUPER_ADMIN`. |
| **ADMIN** | Full CMS CRUD on Events, People (`committee_members`), Positions, Visual Archive, and Announcements. | Read-only on `admin_profiles` and `site_settings`. Cannot modify users or site-wide configuration. |
| **EDITOR** | Full CMS CRUD on Events and Announcements only. | Read-only or blocked on People, Positions, Archive, Users, and Settings. |

### 4.4 Enforcement Separation: Client UI vs Database RLS

| Feature / Action | Client-Side React Enforcement | Supabase PostgreSQL RLS Enforcement |
|---|---|---|
| Admin Route Access (`/admin/*`) | [`ProtectedRoute.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/ProtectedRoute.tsx) redirects unauthenticated users to `/admin/login`, or displays "Access Restricted" if `!isAdmin`. | N/A (Client routing only). |
| Navigation Item Visibility | [`AdminSidebar.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/AdminSidebar.tsx) & [`AdminMobileNav.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/AdminMobileNav.tsx) hide or show lock icons based on `minRole`. | N/A (Client UI presentation). |
| Action Button Disabling | In [`UsersPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/UsersPage.tsx) and [`SettingsPage.tsx`](file:///home/moonwaker777/itsa-frontend/src/pages/admin/SettingsPage.tsx), Edit/Save/Revoke buttons are disabled if `!isSuperAdmin`. | Redundant safety. |
| Last Super Admin Protection | In `adminUsersService.ts`, deactivation or demotion of the last active `SUPER_ADMIN` throws an error. | N/A (Checked in application code before mutation). |
| Position Reference Guard | In `positionsService.ts`, deleting a position assigned to active members is blocked. | N/A (Checked via count query in application code). |
| Public Data Filtering | Services filter queries (`.eq('is_published', true)` or `.eq('is_active', true)`). | **Strictly enforced by RLS**: Even if client omits `.eq('is_published', true)`, `anon` role can only view published rows. |
| Content Mutation Authorization | Checked in UI handlers. | **Strictly enforced by RLS**: Mutation queries check `can_manage_content(auth.uid())`, `is_super_admin(auth.uid())`, or `is_admin(auth.uid())`. |
| Storage Bucket Uploads | Handled via file pickers in modals. | **Strictly enforced by RLS**: `storage.objects` policies verify `is_admin(auth.uid())`. |

### 4.5 What Must Move to the Backend for Neon

1. **User Identity & Password Verification:**
   - Supabase `auth.users` must be replaced by a local `admin_users` table in Neon.
   - Passwords must be hashed using `argon2id` or `bcrypt`.
   - Endpoint: `POST /api/auth/login`.
2. **Session / Token Issuance:**
   - Backend must issue signed JWTs or encrypted session IDs stored in `httpOnly`, `secure`, `sameSite: 'lax'` cookies.
   - Endpoint: `GET /api/auth/me` (returns current user profile and role on app load).
   - Endpoint: `POST /api/auth/logout` (clears cookie).
3. **Authorization Middleware:**
   - Express/Fastify middleware (`requireAuth`, `requireRole('ADMIN')`, `requireSuperAdmin`) must replicate the checks currently enforced by PostgreSQL RLS functions (`is_admin`, `is_super_admin`, `can_manage_content`).
4. **Data Mutation Guards:**
   - "Last Super Admin" safeguard must be enforced in the backend controller before committing the update.
   - Position usage validation must be run inside a database transaction before deletion.

---

## 5. Priority 4: Media & Storage Architecture Audit

### 5.1 Storage Buckets Specification

| Bucket Identifier | Target Content | Max File Size | Allowed MIME Types | Storage Path Format | Service Function |
|---|---|---|---|---|---|
| `team-photos` | Member & faculty portrait photos | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | `portraits/${Date.now()}-${random}.${ext}` | `uploadMemberPhoto` in [`teamService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/teamService.ts) |
| `event-media` | Event banners & cover images | 10 MB | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | `covers/${Date.now()}-${random}.${ext}` | `uploadEventCoverImage` in [`eventsService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/eventsService.ts) |
| `archive-media` | Visual Archive photographs | 10 MB | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | `archives/${Date.now()}-${random}.${ext}` | `uploadArchiveImage` in [`archiveService.ts`](file:///home/moonwaker777/itsa-frontend/src/services/archiveService.ts) |

### 5.2 Upload, Retrieval, Replacement, and Deletion Lifecycle

1. **Upload Workflow:**
   - User clicks upload in [`EventModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/EventModal.tsx), [`PersonModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/PersonModal.tsx), or [`ArchiveModal.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/admin/ArchiveModal.tsx).
   - Client validates MIME type and file size.
   - In live mode (`isSupabaseConfigured = true`):
     - `supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '3600', upsert: false })` is called.
     - `supabase.storage.from(bucket).getPublicUrl(filePath)` generates the absolute public CDN URL:
       `https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<filePath>`.
     - The public URL is set into the form state (`cover_image_url`, `photo_url`, or `image_url`).
   - In unconfigured/mock mode:
     - `URL.createObjectURL(file)` generates a temporary browser blob URL for preview.
2. **Retrieval & Resolution Workflow:**
   - Services implement URL normalizers: `resolveEventImageUrl`, `resolveArchiveImageUrl`, `normalizeSocialUrl`.
   - Resolution priority:
     1. If URL starts with `http://` or `https://`, return as-is.
     2. If URL starts with `/` (e.g. `/team/tanishq-raut.jpg` or `/archive/WhatsApp...`), return root-relative path with URI encoding.
     3. If relative storage path (e.g. `archives/abc.jpg`), request `supabase.storage.from(bucket).getPublicUrl(path)`.
3. **Replacement Workflow:**
   - When a user uploads a new image in a modal, a new file path is generated with a fresh timestamp and uploaded.
   - The database record's URL column is updated on form submit.
   - **Current Flaw:** The previous file is NOT deleted from Supabase Storage; it becomes an orphaned object in the bucket.
4. **Deletion Workflow:**
   - Calling `deleteEvent(id)`, `deleteMember(id)`, or `deleteArchiveRecord(id)` deletes the row from the database table.
   - **Current Flaw:** Neither the frontend services nor the database triggers delete the associated storage object from `storage.objects`.

### 5.3 Storage Replacement Architecture for Neon
Neon does not provide object storage. For the migration, media storage must be decoupled:
- **Option A (Cloud Object Storage - Recommended):** Cloudflare R2 or AWS S3.
  - Backend provides upload endpoints: `POST /api/upload/portrait`, `POST /api/upload/cover`, `POST /api/upload/archive`.
  - Backend uploads files using AWS S3 SDK / presigned URLs and returns CDN URLs.
- **Option B (Local Disk Storage):**
  - Backend receives multipart upload via `multer`, saves to `./uploads/<bucket>/<filename>`, and serves statically via Express (`/uploads/...`).
- **Media Cleanup:** Backend should parse the old URL during record updates or deletions and delete the file from the storage provider.

---

## 6. Priority 5: Database Schema & Seed Data Inventory

### 6.1 Schema DDL & Table Specifications

The database schema is defined across two migration files:
1. `supabase/migrations/20260902164800_initial_cms_schema.sql` (Base schema, triggers, initial RLS, storage buckets)
2. `supabase/migrations/20260902184000_security_and_rbac_hardening.sql` (Search path hardening, strict role-tier RLS policies)

#### Table 1: `public.admin_profiles`
- **Columns:**
  - `id` (uuid, Primary Key, Foreign Key -> `auth.users(id)` ON DELETE CASCADE)
  - `email` (text, NOT NULL)
  - `full_name` (text, NULL)
  - `role` (text, NOT NULL, DEFAULT 'ADMIN', CHECK `role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR')`)
  - `is_active` (boolean, NOT NULL, DEFAULT true)
  - `created_at` (timestamptz, NOT NULL, DEFAULT now())
  - `updated_at` (timestamptz, NOT NULL, DEFAULT now())
- **Triggers:** `set_admin_profiles_updated_at` (BEFORE UPDATE -> `public.handle_updated_at()`)
- **Indexes:** `idx_admin_profiles_role`, `idx_admin_profiles_is_active`
- **Migration Note:** `auth.users(id)` is Supabase-specific. For Neon, replace with a unified `admin_users` table containing `password_hash`.

#### Table 2: `public.events`
- **Columns:**
  - `id` (uuid, Primary Key, DEFAULT `gen_random_uuid()`)
  - `title` (text, NOT NULL)
  - `description` (text, NULL)
  - `category` (text, NOT NULL, CHECK `category IN ('TECHNICAL', 'SPORTS', 'CULTURAL')`)
  - `year` (integer, CHECK `year IS NULL OR (year >= 1980 AND year <= 2100)`)
  - `event_date` (date, NULL)
  - `start_time` (time, NULL)
  - `end_time` (time, NULL)
  - `venue` (text, NULL)
  - `registration_url` (text, NULL)
  - `cover_image_url` (text, NULL)
  - `status` (text, NOT NULL, DEFAULT 'UPCOMING', CHECK `status IN ('DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED')`)
  - `is_published` (boolean, NOT NULL, DEFAULT false)
  - `is_featured` (boolean, NOT NULL, DEFAULT false)
  - `display_order` (integer, NOT NULL, DEFAULT 0, CHECK `display_order >= 0`)
  - `created_at` (timestamptz, NOT NULL, DEFAULT now())
  - `updated_at` (timestamptz, NOT NULL, DEFAULT now())
- **Triggers:** `set_events_updated_at`
- **Indexes:** `idx_events_category`, `idx_events_status`, `idx_events_is_published`, `idx_events_event_date`, `idx_events_display_order`

#### Table 3: `public.positions`
- **Columns:**
  - `id` (uuid, Primary Key, DEFAULT `gen_random_uuid()`)
  - `name` (text, NOT NULL)
  - `tier` (text, NOT NULL, CHECK `tier IN ('CORE', 'TY_LEADERSHIP', 'SY_COORDINATOR', 'FACULTY')`)
  - `domain` (text, NULL)
  - `description` (text, NULL)
  - `display_order` (integer, NOT NULL, DEFAULT 0, CHECK `display_order >= 0`)
  - `is_active` (boolean, NOT NULL, DEFAULT true)
  - `created_at` (timestamptz, NOT NULL, DEFAULT now())
  - `updated_at` (timestamptz, NOT NULL, DEFAULT now())
- **Triggers:** `set_positions_updated_at`
- **Indexes:** `idx_positions_tier`, `idx_positions_is_active`, `idx_positions_display_order`

#### Table 4: `public.committee_members`
- **Columns:**
  - `id` (uuid, Primary Key, DEFAULT `gen_random_uuid()`)
  - `name` (text, NOT NULL)
  - `position` (text, NOT NULL)
  - `tier` (text, NOT NULL, CHECK `tier IN ('CORE', 'TY_LEADERSHIP', 'SY_COORDINATOR', 'FACULTY')`)
  - `domain` (text, NULL)
  - `department` (text, NULL) *[CRITICAL DISCREPANCY DETECTED - See Section 6.3]*
  - `photo_url` (text, NULL)
  - `linkedin_url` (text, NULL)
  - `github_url` (text, NULL)
  - `tenure_year` (text, NOT NULL, DEFAULT '2026–2027')
  - `is_active` (boolean, NOT NULL, DEFAULT true)
  - `display_order` (integer, NOT NULL, DEFAULT 0, CHECK `display_order >= 0`)
  - `created_at` (timestamptz, NOT NULL, DEFAULT now())
  - `updated_at` (timestamptz, NOT NULL, DEFAULT now())
- **Triggers:** `set_committee_members_updated_at`
- **Indexes:** `idx_committee_members_tier`, `idx_committee_members_is_active`, `idx_committee_members_display_order`, `idx_committee_members_domain`
- **Privacy Compliance:** **Zero student registration numbers**.

#### Table 5: `public.archive_records`
- **Columns:**
  - `id` (uuid, Primary Key, DEFAULT `gen_random_uuid()`)
  - `title` (text, NULL)
  - `description` (text, NULL)
  - `image_url` (text, NOT NULL)
  - `year` (integer, CHECK `year IS NULL OR (year >= 1980 AND year <= 2100)`)
  - `event_name` (text, NULL)
  - `display_order` (integer, NOT NULL, DEFAULT 0, CHECK `display_order >= 0`)
  - `is_published` (boolean, NOT NULL, DEFAULT false)
  - `created_at` (timestamptz, NOT NULL, DEFAULT now())
  - `updated_at` (timestamptz, NOT NULL, DEFAULT now())
- **Triggers:** `set_archive_records_updated_at`
- **Indexes:** `idx_archive_records_is_published`, `idx_archive_records_display_order`

#### Table 6: `public.announcements`
- **Columns:**
  - `id` (uuid, Primary Key, DEFAULT `gen_random_uuid()`)
  - `title` (text, NOT NULL)
  - `message` (text, NULL)
  - `link_url` (text, NULL)
  - `is_published` (boolean, NOT NULL, DEFAULT false)
  - `published_at` (timestamptz, NULL)
  - `expires_at` (timestamptz, NULL)
  - `display_order` (integer, NOT NULL, DEFAULT 0, CHECK `display_order >= 0`)
  - `created_at` (timestamptz, NOT NULL, DEFAULT now())
  - `updated_at` (timestamptz, NOT NULL, DEFAULT now())
- **Triggers:** `set_announcements_updated_at`
- **Indexes:** `idx_announcements_is_published`, `idx_announcements_published_at`, `idx_announcements_expires_at`

#### Table 7: `public.site_settings`
- **Columns:**
  - `id` (uuid, Primary Key, DEFAULT `gen_random_uuid()`)
  - `key` (text, UNIQUE, NOT NULL)
  - `value` (jsonb, NOT NULL)
  - `description` (text, NULL)
  - `is_public` (boolean, NOT NULL, DEFAULT true)
  - `updated_at` (timestamptz, NOT NULL, DEFAULT now())
- **Triggers:** `set_site_settings_updated_at`
- **Indexes:** `idx_site_settings_key`, `idx_site_settings_is_public`

### 6.2 Seed Data Inventory ([`supabase/seed.sql`](file:///home/moonwaker777/itsa-frontend/supabase/seed.sql))

1. **Site Settings (4 keys):**
   - `academic_year`: `"2026–2027"`
   - `telemetry_status`: `"SYS: LINUX_KERNEL_STABLE"`
   - `quote_content`: `{"quote": "The best way to predict the future is to invent it.", "author": "Alan Kay"}`
   - `contact_info`: `{"email": "itsa@sggs.ac.in", "institution": "SGGSIE&T, Nanded", "address": "Department of Information Technology, Shri Guru Gobind Singhji Institute of Engineering & Technology, Vishnupuri, Nanded — 431606, Maharashtra, India."}`
2. **Organizational Positions (32 roles):**
   - 4 Core: President, Vice President, Treasurer, Vice Treasurer.
   - 12 TY Leadership: Technical Head/Co-Head, Event Operations Head/Co-Head, Media Head/Co-Head, Anchoring Head/Co-Head, Sports Head/Co-Head, Alumni & Relations Head/Co-Head.
   - 13 SY Coordinators: Main & Joint Coordinator, Technical Main/Joint, Anchoring Main/Joint, Media Main/Joint, Finance Main/Joint, Sports Main/Joint, Alumni & Relations Main.
   - 3 Faculty Dignitaries: ITSA Faculty Coordinator, Head of the Department, Dean Student Activities.
3. **Committee Members (35 individuals):**
   - 5 Core Committee members (Tanishq Raut, Rahul Gulade, Palak Baladwa, Alok Singh, Aryan Kale).
   - 12 TY Leadership members.
   - 15 SY Coordinator members.
   - 3 Faculty Dignitaries (Dr. Ankush Sawarkar, Dr. C. P. Navdeti, Dr. M. V. Vaidya).
4. **Visual Archive (5 authentic records):**
   - Record 01: Computing Laboratory & Technical Sprint (`/archive/WhatsApp%20Image%202026-09-02%20at%203.39.23%20PM.jpeg`)
   - Record 02: Auditorium Seminar & Technical Presentation (`/archive/WhatsApp%20Image%202026-09-02%20at%203.39.22%20PM.jpeg`)
   - Record 03: Certificate & Award Felicitation Ceremony (`/archive/WhatsApp%20Image%202026-09-02%20at%203.39.20%20PM.jpeg`)
   - Record 04: Engineer's Day Faculty Felicitation (`/archive/WhatsApp%20Image%202026-09-02%20at%203.39.22%20PM%20(1).jpeg`)
   - Record 05: Guest & Coordinator Felicitation (`/archive/WhatsApp%20Image%202026-09-02%20at%203.39.21%20PM.jpeg`)
5. **Sample Events (12 baseline events):**
   - 4 Technical: TECHNOVA, CODEFORGE, BUILD LAB, SYSTEMS HACK SPRINT.
   - 4 Sports: INTER-DEPARTMENT FOOTBALL, CRICKET CUP, BADMINTON OPEN, CHESS CHAMPIONSHIP.
   - 4 Cultural: CULTURAL FEST, OPEN MIC, FESTIVE NIGHT, DIGITAL ARTS EXHIBIT.

### 6.3 Critical Schema Discrepancy Found in Existing Migrations
> [!WARNING]
> **Schema Bug in `20260902164800_initial_cms_schema.sql`:**
> The base migration `CREATE TABLE public.committee_members` does NOT define a `department` column. However:
> 1. `src/types/database.ts` line 146 defines `department: string | null`.
> 2. `supabase/seed.sql` lines 130–131 executes:
>    ```sql
>    UPDATE public.committee_members SET department = 'Department of Information Technology' WHERE name IN ('Dr. Ankush Sawarkar', 'Dr. C. P. Navdeti');
>    ```
> If `seed.sql` is executed against the initial migration without `ALTER TABLE committee_members ADD COLUMN department text;`, PostgreSQL throws an error: `column "department" of relation "committee_members" does not exist`.
> **Neon Migration Resolution:** The new Neon DDL must explicitly declare `department text NULL` inside `CREATE TABLE committee_members`.

---

## 7. Priority 6: Secrets, Environment Variables & Package Dependencies

### 7.1 Environment Variables Security Assessment

| Variable Name | Environment | Current Use | Neon Target Strategy | Secret Risk |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Frontend (`.env`) | Supabase REST endpoint | Replace with `VITE_API_BASE_URL` (e.g. `http://localhost:5000/api` or `/api`) | Public (No secret) |
| `VITE_SUPABASE_ANON_KEY` | Frontend (`.env`) | Client PostgREST auth header | **Eliminate entirely**; frontend will not talk directly to any database. | Public (RLS protected) |
| `DATABASE_URL` | **Backend Only** | N/A | Neon PostgreSQL connection string (pooled connection with SSL) | **CRITICAL SECRET** (Must never be prefixed with `VITE_`) |
| `JWT_SECRET` / `SESSION_SECRET` | **Backend Only** | N/A | Cryptographic secret for signing auth tokens / cookies | **CRITICAL SECRET** |
| `STORAGE_*` / `S3_*` | **Backend Only** | N/A | Access credentials for object storage service | **CRITICAL SECRET** |

- **Verification:** Inspection of `.gitignore` confirms `.env` and `.env.*` are excluded from version control. Zero secret keys (`SUPABASE_SERVICE_ROLE_KEY`) are committed or leaked in the repository.

### 7.2 Package Changes Required

#### Packages to Remove from `itsa-frontend`:
- `@supabase/supabase-js` (removes ~2.5 MB of dependencies from client build including postgrest-js, realtime-js, storage-js, auth-js, phoenix).

#### Packages to Retain in `itsa-frontend`:
- `react`, `react-dom` (19.1.0)
- `react-router-dom` (7.18.3)
- `lucide-react` (1.16.0)
- `clsx`, `tailwind-merge`
- `vite`, `tailwindcss`, `typescript`, etc.

#### Packages to Add to New Backend Service:
- `pg` / `@neondatabase/serverless` (PostgreSQL client driver)
- `express` or `fastify` (Web framework)
- `cors`, `helmet`, `cookie-parser` (Security & headers)
- `dotenv` (Environment management)
- `bcryptjs` / `argon2` (Password hashing)
- `jsonwebtoken` / `jose` (JWT handling)
- `zod` (Input validation)
- `multer` + `@aws-sdk/client-s3` (File uploads & storage)

---

## 8. Priority 7: Public Website & Admin Route Backend Dependencies

Below is the comprehensive API contract required by every frontend route and component when connected to the custom Neon backend.

### 8.1 Public Website Routes

#### Route: `/` (`HomePage.tsx`)

| Section / Component | Required Backend API | Method | Payload / Query | Response Model | Public / Protected |
|---|---|---|---|---|---|
| [`Events.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Events.tsx) | `/api/events` | `GET` | `?published=true&category=TECHNICAL` | `Array<EventItem>` | Public |
| [`Team.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Team.tsx) | `/api/team` | `GET` | `?active=true` | `Array<CommitteeMember>` | Public |
| [`Gallery.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Gallery.tsx) | `/api/archive` | `GET` | `?published=true` | `Array<GalleryItem>` | Public |
| [`Quote.tsx`](file:///home/moonwaker777/itsa-frontend/src/components/Quote.tsx) | `/api/settings/public` | `GET` | None | `Record<string, any>` | Public |
| Active Announcements (Banners) | `/api/announcements/active` | `GET` | None | `Array<Announcement>` | Public |

### 8.2 Admin Authentication Routes

#### Route: `/admin/login` (`AdminLogin.tsx`)

| Action | Required Backend API | Method | Request Payload | Response Schema | Status Codes |
|---|---|---|---|---|---|
| Admin Login | `/api/auth/login` | `POST` | `{ email: string, password: string }` | `{ user: AdminProfile, token?: string }` (+ sets HTTP-only cookie) | `200 OK`, `401 Unauthorized` |
| Session Check | `/api/auth/me` | `GET` | Cookie or Bearer Token | `{ user: AdminProfile }` | `200 OK`, `401 Unauthorized` |
| Admin Sign Out | `/api/auth/logout` | `POST` | Cookie or Bearer Token | `{ success: true }` | `200 OK` |

### 8.3 Protected Admin Routes (`/admin/*`)

All routes below require authentication and appropriate RBAC permissions.

#### 1. Route: `/admin/dashboard` (`DashboardPage.tsx`)
- **Required Endpoints:**
  - `GET /api/events?limit=4` (Recent upcoming events)
  - `GET /api/admin/metrics` (Aggregate counts: total events, total active members, total archive photos, total positions)
- **Min Role:** `EDITOR`

#### 2. Route: `/admin/events` (`EventsPage.tsx` & `EventModal.tsx`)
- **Required Endpoints:**
  - `GET /api/admin/events` (All events including drafts and unpublished)
  - `POST /api/admin/events` (Create event record)
  - `PUT /api/admin/events/:id` (Update event record)
  - `PATCH /api/admin/events/:id/publish` (Toggle published status)
  - `PATCH /api/admin/events/:id/feature` (Toggle featured status)
  - `DELETE /api/admin/events/:id` (Delete event)
  - `POST /api/upload/event-cover` (Multipart image upload -> returns URL)
- **Min Role:** `EDITOR`

#### 3. Route: `/admin/people` (`PeoplePage.tsx` & `PersonModal.tsx`)
- **Required Endpoints:**
  - `GET /api/admin/team` (All committee members including inactive)
  - `POST /api/admin/team` (Create committee member)
  - `PUT /api/admin/team/:id` (Update committee member)
  - `PATCH /api/admin/team/:id/active` (Toggle active status)
  - `DELETE /api/admin/team/:id` (Delete member)
  - `GET /api/positions/active` (Populate position dropdowns)
  - `POST /api/upload/team-portrait` (Multipart portrait upload -> returns URL)
- **Min Role:** `ADMIN`

#### 4. Route: `/admin/positions` (`PositionsPage.tsx` & `PositionModal.tsx`)
- **Required Endpoints:**
  - `GET /api/admin/positions` (All positions)
  - `POST /api/admin/positions` (Create position)
  - `PUT /api/admin/positions/:id` (Update position)
  - `PATCH /api/admin/positions/:id/active` (Toggle active status)
  - `DELETE /api/admin/positions/:id` (Delete position with foreign usage check)
- **Min Role:** `ADMIN`

#### 5. Route: `/admin/archive` (`ArchivePage.tsx` & `ArchiveModal.tsx`)
- **Required Endpoints:**
  - `GET /api/admin/archive` (All archive photographs)
  - `POST /api/admin/archive` (Create archive record)
  - `PUT /api/admin/archive/:id` (Update archive record)
  - `PATCH /api/admin/archive/:id/publish` (Toggle published status)
  - `DELETE /api/admin/archive/:id` (Delete archive record)
  - `POST /api/upload/archive-photo` (Multipart photo upload -> returns URL)
- **Min Role:** `ADMIN`

#### 6. Route: `/admin/announcements` (`AnnouncementsPage.tsx` & `AnnouncementModal.tsx`)
- **Required Endpoints:**
  - `GET /api/admin/announcements` (All announcements)
  - `POST /api/admin/announcements` (Create announcement)
  - `PUT /api/admin/announcements/:id` (Update announcement)
  - `PATCH /api/admin/announcements/:id/publish` (Toggle published status)
  - `DELETE /api/admin/announcements/:id` (Delete announcement)
- **Min Role:** `EDITOR`

#### 7. Route: `/admin/users` (`UsersPage.tsx` & `AdminUserModal.tsx`)
- **Required Endpoints:**
  - `GET /api/admin/users` (List all admin profiles)
  - `PUT /api/admin/users/:id` (Update full_name, role, or active status)
  - `PATCH /api/admin/users/:id/active` (Toggle active status)
  - `DELETE /api/admin/users/:id` (Revoke admin profile)
  - `POST /api/admin/users/invite` (Create/invite new administrator)
- **Min Role:** **`SUPER_ADMIN`**

#### 8. Route: `/admin/settings` (`SettingsPage.tsx`)
- **Required Endpoints:**
  - `GET /api/admin/settings` (Fetch all settings keys)
  - `PUT /api/admin/settings` (Batch save settings map)
- **Min Role:** **`SUPER_ADMIN`**

---

## 9. Neon Architectural Target & Migration Roadmap

### 9.1 Target Architecture Blueprint

```
┌──────────────────────────────────────────────────────────────┐
│                  React 19 Frontend (Vite)                    │
│   (Public Website, Admin Dashboard, Modals, Local Fallback)  │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP / JSON / Multipart
                               ▼
┌──────────────────────────────────────────────────────────────┐
│             Node.js / Express Backend Service                │
│  ┌───────────────────────┐       ┌────────────────────────┐  │
│  │   Auth & RBAC Layer   │       │  Storage & Multer Svc  │  │
│  │  (JWT/Cookie, Bcrypt) │       │   (S3 / R2 / Local)    │  │
│  └───────────┬───────────┘       └───────────┬────────────┘  │
│              │                               │               │
│  ┌───────────▼───────────────────────────────▼────────────┐  │
│  │      Parameterized SQL Query Controllers (pg Pool)     │  │
│  └───────────────────────────┬────────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────┘
                               │ SSL Pool Connection
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  Neon Serverless PostgreSQL                  │
│       (Tables, Foreign Keys, Triggers, Indexes, Enums)       │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Recommended Migration Phases

#### Phase 1: Backend Scaffolding & Database Provisioning
1. Provision a Neon project and obtain the pooled connection string (`DATABASE_URL`).
2. Construct the clean PostgreSQL migration script (including the fixed `department` column on `committee_members`).
3. Replace the Supabase `auth.users` dependency by creating an `admin_users` table with password hashes:
   ```sql
   CREATE TABLE IF NOT EXISTS public.admin_users (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     email text UNIQUE NOT NULL,
     password_hash text NOT NULL,
     full_name text,
     role text NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR')),
     is_active boolean NOT NULL DEFAULT true,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now()
   );
   ```
4. Run schema migration and seed initial data on Neon.

#### Phase 2: API & Authentication Service Implementation
1. Scaffold an Express or Fastify TypeScript server (in `/server` or separate repo).
2. Implement auth endpoints (`/login`, `/me`, `/logout`) with password hashing and JWT/session management.
3. Implement RBAC middleware verifying roles for protected routes.
4. Implement CRUD routes corresponding to the endpoints listed in Section 8.
5. Set up media storage handler (S3/Cloudflare R2 or local disk).

#### Phase 3: Frontend Client Adaptation
1. Replace `src/lib/supabase.ts` with a lightweight, typed API client (`src/lib/api.ts`) using `fetch`.
2. Refactor `src/hooks/useAuth.ts` to call `/api/auth/*` instead of `supabase.auth.*`.
3. Refactor each service (`eventsService`, `teamService`, etc.) to call the API client endpoints.
4. Remove `@supabase/supabase-js` from `package.json`.

#### Phase 4: Verification & Security Audit
1. Verify that all public sections (`Events`, `Team`, `Gallery`, `Quote`) display live Neon data with graceful fallback.
2. Verify all Admin Dashboard CRUD operations across `SUPER_ADMIN`, `ADMIN`, and `EDITOR` roles.
3. Test media uploads and ensure correct image dimensions, MIME restrictions, and size limit checks.
4. Confirm zero student registration numbers remain anywhere in the database or UI.
5. Confirm zero secrets are bundled in the frontend client.

---

## 10. Audit Verification Sign-Off

- [x] **Every Supabase usage in the codebase located and documented**
- [x] **Complete Component -> Hook -> Service -> DB dependency chain mapped**
- [x] **Auth, session, and RBAC mechanisms fully analyzed**
- [x] **Media storage buckets, upload lifecycles, and paths identified**
- [x] **Database schema, constraints, triggers, and seed data completely inventoried**
- [x] **Schema bug (`department` column in `committee_members`) documented with resolution**
- [x] **Zero secrets exposed in frontend environment**
- [x] **Every public and admin route mapped to backend API requirements**
- [x] **Zero code modified, zero packages installed, zero migrations run (AUDIT ONLY)**
