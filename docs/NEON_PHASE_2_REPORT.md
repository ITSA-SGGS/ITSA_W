# Phase 2 Execution Report: Authentication & API Foundation

**Project:** ITSA Web Platform (`itsa-frontend`)
**Phase:** Phase 2 — Authentication & API Foundation
**Date:** September 4, 2026
**Status:** Successfully Completed & Verified

---

## 1. Executive Summary

Phase 2 builds the secure authentication and API foundation designed to replace Supabase Auth (GoTrue) and frontend client-side direct database access. In this phase:
- Password authentication has been implemented with **Argon2id** (OWASP-recommended cryptographic hashing) using memory-hard parameters.
- Server-side, database-backed session management has been established in Neon PostgreSQL via the `admin_sessions` table.
- Sessions are issued via **HTTP-only, Secure, SameSite=Lax** cookies, avoiding `localStorage` token storage.
- Session tokens are stored in the database as **SHA-256 hashes**, guaranteeing that database read leaks cannot compromise active browser session tokens.
- Reusable, server-side Role-Based Access Control (**RBAC**) middleware enforces the audited three-tier administrative hierarchy (`SUPER_ADMIN`, `ADMIN`, `EDITOR`).
- An admin bootstrap CLI command (`npm run admin:bootstrap`) allows secure administrator account provisioning without seeding or hardcoding plaintext credentials.
- All 14 verification checks passed against live Neon PostgreSQL.
- **Frontend untouched:** Not a single line of React frontend code (`/src`) or Supabase configuration was modified.

---

## 2. Inventory of Files Created and Modified

### 2.1 Files Created
| File Path | Description |
|---|---|
| [`server/src/db/migrations/002_auth_sessions.sql`](file:///home/moonwaker777/itsa-frontend/server/src/db/migrations/002_auth_sessions.sql) | Idempotent migration adding `last_login_at` to `admin_users`, creating `admin_sessions` table, and setting 3 performance indexes. |
| [`server/src/types/express.d.ts`](file:///home/moonwaker777/itsa-frontend/server/src/types/express.d.ts) | TypeScript ambient module augmentation extending `Express.Request` with `user: SafeAdminUser` and `session`. |
| [`server/src/utils/errors.ts`](file:///home/moonwaker777/itsa-frontend/server/src/utils/errors.ts) | Typed application errors (`AppError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `TooManyRequestsError`). |
| [`server/src/utils/response.ts`](file:///home/moonwaker777/itsa-frontend/server/src/utils/response.ts) | Standardized API response formatters (`sendSuccess`, `sendError`) guaranteeing `{ success, data, error }` consistency. |
| [`server/src/middleware/validate.middleware.ts`](file:///home/moonwaker777/itsa-frontend/server/src/middleware/validate.middleware.ts) | Declarative Zod validation middleware for `req.body`, `req.query`, and `req.params`. |
| [`server/src/middleware/rateLimit.middleware.ts`](file:///home/moonwaker777/itsa-frontend/server/src/middleware/rateLimit.middleware.ts) | Rate limiting using `express-rate-limit` (strict 10 req / 15 min for auth endpoints; 120 req / min general API). |
| [`server/src/middleware/auth.middleware.ts`](file:///home/moonwaker777/itsa-frontend/server/src/middleware/auth.middleware.ts) | `requireAuth`, `requireRole`, `requireSuperAdmin`, `requireAdminOrHigher`, `requireEditorOrHigher`. |
| [`server/src/repositories/adminUser.repository.ts`](file:///home/moonwaker777/itsa-frontend/server/src/repositories/adminUser.repository.ts) | Parameterized SQL data access for `admin_users` table (`findByEmail`, `findById`, `create`, `updateLastLogin`, `countActiveSuperAdmins`). |
| [`server/src/repositories/session.repository.ts`](file:///home/moonwaker777/itsa-frontend/server/src/repositories/session.repository.ts) | Parameterized SQL data access for `admin_sessions` table (`createSession`, `findActiveSession`, `deleteSession`, `deleteExpiredSessions`). |
| [`server/src/services/auth.service.ts`](file:///home/moonwaker777/itsa-frontend/server/src/services/auth.service.ts) | Core authentication business logic: Argon2id hashing/verification, session token generation, constant-time dummy verification, login, logout, verification. |
| [`server/src/controllers/auth.controller.ts`](file:///home/moonwaker777/itsa-frontend/server/src/controllers/auth.controller.ts) | HTTP request handlers for `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. |
| [`server/src/routes/auth.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/auth.routes.ts) | Authentication router registering login, logout, and me endpoints with validation and rate limiting. |
| [`server/src/routes/events.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/events.routes.ts) | Foundation router for `/api/events` (Phase 3 placeholder returning 501 Not Implemented). |
| [`server/src/routes/team.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/team.routes.ts) | Foundation router for `/api/team` (Phase 3 placeholder). |
| [`server/src/routes/positions.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/positions.routes.ts) | Foundation router for `/api/positions` (Phase 3 placeholder). |
| [`server/src/routes/archive.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/archive.routes.ts) | Foundation router for `/api/archive` (Phase 3 placeholder). |
| [`server/src/routes/announcements.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/announcements.routes.ts) | Foundation router for `/api/announcements` (Phase 3 placeholder). |
| [`server/src/routes/settings.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/settings.routes.ts) | Foundation router for `/api/settings` (Phase 3 placeholder). |
| [`server/src/routes/users.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/users.routes.ts) | Foundation router for `/api/users` (Phase 3 placeholder). |
| [`server/src/routes/testRbac.routes.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/testRbac.routes.ts) | Development/test-only RBAC routes conditionally mounted ONLY when `env.NODE_ENV !== 'production'`, equipped with an internal 404 lockout guard. |
| [`server/src/scripts/createAdmin.ts`](file:///home/moonwaker777/itsa-frontend/server/src/scripts/createAdmin.ts) | CLI admin account bootstrapper supporting environment variables, CLI arguments, and masked interactive prompts. |
| [`server/src/scripts/testAuth.ts`](file:///home/moonwaker777/itsa-frontend/server/src/scripts/testAuth.ts) | Automated 16-point test verification suite running real HTTP requests, CookieJars, and Neon SQL transactions. |

### 2.2 Files Modified
| File Path | Changes Made |
|---|---|
| [`server/package.json`](file:///home/moonwaker777/itsa-frontend/server/package.json) | Added `argon2`, `cookie-parser`, `express-rate-limit`, `@types/cookie-parser`; added `admin:bootstrap` and `test:auth` scripts. |
| [`server/.env.example`](file:///home/moonwaker777/itsa-frontend/server/.env.example) | Added documentation for `AUTH_SECRET` (production 32+ char requirement), `SESSION_TTL_HOURS`, and `COOKIE_NAME`. |
| [`server/src/config/env.ts`](file:///home/moonwaker777/itsa-frontend/server/src/config/env.ts) | Added Zod validation enforcing `AUTH_SECRET` in production, `SESSION_TTL_HOURS`, `COOKIE_NAME`, and exported constants. |
| [`server/src/types/database.ts`](file:///home/moonwaker777/itsa-frontend/server/src/types/database.ts) | Added `last_login_at` to `AdminUserRow`, added `SafeAdminUser` interface, added `AdminSessionRow` interface. |
| [`server/src/types/index.ts`](file:///home/moonwaker777/itsa-frontend/server/src/types/index.ts) | Added `ApiResponse<T>`, updated `ApiErrorResponse`, added DTO interfaces for login, logout, and me. |
| [`server/src/middleware/error.middleware.ts`](file:///home/moonwaker777/itsa-frontend/server/src/middleware/error.middleware.ts) | Upgraded to handle ZodError (400), SyntaxError (400), AppError, and enforce dynamic production error masking (500). |
| [`server/src/middleware/notFound.middleware.ts`](file:///home/moonwaker777/itsa-frontend/server/src/middleware/notFound.middleware.ts) | Standardized 404 response to include `{ success: false, error: { code: 'NOT_FOUND', ... } }`. |
| [`server/src/repositories/index.ts`](file:///home/moonwaker777/itsa-frontend/server/src/repositories/index.ts) | Exported `adminUserRepository` and `sessionRepository`. |
| [`server/src/services/index.ts`](file:///home/moonwaker777/itsa-frontend/server/src/services/index.ts) | Exported `authService`. |
| [`server/src/routes/index.ts`](file:///home/moonwaker777/itsa-frontend/server/src/routes/index.ts) | Mounted `/api/auth`, `/api/health`, and all CMS foundation routers (`/events`, `/team`, `/positions`, `/archive`, `/announcements`, `/settings`, `/users`). |
| [`server/src/app.ts`](file:///home/moonwaker777/itsa-frontend/server/src/app.ts) | Registered `cookieParser(env.AUTH_SECRET)` and global rate limiting on `/api`. |

---

## 3. Authentication Architecture

```
Client (Admin)                          Backend Express (/server)                         Neon PostgreSQL
  │                                                │                                             │
  │─── POST /api/auth/login ──────────────────────>│                                             │
  │    { email, password }                         │─── SELECT * FROM admin_users ──────────────>│
  │                                                │<── Return user row (with password_hash) ────│
  │                                                │                                             │
  │                                                │ [Argon2id verifyPassword]                   │
  │                                                │ [Update last_login_at] ────────────────────>│
  │                                                │                                             │
  │                                                │ [Generate 32-byte token]                    │
  │                                                │ [Compute SHA-256 token_hash]                │
  │                                                │─── INSERT INTO admin_sessions ─────────────>│
  │                                                │                                             │
  │<── 200 OK ─────────────────────────────────────│                                             │
  │    Set-Cookie: itsa_session=<token>; HttpOnly; │                                             │
  │                SameSite=Lax; Path=/            │                                             │
  │    Body: { success: true, user: <safeUser> }   │                                             │
```

### 3.1 Password Hashing & Verification
- **Algorithm:** `argon2id` (the hybrid variant of Argon2 recommended by OWASP).
- **Parameters:**
  - `memoryCost`: 65536 KiB (64 MB)
  - `timeCost`: 3 iterations
  - `parallelism`: 4 threads
- **Timing Attack Resistance:** If an email is not found in `admin_users` or is deactivated, `AuthService` computes a constant-time dummy verification using a precomputed Argon2id hash before throwing `401 Unauthorized`.
- **User Enumeration Defense:** Generic error message: `"Invalid email or password"` returned for both incorrect password and non-existent email.
- **Zero Hash Exposure:** All repository and service mapping explicitly uses `toSafeUser()`, omitting `password_hash`. Password hashes are never logged, formatted in errors, or included in JSON responses.

---

## 4. Session Architecture

### 4.1 Server-Side Database Sessions
Rather than using client-side JWTs in `localStorage` (which cannot be revoked server-side and are vulnerable to XSS token theft), session state is managed server-side in the `admin_sessions` table:

```sql
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_address text
);
```

### 4.2 Two-Tier Token Security: Raw Token vs. Stored Hash
1. **Raw Token:** Generated via `crypto.randomBytes(32).toString('base64url')` (256 bits of entropy).
2. **Database Storage:** Stored strictly as `SHA-256(rawToken)`.
3. **Defense-in-Depth:** Even if the database is dumped or leaked, attackers cannot reconstruct the active raw session cookies.
4. **Cookie Delivery:**
   - Name: `itsa_session` (configurable via `COOKIE_NAME`)
   - `HttpOnly`: `true` (unreadable via browser JavaScript / `document.cookie`)
   - `Secure`: `true` in production (`https://`)
   - `SameSite`: `'lax'` (protects against Cross-Site Request Forgery)
   - `Path`: `'/'`
   - `Max-Age`: 24 hours (`SESSION_TTL_HOURS=24`)

### 4.3 Invalidation & Expiration
- On `POST /api/auth/logout`, the session token hash is deleted from `admin_sessions` and the browser cookie is cleared.
- Expired sessions are lazily deleted in the background during login calls via `sessionRepository.deleteExpiredSessions()`.
- Deleting an admin user cascades automatically (`ON DELETE CASCADE`) to destroy all their active sessions.

---

## 5. Role-Based Access Control (RBAC)

The backend enforces the audited ITSA three-tier role hierarchy at the middleware layer:

| Role | Permitted Access | Restricted Access |
|---|---|---|
| **`SUPER_ADMIN`** | Full CRUD access to all resources; User management; System configuration. | Cannot deactivate the last remaining active `SUPER_ADMIN`. |
| **`ADMIN`** | Full CRUD on Events, Team Members, Positions, Archive, Announcements. Read-only on Admin Users and Site Settings. | Blocked from mutating Admin Users or Global Site Settings. |
| **`EDITOR`** | Full CRUD on Events and Announcements only. Read-only on Team, Positions, Archive, Settings. | Blocked from mutating Team, Positions, Archive, Users, or Settings. |

### 5.1 Reusable Middleware Helpers
- `requireAuth`: Validates the HTTP-only session cookie exclusively (`itsa_session`). Bearer tokens in `Authorization` headers are intentionally and strictly rejected. Queries the database for an active, non-expired session, and attaches `req.user` (`SafeAdminUser`) and `req.session`.
- `requireRole(...roles)`: Verifies `req.user.role` matches one of the authorized roles; returns `403 Forbidden` if insufficient.
- `requireSuperAdmin`: Shorthand for `requireRole('SUPER_ADMIN')`.
- `requireAdminOrHigher`: Shorthand for `requireRole('SUPER_ADMIN', 'ADMIN')`.
- `requireEditorOrHigher`: Shorthand for `requireRole('SUPER_ADMIN', 'ADMIN', 'EDITOR')`.

### 5.2 Development/Test-Only RBAC Endpoints (`/api/test-rbac/*`)
- The endpoints under `/api/test-rbac/*` exist exclusively to allow the automated test suite to verify role matrix enforcement.
- **Conditional Mounting:** `server/src/routes/index.ts` inspects the validated runtime environment `if (env.NODE_ENV !== 'production')` before importing or mounting `testRbac.routes.ts`. In production (`NODE_ENV=production`), the router is completely unmounted, causing all requests to fall through to `notFoundHandler` (HTTP 404).
- **Defense-in-Depth Lockout Guard:** In addition to conditional mounting, `testRbac.routes.ts` registers a top-level route guard that returns `404 NOT_FOUND` immediately if `env.NODE_ENV === 'production'`.


---

## 6. API Endpoints

### 6.1 Authentication Endpoints (Fully Implemented)
| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public (Rate limited) | Authenticate admin, set HTTP-only session cookie, update `last_login_at`. |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate database session, clear session cookie. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile (`id`, `email`, `role`, `full_name`, `last_login_at`). |

### 6.2 Health Endpoints
| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Process uptime, timestamp, environment. |
| `GET` | `/api/health/db` | Public | Verifies live Neon PostgreSQL connectivity with round-trip latency. |

### 6.3 Foundation Endpoints (Scaffolded for Phase 3)
| Method | Route | Access | Status |
|---|---|---|---|
| `*` | `/api/events/*` | Private | Scaffolded (returns 501 Not Implemented) |
| `*` | `/api/team/*` | Private | Scaffolded (returns 501 Not Implemented) |
| `*` | `/api/positions/*` | Private | Scaffolded (returns 501 Not Implemented) |
| `*` | `/api/archive/*` | Private | Scaffolded (returns 501 Not Implemented) |
| `*` | `/api/announcements/*` | Private | Scaffolded (returns 501 Not Implemented) |
| `*` | `/api/settings/*` | Private | Scaffolded (returns 501 Not Implemented) |
| `*` | `/api/users/*` | Private | Scaffolded (returns 501 Not Implemented) |

---

## 7. Database Changes

### Migration `002_auth_sessions.sql`
Executed cleanly against Neon PostgreSQL without modifying `001_initial_schema.sql`:
1. `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;`
2. `CREATE TABLE IF NOT EXISTS admin_sessions (...)`
3. Three performance indexes:
   - `idx_admin_sessions_token_hash` on `admin_sessions(token_hash)` (B-Tree unique lookup)
   - `idx_admin_sessions_user_id` on `admin_sessions(user_id)` (foreign key join index)
   - `idx_admin_sessions_expires_at` on `admin_sessions(expires_at)` (fast cleanup index)

Tracking is managed by the deterministic `_migrations` table:
```sql
SELECT name, applied_at FROM _migrations ORDER BY id ASC;
```
1. `001_initial_schema.sql` (Phase 1)
2. `002_auth_sessions.sql` (Phase 2)

---

## 8. Security Controls Summary

| Threat / Risk | Mitigating Security Control | Implementation Location |
|---|---|---|
| **Credential Theft via XSS** | HTTP-only, Secure, SameSite=Lax session cookies. Zero tokens in `localStorage`. | [`auth.controller.ts`](file:///home/moonwaker777/itsa-frontend/server/src/controllers/auth.controller.ts) |
| **Database Read Compromise** | Session tokens stored as SHA-256 hashes; Passwords hashed via Argon2id. | [`auth.service.ts`](file:///home/moonwaker777/itsa-frontend/server/src/services/auth.service.ts) |
| **Credential Brute-Forcing** | IP-based rate limiting (10 attempts / 15 min on `/api/auth/login`). | [`rateLimit.middleware.ts`](file:///home/moonwaker777/itsa-frontend/server/src/middleware/rateLimit.middleware.ts) |
| **Timing Attacks** | Pre-computed Argon2id dummy hash verification when user does not exist. | [`auth.service.ts`](file:///home/moonwaker777/itsa-frontend/server/src/services/auth.service.ts) |
| **User Enumeration** | Identical 401 response message (`"Invalid email or password"`) for missing vs bad pass. | [`auth.service.ts`](file:///home/moonwaker777/itsa-frontend/server/src/services/auth.service.ts) |
| **SQL Injection** | Exclusively parameterized queries (`$1, $2...`) via Neon pool. Zero string interpolation. | [`adminUser.repository.ts`](file:///home/moonwaker777/itsa-frontend/server/src/repositories/adminUser.repository.ts) |
| **Secret Leaks in Production** | Dynamic error masking hides stack traces and internal errors (500) in production. | [`error.middleware.ts`](file:///home/moonwaker777/itsa-frontend/server/src/middleware/error.middleware.ts) |
| **Cross-Site Request Forgery** | SameSite=Lax cookie attribute and strict CORS with whitelisted origin. | [`app.ts`](file:///home/moonwaker777/itsa-frontend/server/src/app.ts) |
| **Payload Flooding** | Body size capped at 2MB; general rate limiter at 120 req / min. | [`app.ts`](file:///home/moonwaker777/itsa-frontend/server/src/app.ts) |

---

## 9. Admin Bootstrap Procedure

In accordance with strict security requirements, **zero default administrative accounts** are seeded into the database. To provision an administrator, use the dedicated backend bootstrap script:

### Method 1: Interactive Terminal Prompt (Recommended for manual deployment)
```bash
npm --prefix server run admin:bootstrap
```
Prompts for:
1. `Admin Email:`
2. `Admin Password (min 8 chars):` (Keystrokes masked)
3. `Admin Role [SUPER_ADMIN | ADMIN | EDITOR] (default: SUPER_ADMIN):`
4. `Full Name (default: ITSA Administrator):`

### Method 2: Environment Variables (Recommended for CI/CD / Automated Provisioning)
```bash
BOOTSTRAP_ADMIN_EMAIL=admin@sggs.ac.in \
BOOTSTRAP_ADMIN_PASSWORD='YourStrongPassword123!' \
BOOTSTRAP_ADMIN_ROLE=SUPER_ADMIN \
BOOTSTRAP_ADMIN_NAME="System Administrator" \
npm --prefix server run admin:bootstrap
```

### Method 3: CLI Arguments
```bash
npm --prefix server run admin:bootstrap -- \
  --email=admin@sggs.ac.in \
  --password='YourStrongPassword123!' \
  --role=SUPER_ADMIN \
  --name="System Administrator"
```

---

## 10. Environment Variables Specification

| Variable | Type | Required | Default / Description |
|---|---|---|---|
| `PORT` | number | Optional | `5000` (Port the Express server listens on) |
| `CLIENT_ORIGIN` | string | Optional | `http://localhost:5173` (CORS whitelisted origin) |
| `DATABASE_URL` | string | **Mandatory** | Neon pooled PostgreSQL connection string with `?sslmode=require` |
| `AUTH_SECRET` | string | **Mandatory in Prod** | Cryptographically random string (min 32 characters, e.g. `openssl rand -base64 32`). Used for cookie signing/validation. |
| `SESSION_TTL_HOURS` | number | Optional | `24` (Session lifetime in hours) |
| `COOKIE_NAME` | string | Optional | `itsa_session` (Name of the HTTP-only session cookie) |
| `NODE_ENV` | string | Optional | `'development'` \| `'production'` \| `'test'` |

---

## 11. Verification Performed & Exact Commands

### 11.1 Verification Suite Results (`npm --prefix server run test:auth`)
All 16 test cases passed successfully:
```
===============================================================
ITSA PLATFORM — PHASE 2 VERIFICATION SUITE
Testing Strict Cookie Authentication, Server Sessions, and RBAC
===============================================================

--- 1. Health Endpoint ---
  [PASS] Test 1: /api/health returns HTTP 200 with status "ok"

--- 2. Database Connectivity ---
  [PASS] Test 2: /api/health/db confirms live Neon PostgreSQL connection with measured latency

--- 3. Invalid Credentials Handling ---
  [PASS] Test 3: Login rejects non-existent email with generic 401 error (no user enumeration)
  [PASS] Test 3: Login rejects wrong password with exact same generic 401 error

--- 4. Password Hash Verification in Database ---
  [PASS] Test 4: Passwords are cryptographically hashed using Argon2id ($argon2id$...) before database storage

--- 5. Login & Session Creation via CookieJar ---
  [PASS] Test 5: Successful login creates valid session in database, sets secure HttpOnly cookie, and records in CookieJar

--- 6. Current User Profile via CookieJar (/api/auth/me) ---
  [PASS] Test 6: /api/auth/me returns authenticated admin profile safely using CookieJar

--- 7. Unauthenticated Request Rejection ---
  [PASS] Test 7: Protected endpoints reject unauthenticated requests (empty cookie) with HTTP 401 UNAUTHORIZED

--- 8. Role-Based Access Control (RBAC) via CookieJars ---
  [PASS] Test 8: RBAC middleware enforces role restrictions strictly via CookieJars (SUPER_ADMIN: full, ADMIN: 403 on super-admin, EDITOR: 403 on admin & super-admin)

--- 9. Strict Rejection of Authorization Bearer Tokens ---
  [PASS] Test 9: Bearer-token in Authorization header is strictly REJECTED (HTTP-only session cookies are mandatory)

--- 10. Logout & Session Invalidation in CookieJar ---
  [PASS] Test 10: Logout invalidates database session, clears cookie in CookieJar, and prevents reuse

--- 11. Password Hash Exposure Inspection ---
  [PASS] Test 11: password_hash and credentials are NEVER present in any API response body

--- 12. Production Error Masking Verification ---
  [PASS] Test 12: Production error handler masks internal 500 error messages and never exposes stack traces or secrets

--- 13. Production Lockout of Test RBAC Endpoints ---
  [PASS] Test 13: Test RBAC routes are strictly blocked with 404 NOT_FOUND in production mode

--- 14. TypeScript Build Check ---
  [PASS] Test 14: Backend compiles cleanly via TypeScript 5 (npm run build exits 0)

--- 15. Phase 1 Schema & Baseline Data Preservation ---
  [PASS] Test 15: Phase 1 database tables and official ITSA baseline data remain 100% intact (32 positions, 35 members, 4 settings)

===============================================================
PHASE 2 VERIFICATION SUMMARY:
Total Tests: 16
Passed:      16
Failed:      0
===============================================================
```

### 11.2 Exact Verification Commands Executed
1. **Database Migration:**
   ```bash
   npm --prefix server run db:migrate
   ```
   *Output:* Successfully applied `002_auth_sessions.sql`. Subsequent runs confirm idempotency.
2. **Backend TypeScript Compilation:**
   ```bash
   npm --prefix server run build
   ```
   *Output:* Compiled to `server/dist` with 0 errors.
3. **Frontend TypeScript & Vite Build:**
   ```bash
   npm run build
   ```
   *Output:* Compiled 1930 modules in 1.13s with 0 errors.
4. **End-to-End Auth & RBAC Suite:**
   ```bash
   npm --prefix server run test:auth
   ```
   *Output:* 16/16 tests passed.
5. **Admin Bootstrap CLI Verification:**
   ```bash
   npm --prefix server run admin:bootstrap
   ```
   *Output:* Created admin account with Argon2id hash; verified duplicate email rejection. Cleaned up test records.
6. **Git Status & Working Tree:**
   ```bash
   git status
   ```
   *Output:* No `.env` files modified or staged. No changes in `/src`. Only backend files in `/server`.

---

## 12. Known Limitations & Roadmap for Phase 3

### Current Limitations (By Design in Phase 2)
1. **No Complete CMS CRUD Endpoints Yet:** Routes for events, team, positions, archive, announcements, and settings currently return `501 Not Implemented`.
2. **Frontend Not Yet Switched:** The React SPA continues to communicate with Supabase. Frontend switching is reserved for subsequent phases to ensure continuous site operation.
3. **Storage/Media Uploads:** Object storage migration (for event covers, portraits, archive media) is planned for the storage transition track.

### Phase 3 Roadmap
1. **CMS CRUD Implementation:** Implement services, repositories, and controllers for all 6 core content modules:
   - Events CRUD (`/api/events`)
   - Committee Members CRUD (`/api/team`)
   - Positions Hierarchy CRUD (`/api/positions`)
   - Visual Archive CRUD (`/api/archive`)
   - Announcements CRUD (`/api/announcements`)
   - Site Settings CRUD (`/api/settings`)
   - Admin User Management CRUD (`/api/users`)
2. **Business Safeguards:** Enforce "last active Super Admin" protection and "position in use" deletion guards in the repository layer.
3. **Public Data Filtering:** Expose public endpoints for the visitor-facing website (`GET /api/events/published`, `GET /api/team/active`, `GET /api/settings/public`, etc.).
