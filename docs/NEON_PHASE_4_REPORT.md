# ITSA Website Migration: Phase 4 Verification & Implementation Report
## Storage & Media Migration (Cloudflare R2 Object Storage Abstraction)

**Migration Phase:** Phase 4 — Storage & Media Migration  
**Execution Date:** September 5, 2026  
**Target Environment:** Node.js + TypeScript + Express Backend (`/server`) with Cloudflare R2 / S3-Compatible Storage Abstraction  
**Git Branch:** `feature/neon-storage`  
**Phase Status:** ✅ **COMPLETE & FULLY HARDENED (44/44 Storage Tests Passed, 53/53 CMS Tests Passed, 16/16 Auth Tests Passed, Zero Frontend Regressions)**

---

## 1. Executive Summary & Objective

In Phase 4, we replaced the application's direct architectural dependency on Supabase Storage (`supabase.storage.*`) with an enterprise, vendor-agnostic **Object Storage Abstraction Layer** built inside the ITSA backend service (`/server`).

### Core Accomplishments
1. **Decoupled Backend Abstraction:** Built an extensible storage abstraction under `server/src/storage/` following the multi-tier pattern:
   ```
   Controller (media.controller.ts)
       ↓
   Service (storage.service.ts)
       ↓
   Storage Abstraction (IStorageProvider)
       ↓
   Object Storage Provider (Cloudflare R2 / AWS S3 / Local Disk / Memory)
   ```
2. **Cloudflare R2 Production Provider:** Engineered an S3-compatible provider using `@aws-sdk/client-s3` optimized for Cloudflare R2 zero-egress cloud storage.
3. **Partition & Prefix Preservation:** Mapped the 3 legacy Supabase buckets into logically isolated, server-controlled object prefixes:
   - `team-photos` ➔ `team/portraits/`
   - `event-media` ➔ `events/covers/`
   - `archive-media` ➔ `archive/photos/`
4. **"Do Not Trust Client Input" Security Hardening:**
   - **Binary Magic Bytes Inspection:** Real binary headers inspected on every file buffer (`FF D8 FF` for JPEG, `89 50 4E 47 0D 0A 1A 0A` for PNG, `RIFF...WEBP` for WebP, `ftyp...avif` for AVIF).
   - **MIME Spoofing Defense:** Files with mismatched declared MIME types vs. real binary bytes are strictly rejected with HTTP `400 VALIDATION_ERROR`.
   - **Strict Size Limits:** 5 MB ceiling for Team portraits; 10 MB ceiling for Event banners and Archive photos.
   - **Safe Server Keys:** Storage keys are generated strictly on the server (`prefix + timestamp + crypto.randomBytes(8).hex + safeExt`). Path traversal and client filenames are completely neutralized.
   - **Path Traversal Defense:** Disallows and rejects `..`, `\`, null bytes, and `%2e%2e` sequences across all key extraction and deletion routines.
   - **Exact Canonical Namespace Enforcement:** Strictly bounds storage keys to `team/portraits/`, `events/covers/`, and `archive/photos/`.
   - **Separator-Safe Local Storage Boundary:** Enforces `fullPath === uploadDir || fullPath.startsWith(uploadDir + path.sep)` to eliminate sibling directory escapes.
5. **Role-Based Access Control (RBAC):**
   - Public read endpoints for resolution and configuration (`GET /api/media/resolve`, `GET /api/media/config`).
   - Administrative upload and delete routes require authenticated session cookies (`requireAuth`).
   - Upload permissions mirror the audited CMS domain boundaries:
     - **Event Media:** `EDITOR`, `ADMIN`, `SUPER_ADMIN`
     - **Team Portraits:** `ADMIN`, `SUPER_ADMIN` (`EDITOR` receives `403 FORBIDDEN`)
     - **Archive Media:** `ADMIN`, `SUPER_ADMIN` (`EDITOR` receives `403 FORBIDDEN`)
     - **Media Deletion:** `ADMIN`, `SUPER_ADMIN` (`EDITOR` receives `403 FORBIDDEN`)
6. **Zero Frontend Modifications:** The React frontend under `/src` remains 100% untouched and builds cleanly with zero errors. Supabase client packages remain intact for later frontend migration.

---

## 2. Supabase Storage Dependency Audit & Record Mapping

Before making changes, the repository and database schemas were thoroughly audited to identify every Supabase Storage dependency and reference format.

### 2.1 Storage Buckets Identified

| Legacy Bucket | Canonical Category | Object Prefix | Target Content | Size Limit | Allowed MIME Types |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `team-photos` | `team` | `team/portraits/` | Member & faculty portrait photos | **5 MB** | `image/jpeg`, `image/png`, `image/webp`, `image/avif` |
| `event-media` | `event` | `events/covers/` | Event banners & cover images | **10 MB** | `image/jpeg`, `image/png`, `image/webp`, `image/avif` |
| `archive-media` | `archive` | `archive/photos/` | Visual archive historic photos | **10 MB** | `image/jpeg`, `image/png`, `image/webp`, `image/avif` |

### 2.2 Media Reference Patterns in Neon Database Records

Existing records in the Neon PostgreSQL database reference media via three standard formats:
1. **Root-Relative Static Paths:** `/team/tanishq-raut.jpg`, `/archive/WhatsApp%20Image...` (referenced from Vite's `public/` directory).
2. **Absolute External URLs:** `https://images.unsplash.com/...` (third-party CDNs).
3. **Storage Object Keys & URLs:**
   - Legacy Supabase public URLs: `https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>`
   - Relative paths: `portraits/...`, `covers/...`, `archives/...`
   - New Cloudflare R2 CDN URLs: `https://<r2-public-domain>/<category>/<folder>/<timestamp>-<hex>.<ext>`

`StorageService.resolveMediaUrl()` and `StorageService.extractKey()` handle all these formats seamlessly, ensuring backwards compatibility and clean key extraction for automated media cleanup.

---

## 3. Storage Architecture & Directory Layout

The storage abstraction is located under `server/src/storage/`:

```
server/src/storage/
├── types.ts                   # Interfaces: IStorageProvider, StorageFile, StorageUploadResult, Configs
├── validation.ts              # Magic bytes inspector, category limits, key generator, sanitizers
├── storage.service.ts         # High-level business logic, URL normalizer, key extractor, cleanup
├── multer.ts                  # Memory-storage upload middleware with 10MB ceiling & MIME filter
├── index.ts                   # Unified public module export
└── providers/
    ├── factory.ts             # Environment-driven provider factory (R2, S3, Local, Memory)
    ├── r2.provider.ts         # Cloudflare R2 / AWS S3 client using @aws-sdk/client-s3
    ├── local.provider.ts      # Local disk storage for dev/fallback with path safety guards
    └── memory.provider.ts     # High-speed in-memory mock provider for unit and CI testing
```

### 3.1 Provider Interface (`IStorageProvider`)

Every storage provider implements the standardized interface:
```typescript
export interface IStorageProvider {
  readonly name: string;
  upload(key: string, file: StorageFile, options?: UploadOptions): Promise<StorageUploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  head(key: string): Promise<StorageObjectMetadata | null>;
  healthCheck(): Promise<boolean>;
}
```

### 3.2 Provider Selection Strategy
- **Production:** Configured with `STORAGE_PROVIDER=r2`. Mandatory environment variables (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_ACCOUNT_ID`/`S3_ENDPOINT`) are strictly validated at server startup via Zod.
- **Development Fallback:** In development mode, if cloud credentials are unset, the factory gracefully falls back to `LocalStorageProvider` (saving files into `./uploads` and serving statically via Express) with an informative log warning.
- **Testing:** `MemoryStorageProvider` provides isolated, in-memory execution without touching the disk or network.

---

## 4. "Do Not Trust Client Input" Security Specifications

In compliance with strict security requirements:

| Security Vector | Implementation Guard | Result on Violation |
| :--- | :--- | :--- |
| **Magic Bytes Inspection** | Binary header validation checks bytes 0–12 against known signatures: JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`), WebP (`RIFF...WEBP`), AVIF (`ftyp...avif`). | Returns `400 VALIDATION_ERROR` (`Invalid file content: The uploaded file does not match any recognized valid image signature`). |
| **MIME Spoofing** | Declared `file.mimetype` is cross-checked against detected magic bytes. | Returns `400 VALIDATION_ERROR` (`MIME type spoofing detected`). |
| **Dangerous Formats** | SVGs (potential XSS via inline `<script>`), executables (`.exe`, `.sh`), HTML, and PDFs are rejected. | Returns `400 VALIDATION_ERROR` (`Unsupported file extension` or `Unsupported MIME type`). |
| **File Size Limits** | Team photos strictly capped at 5 MB; Event and Archive media capped at 10 MB. | Returns `400 VALIDATION_ERROR` (`File size exceeds the X MB maximum limit`). |
| **Path Traversal Defense** | Client filenames (`originalname`) are sanitized; keys are generated entirely server-side (`prefix + timestamp + crypto.randomBytes(8).hex + ext`). | Prevents directory traversal (`../../`) and null byte (`%00`) injection. |
| **Credential Masking** | `R2_SECRET_ACCESS_KEY` and `S3_SECRET_ACCESS_KEY` patterns are dynamically redacted from all structured logs in `logger.ts`. | Zero secret leakage in logs. |

---

## 5. API Endpoints & RBAC Matrix

### 5.1 Public Endpoints

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/media/resolve` | `url` or `key` | Resolves a stored key, relative path, or legacy Supabase URL to a public URL. |
| `GET` | `/api/media/config` | *None* | Returns category metadata, size limits, allowed extensions, and active provider name. |
| `GET` | `/uploads/*` | Path to local file | Static file serving for local disk uploads (development mode only). |

### 5.2 Administrative Endpoints (`/api/admin/media/...`)

All admin media routes require an authenticated session cookie via `requireAuth`.

| Method | Endpoint | Allowed Roles | Guard & Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/admin/media/upload` | Role-based by category | Multipart upload with form field `file` and `category` (`event`, `team`, or `archive`). |
| `POST` | `/api/admin/media/upload/event` | `EDITOR`, `ADMIN`, `SUPER_ADMIN` | Upload event banner or cover image (Max: 10 MB). |
| `POST` | `/api/admin/media/upload/team` | `ADMIN`, `SUPER_ADMIN` | Upload team member portrait photo (Max: 5 MB; `EDITOR`: `403 FORBIDDEN`). |
| `POST` | `/api/admin/media/upload/archive` | `ADMIN`, `SUPER_ADMIN` | Upload visual archive photo (Max: 10 MB; `EDITOR`: `403 FORBIDDEN`). |
| `DELETE` | `/api/admin/media` | `ADMIN`, `SUPER_ADMIN` | Deletes media object by key or URL (`EDITOR`: `403 FORBIDDEN`). |

---

## 6. Automated Verification Results

### 6.1 Phase 4 Storage Verification Suite (`npm --prefix server run test:storage`)

```
===============================================================
ITSA WEBSITE — PHASE 4: STORAGE & MEDIA VERIFICATION SUITE
===============================================================

--- SECTION 1: STORAGE ABSTRACTION & CONTRACT SPECIFICATIONS ---
  [PASS] Test 1: Category specifications strictly configured (team: 5MB team/portraits/, event: 10MB events/covers/, archive: 10MB archive/photos/)
  [PASS] Test 2: Category normalizer correctly resolves canonical categories and legacy aliases
  [PASS] Test 3: Invalid or untrusted storage category is strictly rejected with ValidationError

--- SECTION 2: BINARY SIGNATURE & MAGIC NUMBER VERIFICATION ---
  [PASS] Test 4: Genuine JPEG magic bytes (FF D8 FF) verified accurately
  [PASS] Test 5: Genuine PNG magic bytes (89 50 4E 47 0D 0A 1A 0A) verified accurately
  [PASS] Test 6: Genuine WebP RIFF/WEBP signature verified accurately
  [PASS] Test 7: Genuine AVIF ftyp/avif signature verified accurately
  [PASS] Test 8: Non-image binaries (executables, HTML, plain text, truncated) rejected by binary inspection
  [PASS] Test 9: MIME spoofing strictly blocked: Client claiming image/jpeg with PNG bytes rejected
  [PASS] Test 10: Disallowed image formats (SVG, GIF) and extensions strictly rejected

--- SECTION 3: FILE SIZE LIMITS & VALIDATION SAFEGUARDS ---
  [PASS] Test 11: Team photos 5 MB maximum limit strictly enforced
  [PASS] Test 12: Event media 10 MB maximum limit strictly enforced
  [PASS] Test 13: Archive media 10 MB maximum limit strictly enforced
  [PASS] Test 14: Server-controlled key generation enforces partitions and eliminates path traversal

--- SECTION 4: STORAGE PROVIDERS & FACTORY ---
  [PASS] Test 15: MemoryStorageProvider implements full lifecycle (upload, head, publicUrl, delete)
  [PASS] Test 16: LocalStorageProvider implements full filesystem lifecycle with safe path resolution
  [PASS] Test 17: R2StorageProvider correctly constructs S3 endpoints and public CDN URLs
  [PASS] Test 18: Storage provider factory safely instantiates configured providers

--- SECTION 5: STORAGE SERVICE LAYER (RESOLVE, EXTRACT, DELETE) ---
  [PASS] Test 19: StorageService successfully uploads and categorizes media into team/, events/, and archive/ partitions
  [PASS] Test 20: StorageService resolveMediaUrl accurately maps external URLs, root-relative paths, legacy paths, and object keys
  [PASS] Test 21: StorageService extractKey correctly parses R2, local, and legacy Supabase URLs while ignoring external media
  [PASS] Test 22: StorageService deleteMedia safely deletes managed objects and skips unmanaged external URLs

--- SECTION 6: HTTP ENDPOINTS & RBAC ACCESS CONTROL ---
  [PASS] Test 23: Unauthenticated upload rejected with HTTP 401 UNAUTHORIZED
  [PASS] Test 24: Unauthenticated delete request rejected with HTTP 401 UNAUTHORIZED
  [PASS] Test 25: EDITOR: Authorized to upload Event media (POST /api/admin/media/upload category=event -> 201)
  [PASS] Test 26: EDITOR: Blocked from mutating Team photos (POST /api/admin/media/upload category=team -> 403 FORBIDDEN)
  [PASS] Test 27: EDITOR: Blocked from mutating Archive media (POST /api/admin/media/upload category=archive -> 403 FORBIDDEN)
  [PASS] Test 28: ADMIN: Authorized to upload Team portraits (POST /api/admin/media/upload/team -> 201 CREATED)
  [PASS] Test 29: ADMIN: Authorized to upload Archive media (POST /api/admin/media/upload/archive -> 201 CREATED)
  [PASS] Test 30: ADMIN: Authorized to upload Event media (POST /api/admin/media/upload/event -> 201 CREATED)
  [PASS] Test 31: SUPER_ADMIN: Full upload access across all categories (201 CREATED)
  [PASS] Test 32: Missing file upload payload rejected with HTTP 400 BAD_REQUEST
  [PASS] Test 33: Invalid category parameter rejected with HTTP 400 VALIDATION_ERROR
  [PASS] Test 34: HTTP upload: Spoofed/fake image (HTML script in .jpg) strictly rejected with HTTP 400
  [PASS] Test 35: HTTP upload: 6 MB team portrait rejected with HTTP 400 (exceeds 5 MB limit)
  [PASS] Test 36: ADMIN / SUPER_ADMIN can delete media object (DELETE /api/admin/media -> 200 OK)
  [PASS] Test 37: HTTP delete: Path traversal attempt ("..") strictly rejected with HTTP 400 BAD_REQUEST
  [PASS] Test 38: HTTP delete: Non-canonical storage namespace strictly rejected with HTTP 400 BAD_REQUEST
  [PASS] Test 39: LocalStorageProvider resolveSafePath strictly confines paths within separator-safe uploadDir
  [PASS] Test 40: Public GET /api/media/config returns categories, size limits, and active provider metadata
  [PASS] Test 41: Public GET /api/media/resolve resolves media references into valid URLs

--- SECTION 7: REGRESSION & SYSTEM INTEGRITY ---
  [PASS] Test 42: Backend build succeeds (tsc exits with 0)
  [PASS] Test 43: Frontend build succeeds cleanly (npm run build exits 0)
  [PASS] Test 44: Confirmed zero frontend source files under /src were modified (Phase 4 boundary strictly preserved)

===============================================================
PHASE 4 STORAGE & MEDIA VERIFICATION SUMMARY:
Total Tests: 44
Passed:      44
Failed:      0
===============================================================
```

### 6.2 Regression Test Status Across All Previous Phases

| Test Suite | Command | Total Tests | Passed | Regressions | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Phase 2 Auth Suite** | `npm --prefix server run test:auth` | 16 | 16 | 0 | ✅ 100% Passed |
| **Phase 3 CMS Suite** | `npm --prefix server run test:cms` | 53 | 53 | 0 | ✅ 100% Passed |
| **Phase 4 Storage Suite** | `npm --prefix server run test:storage` | 44 | 44 | 0 | ✅ 100% Passed |
| **Backend TypeScript Build** | `npm --prefix server run build` | — | — | 0 | ✅ Exited with 0 |
| **Frontend Vite Build** | `npm run build` | — | — | 0 | ✅ Exited with 0 |
| **Frontend Source Integrity** | `git status --porcelain src/` | — | — | 0 | ✅ 0 files modified |

---

## 7. Configuration Reference (`server/.env.example`)

The following variables document the storage configuration in `server/.env.example`:

```ini
# =============================================================================
# 7. Object Storage Configuration (Phase 4 — Cloudflare R2 / S3-Compatible / Local)
# =============================================================================
# Provider selection: 'r2' | 's3' | 'local' | 'memory'
STORAGE_PROVIDER=r2

# --- Cloudflare R2 Configuration (Production Recommended) ---
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=itsa-media
R2_PUBLIC_URL=https://media.itsa.sggs.ac.in

# --- Generic S3 Fallback Configuration ---
S3_ENDPOINT=
S3_REGION=auto
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_PUBLIC_URL=

# --- Local Storage Configuration ---
UPLOAD_DIR=uploads
```

---

## 8. Summary of Completed Deliverables

1. `server/src/storage/types.ts`: Strongly typed interfaces for files, options, upload results, and providers.
2. `server/src/storage/validation.ts`: Magic bytes inspection, MIME type spoofing defense, size enforcement, and safe key generation.
3. `server/src/storage/providers/r2.provider.ts`: Cloudflare R2 / S3 provider using `@aws-sdk/client-s3`.
4. `server/src/storage/providers/local.provider.ts`: Local filesystem provider with path traversal defenses.
5. `server/src/storage/providers/memory.provider.ts`: In-memory mock provider for fast automated tests.
6. `server/src/storage/providers/factory.ts`: Dynamic provider factory with development fallback.
7. `server/src/storage/storage.service.ts`: Storage business logic abstraction with URL normalization and key extraction.
8. `server/src/storage/multer.ts`: Memory-buffered upload middleware with file filtering.
9. `server/src/controllers/media.controller.ts`: Media upload, deletion, resolution, and configuration endpoints with RBAC.
10. `server/src/routes/media.routes.ts`: Public and authenticated media routes.
11. `server/src/scripts/testStorage.ts`: Comprehensive 41-point verification suite.
12. `server/.env.example`: Complete documentation template for Cloudflare R2 and S3 storage variables.
13. `docs/NEON_PHASE_4_REPORT.md`: Comprehensive Phase 4 verification report.
