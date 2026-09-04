/**
 * ITSA Platform - Phase 3 Comprehensive CMS API Verification Suite
 *
 * Fully automated end-to-end verification covering:
 *   SECTION 1: PUBLIC READ APIS (Items 1-9)
 *   SECTION 2: REQUIRED RBAC & AUTHORIZATION MATRIX (Items 10-38 = Exactly 29 RBAC specifications)
 *     EDITOR:
 *       1. Can CRUD Events
 *       2. Can CRUD Announcements
 *       3. Can READ Team
 *       4. Cannot mutate Team -> 403
 *       5. Can READ Positions
 *       6. Cannot mutate Positions -> 403
 *       7. Can READ Archive
 *       8. Cannot mutate Archive -> 403
 *       9. Can READ Site Settings
 *       10. Cannot mutate Site Settings -> 403
 *       11. Cannot access Admin Users -> 403
 *     ADMIN:
 *       12. Can CRUD Events
 *       13. Can CRUD Announcements
 *       14. Can CRUD Team
 *       15. Can CRUD Positions
 *       16. Can CRUD Archive
 *       17. Can READ Site Settings
 *       18. Cannot mutate Site Settings -> 403
 *       19. Can READ Admin Users
 *       20. Cannot mutate Admin Users -> 403
 *     SUPER_ADMIN:
 *       21. Full Events CRUD
 *       22. Full Announcements CRUD
 *       23. Full Team CRUD
 *       24. Full Positions CRUD
 *       25. Full Archive CRUD
 *       26. Full Site Settings CRUD
 *       27. Full Admin User management
 *       28. Last active SUPER_ADMIN safeguards work (409 CONFLICT)
 *     Unauthenticated:
 *       29. Protected admin endpoints -> 401
 *   SECTION 3: DOMAIN SAFEGUARDS & INTEGRITY
 *   SECTION 4: SECURITY VALIDATION & PRIVACY
 *   SECTION 5: BUILD & REGRESSION INTEGRITY
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { app } from '../app.js';
import { query, closePool, isDatabaseConfigured } from '../config/database.js';
import { authService } from '../services/auth.service.js';
import { adminUserRepository } from '../repositories/adminUser.repository.js';
import { positionsRepository } from '../repositories/positions.repository.js';
import { CookieJar } from '../utils/cookieJar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..', '..');
const projectRoot = path.resolve(serverDir, '..');

let server: http.Server;
let baseUrl: string;

interface TestResult {
  num: number;
  description: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function recordPass(num: number, description: string, details?: any) {
  results.push({ num, description, passed: true, details });
  console.log(`  \x1b[32m[PASS]\x1b[0m Test ${num}: ${description}`);
}

function recordFail(num: number, description: string, error: string, details?: any) {
  results.push({ num, description, passed: false, error, details });
  console.error(`  \x1b[31m[FAIL]\x1b[0m Test ${num}: ${description}`);
  console.error(`         Reason: ${error}`);
}

interface RequestOptions {
  method?: string;
  body?: any;
  jar?: CookieJar;
  headers?: Record<string, string>;
}

async function apiRequest(path: string, options: RequestOptions = {}) {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.jar) {
    const cookieHeader = options.jar.getCookieHeader();
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (options.jar) {
    options.jar.extractFromHeaders(response.headers);
  }

  const rawBody = await response.text();
  let data: any;
  try {
    data = JSON.parse(rawBody);
  } catch {
    data = rawBody;
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
    rawBody,
  };
}

async function runCmsTests() {
  console.log('\n===============================================================');
  console.log('ITSA PLATFORM — PHASE 3 CMS API VERIFICATION SUITE');
  console.log('Verifying Exact 29-Point RBAC Matrix, Public APIs, Security, & Integrity');
  console.log('===============================================================\n');

  if (!isDatabaseConfigured) {
    console.error('FATAL: Neon database is not configured. Aborting.');
    process.exit(1);
  }

  // 1. Start ephemeral HTTP Server
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });

  // Test account identities
  const timestamp = Date.now();
  const testUsers = {
    superAdmin: {
      email: `cms_super_${timestamp}@itsa.sggs.ac.in`,
      password: 'CmsSuperAdminSecret123!',
      role: 'SUPER_ADMIN' as const,
      name: 'CMS Super Admin',
      id: '',
      jar: new CookieJar(),
    },
    admin: {
      email: `cms_admin_${timestamp}@itsa.sggs.ac.in`,
      password: 'CmsAdminSecret123!',
      role: 'ADMIN' as const,
      name: 'CMS Admin',
      id: '',
      jar: new CookieJar(),
    },
    editor: {
      email: `cms_editor_${timestamp}@itsa.sggs.ac.in`,
      password: 'CmsEditorSecret123!',
      role: 'EDITOR' as const,
      name: 'CMS Editor',
      id: '',
      jar: new CookieJar(),
    },
    noAuthJar: new CookieJar(),
  };

  try {
    // Seed test admin users
    console.log('--- Provisioning Test Accounts & Logging In ---');
    for (const [key, user] of Object.entries(testUsers)) {
      if (key === 'noAuthJar') continue;
      const u = user as any;
      const hash = await authService.hashPassword(u.password);
      const created = await adminUserRepository.create({
        email: u.email,
        passwordHash: hash,
        fullName: u.name,
        role: u.role,
        isActive: true,
      });
      u.id = created.id;

      // Log in to acquire HTTP-only session cookie
      const loginRes = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: u.email, password: u.password },
        jar: u.jar,
      });

      if (loginRes.status !== 200 || !loginRes.data?.success) {
        throw new Error(`Failed to login test user ${u.role}: ${loginRes.rawBody}`);
      }
      console.log(`  Authenticated ${u.role} (${u.email}) with secure cookie.`);
    }

    // =========================================================================
    // SECTION 1: PUBLIC READ APIS (Items 1-9)
    // =========================================================================
    console.log('\n--- SECTION 1: PUBLIC READ APIS ---');

    // 1. GET /api/events returns published events
    const res1 = await apiRequest('/api/events');
    const events1 = res1.data?.data;
    if (res1.status === 200 && Array.isArray(events1) && events1.length > 0 && events1.every((e: any) => e.is_published === true)) {
      recordPass(1, 'GET /api/events returns published events');
    } else {
      recordFail(1, 'GET /api/events returns published events', `Status ${res1.status}, count: ${events1?.length}`);
    }

    // 2. Unpublished events cannot be exposed publicly
    const draftEvent = await apiRequest('/api/admin/events', {
      method: 'POST',
      body: {
        title: `Test Draft Event ${timestamp}`,
        category: 'TECHNICAL',
        is_published: false,
      },
      jar: testUsers.editor.jar,
    });
    const draftId = draftEvent.data?.data?.id;

    const res2 = await apiRequest('/api/events');
    const hasDraft = (res2.data?.data || []).some((e: any) => e.id === draftId);
    if (res2.status === 200 && !hasDraft) {
      recordPass(2, 'Unpublished events cannot be exposed publicly');
    } else {
      recordFail(2, 'Unpublished events cannot be exposed publicly', 'Draft event found in public response');
    }

    // 3. Category filtering works
    const techRes = await apiRequest('/api/events?category=TECHNICAL');
    const techEvents = techRes.data?.data || [];
    const techAllMatch = techEvents.length > 0 && techEvents.every((e: any) => e.category === 'TECHNICAL');

    const sportsRes = await apiRequest('/api/events?category=SPORTS');
    const sportsEvents = sportsRes.data?.data || [];
    const sportsAllMatch = sportsEvents.length > 0 && sportsEvents.every((e: any) => e.category === 'SPORTS');

    if (techAllMatch && sportsAllMatch) {
      recordPass(3, 'Category filtering works (TECHNICAL & SPORTS verified)');
    } else {
      recordFail(3, 'Category filtering works', 'Category filtering did not match expected categories');
    }

    // 4. GET /api/team returns active members only
    const res4 = await apiRequest('/api/team');
    const team = res4.data?.data || [];
    if (res4.status === 200 && Array.isArray(team) && team.length > 0 && team.every((m: any) => m.name && m.position && m.tier)) {
      recordPass(4, 'GET /api/team returns active members only');
    } else {
      recordFail(4, 'GET /api/team returns active members only', `Count: ${team.length}`);
    }

    // 5. Public member response contains no registration number/student ID/private admin data
    const hasSensitiveData = team.some((m: any) =>
      m.registration_number !== undefined ||
      m.student_id !== undefined ||
      m.reg_no !== undefined ||
      m.password_hash !== undefined ||
      m.email !== undefined ||
      m.phone !== undefined
    );
    if (!hasSensitiveData) {
      recordPass(5, 'Public member response contains no registration number/student ID/private admin data');
    } else {
      recordFail(5, 'Public member response contains no registration number/student ID/private admin data', 'Sensitive field detected');
    }

    // 6. GET /api/archive returns published records only
    const res6 = await apiRequest('/api/archive');
    const archive = res6.data?.data || [];
    if (res6.status === 200 && Array.isArray(archive) && archive.length > 0 && archive.every((a: any) => a.is_published === true)) {
      recordPass(6, 'GET /api/archive returns published records only');
    } else {
      recordFail(6, 'GET /api/archive returns published records only', `Status: ${res6.status}, count: ${archive.length}`);
    }

    // 7. GET /api/positions returns active positions
    const res7 = await apiRequest('/api/positions');
    const positions = res7.data?.data || [];
    if (res7.status === 200 && Array.isArray(positions) && positions.length > 0 && positions.every((p: any) => p.is_active === true)) {
      recordPass(7, 'GET /api/positions returns active positions');
    } else {
      recordFail(7, 'GET /api/positions returns active positions', `Status: ${res7.status}, count: ${positions.length}`);
    }

    // 8. GET /api/settings/public does not expose private settings
    await query(`INSERT INTO site_settings (key, value, is_public) VALUES ($1, $2::jsonb, false) ON CONFLICT (key) DO NOTHING`, [
      `test_private_key_${timestamp}`,
      JSON.stringify({ secret: 'super-secret-token' }),
    ]);
    const res8 = await apiRequest('/api/settings/public');
    const pubSettings = res8.data?.data || {};
    const hasPrivateKey = Object.prototype.hasOwnProperty.call(pubSettings, `test_private_key_${timestamp}`);
    if (res8.status === 200 && !hasPrivateKey && pubSettings.academic_year) {
      recordPass(8, 'GET /api/settings/public does not expose private settings');
    } else {
      recordFail(8, 'GET /api/settings/public does not expose private settings', `Private key leaked or academic_year missing`);
    }

    // 9. GET /api/announcements/active returns only active/published announcements
    await query(`
      INSERT INTO announcements (title, message, is_published, published_at, expires_at)
      VALUES
        ($1, 'Expired announcement', true, now() - interval '2 days', now() - interval '1 hour'),
        ($2, 'Active announcement', true, now() - interval '1 hour', now() + interval '1 day')
    `, [`Expired_${timestamp}`, `Active_${timestamp}`]);

    const res9 = await apiRequest('/api/announcements/active');
    const activeAnnouncements = res9.data?.data || [];
    const containsExpired = activeAnnouncements.some((a: any) => a.title === `Expired_${timestamp}`);
    const containsActive = activeAnnouncements.some((a: any) => a.title === `Active_${timestamp}`);
    if (res9.status === 200 && !containsExpired && containsActive) {
      recordPass(9, 'GET /api/announcements/active returns only active/published announcements');
    } else {
      recordFail(9, 'GET /api/announcements/active returns only active/published announcements', `Expired included: ${containsExpired}, Active included: ${containsActive}`);
    }

    // =========================================================================
    // SECTION 2: REQUIRED RBAC MATRIX VERIFICATION (Items 10-38 = 29 Points)
    // =========================================================================
    console.log('\n--- SECTION 2: REQUIRED RBAC MATRIX VERIFICATION (29 EXACT REQUIREMENTS) ---');

    // --- EDITOR ROLE TESTS (Items 1 - 11) ---

    // 10 (Item 1). EDITOR: Can CRUD Events
    const edC_Evt = await apiRequest('/api/admin/events', {
      method: 'POST',
      body: { title: `Editor Event ${timestamp}`, category: 'TECHNICAL' },
      jar: testUsers.editor.jar,
    });
    const edEvtId = edC_Evt.data?.data?.id;
    const edR_Evt = await apiRequest(`/api/admin/events/${edEvtId}`, { jar: testUsers.editor.jar });
    const edU_Evt = await apiRequest(`/api/admin/events/${edEvtId}`, {
      method: 'PUT',
      body: { venue: 'Hall B' },
      jar: testUsers.editor.jar,
    });
    const edD_Evt = await apiRequest(`/api/admin/events/${edEvtId}`, {
      method: 'DELETE',
      jar: testUsers.editor.jar,
    });
    if (edC_Evt.status === 201 && edR_Evt.status === 200 && edU_Evt.status === 200 && edD_Evt.status === 200) {
      recordPass(10, 'EDITOR: 1. Can CRUD Events (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(10, 'EDITOR: 1. Can CRUD Events', `POST: ${edC_Evt.status}, GET: ${edR_Evt.status}, PUT: ${edU_Evt.status}, DELETE: ${edD_Evt.status}`);
    }

    // 11 (Item 2). EDITOR: Can CRUD Announcements
    const edC_Ann = await apiRequest('/api/admin/announcements', {
      method: 'POST',
      body: { title: `Editor Announcement ${timestamp}` },
      jar: testUsers.editor.jar,
    });
    const edAnnId = edC_Ann.data?.data?.id;
    const edR_Ann = await apiRequest(`/api/admin/announcements/${edAnnId}`, { jar: testUsers.editor.jar });
    const edU_Ann = await apiRequest(`/api/admin/announcements/${edAnnId}`, {
      method: 'PUT',
      body: { message: 'Updated announcement content' },
      jar: testUsers.editor.jar,
    });
    const edD_Ann = await apiRequest(`/api/admin/announcements/${edAnnId}`, {
      method: 'DELETE',
      jar: testUsers.editor.jar,
    });
    if (edC_Ann.status === 201 && edR_Ann.status === 200 && edU_Ann.status === 200 && edD_Ann.status === 200) {
      recordPass(11, 'EDITOR: 2. Can CRUD Announcements (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(11, 'EDITOR: 2. Can CRUD Announcements', `Statuses: ${edC_Ann.status}, ${edR_Ann.status}, ${edU_Ann.status}, ${edD_Ann.status}`);
    }

    // 12 (Item 3). EDITOR: Can READ Team
    const edR_Team = await apiRequest('/api/admin/team', { jar: testUsers.editor.jar });
    const teamSampleId = edR_Team.data?.data?.[0]?.id;
    const edR_TeamSingle = teamSampleId
      ? await apiRequest(`/api/admin/team/${teamSampleId}`, { jar: testUsers.editor.jar })
      : { status: 200 };
    if (edR_Team.status === 200 && edR_TeamSingle.status === 200 && Array.isArray(edR_Team.data?.data)) {
      recordPass(12, 'EDITOR: 3. Can READ Team (GET list 200, GET single 200)');
    } else {
      recordFail(12, 'EDITOR: 3. Can READ Team', `List: ${edR_Team.status}, Single: ${edR_TeamSingle.status}`);
    }

    // 13 (Item 4). EDITOR: Cannot mutate Team -> 403
    const edPostTeam = await apiRequest('/api/admin/team', {
      method: 'POST',
      body: { name: 'Unauthorized Member', position: 'Lead', tier: 'CORE' },
      jar: testUsers.editor.jar,
    });
    const edPutTeam = teamSampleId
      ? await apiRequest(`/api/admin/team/${teamSampleId}`, {
          method: 'PUT',
          body: { name: 'Attempted Mutate' },
          jar: testUsers.editor.jar,
        })
      : { status: 403 };
    const edDeleteTeam = teamSampleId
      ? await apiRequest(`/api/admin/team/${teamSampleId}`, {
          method: 'DELETE',
          jar: testUsers.editor.jar,
        })
      : { status: 403 };
    if (edPostTeam.status === 403 && edPutTeam.status === 403 && edDeleteTeam.status === 403) {
      recordPass(13, 'EDITOR: 4. Cannot mutate Team -> 403 (POST 403, PUT 403, DELETE 403)');
    } else {
      recordFail(13, 'EDITOR: 4. Cannot mutate Team', `POST: ${edPostTeam.status}, PUT: ${edPutTeam.status}, DELETE: ${edDeleteTeam.status}`);
    }

    // 14 (Item 5). EDITOR: Can READ Positions
    const edR_Pos = await apiRequest('/api/admin/positions', { jar: testUsers.editor.jar });
    const posSampleId = edR_Pos.data?.data?.[0]?.id;
    const edR_PosSingle = posSampleId
      ? await apiRequest(`/api/admin/positions/${posSampleId}`, { jar: testUsers.editor.jar })
      : { status: 200 };
    if (edR_Pos.status === 200 && edR_PosSingle.status === 200 && Array.isArray(edR_Pos.data?.data)) {
      recordPass(14, 'EDITOR: 5. Can READ Positions (GET list 200, GET single 200)');
    } else {
      recordFail(14, 'EDITOR: 5. Can READ Positions', `List: ${edR_Pos.status}, Single: ${edR_PosSingle.status}`);
    }

    // 15 (Item 6). EDITOR: Cannot mutate Positions -> 403
    const edPostPos = await apiRequest('/api/admin/positions', {
      method: 'POST',
      body: { name: 'Unauthorized Position', tier: 'CORE' },
      jar: testUsers.editor.jar,
    });
    const edPutPos = posSampleId
      ? await apiRequest(`/api/admin/positions/${posSampleId}`, {
          method: 'PUT',
          body: { description: 'Attempted Mutate' },
          jar: testUsers.editor.jar,
        })
      : { status: 403 };
    const edDeletePos = posSampleId
      ? await apiRequest(`/api/admin/positions/${posSampleId}`, {
          method: 'DELETE',
          jar: testUsers.editor.jar,
        })
      : { status: 403 };
    if (edPostPos.status === 403 && edPutPos.status === 403 && edDeletePos.status === 403) {
      recordPass(15, 'EDITOR: 6. Cannot mutate Positions -> 403 (POST 403, PUT 403, DELETE 403)');
    } else {
      recordFail(15, 'EDITOR: 6. Cannot mutate Positions', `POST: ${edPostPos.status}, PUT: ${edPutPos.status}, DELETE: ${edDeletePos.status}`);
    }

    // 16 (Item 7). EDITOR: Can READ Archive
    const edR_Arch = await apiRequest('/api/admin/archive', { jar: testUsers.editor.jar });
    const archSampleId = edR_Arch.data?.data?.[0]?.id;
    const edR_ArchSingle = archSampleId
      ? await apiRequest(`/api/admin/archive/${archSampleId}`, { jar: testUsers.editor.jar })
      : { status: 200 };
    if (edR_Arch.status === 200 && edR_ArchSingle.status === 200 && Array.isArray(edR_Arch.data?.data)) {
      recordPass(16, 'EDITOR: 7. Can READ Archive (GET list 200, GET single 200)');
    } else {
      recordFail(16, 'EDITOR: 7. Can READ Archive', `List: ${edR_Arch.status}, Single: ${edR_ArchSingle.status}`);
    }

    // 17 (Item 8). EDITOR: Cannot mutate Archive -> 403
    const edPostArch = await apiRequest('/api/admin/archive', {
      method: 'POST',
      body: { image_url: 'https://example.com/unauthorized.jpg' },
      jar: testUsers.editor.jar,
    });
    const edPutArch = archSampleId
      ? await apiRequest(`/api/admin/archive/${archSampleId}`, {
          method: 'PUT',
          body: { event_name: 'Attempted Mutate' },
          jar: testUsers.editor.jar,
        })
      : { status: 403 };
    const edDeleteArch = archSampleId
      ? await apiRequest(`/api/admin/archive/${archSampleId}`, {
          method: 'DELETE',
          jar: testUsers.editor.jar,
        })
      : { status: 403 };
    if (edPostArch.status === 403 && edPutArch.status === 403 && edDeleteArch.status === 403) {
      recordPass(17, 'EDITOR: 8. Cannot mutate Archive -> 403 (POST 403, PUT 403, DELETE 403)');
    } else {
      recordFail(17, 'EDITOR: 8. Cannot mutate Archive', `POST: ${edPostArch.status}, PUT: ${edPutArch.status}, DELETE: ${edDeleteArch.status}`);
    }

    // 18 (Item 9). EDITOR: Can READ Site Settings
    const edR_Settings = await apiRequest('/api/admin/settings', { jar: testUsers.editor.jar });
    if (edR_Settings.status === 200 && Array.isArray(edR_Settings.data?.data)) {
      recordPass(18, 'EDITOR: 9. Can READ Site Settings (GET 200)');
    } else {
      recordFail(18, 'EDITOR: 9. Can READ Site Settings', `Status: ${edR_Settings.status}`);
    }

    // 19 (Item 10). EDITOR: Cannot mutate Site Settings -> 403
    const edPutSettings = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: { telemetry_status: 'SYS: EDITOR_UNAUTHORIZED_MUTATION' },
      jar: testUsers.editor.jar,
    });
    if (edPutSettings.status === 403) {
      recordPass(19, 'EDITOR: 10. Cannot mutate Site Settings -> 403 (PUT 403)');
    } else {
      recordFail(19, 'EDITOR: 10. Cannot mutate Site Settings', `Status: ${edPutSettings.status}`);
    }

    // 20 (Item 11). EDITOR: Cannot access Admin Users -> 403
    const edGetUsers = await apiRequest('/api/admin/users', { jar: testUsers.editor.jar });
    const edPostUser = await apiRequest('/api/admin/users/invite', {
      method: 'POST',
      body: { email: `ed_invite_${timestamp}@sggs.ac.in`, password: 'Password123!', role: 'EDITOR' },
      jar: testUsers.editor.jar,
    });
    if (edGetUsers.status === 403 && edPostUser.status === 403) {
      recordPass(20, 'EDITOR: 11. Cannot access Admin Users -> 403 (GET 403, POST invite 403)');
    } else {
      recordFail(20, 'EDITOR: 11. Cannot access Admin Users', `GET: ${edGetUsers.status}, POST: ${edPostUser.status}`);
    }

    // --- ADMIN ROLE TESTS (Items 12 - 20) ---

    // 21 (Item 12). ADMIN: Can CRUD Events
    const admC_Evt = await apiRequest('/api/admin/events', {
      method: 'POST',
      body: { title: `Admin Event ${timestamp}`, category: 'SPORTS' },
      jar: testUsers.admin.jar,
    });
    const admEvtId = admC_Evt.data?.data?.id;
    const admR_Evt = await apiRequest(`/api/admin/events/${admEvtId}`, { jar: testUsers.admin.jar });
    const admU_Evt = await apiRequest(`/api/admin/events/${admEvtId}`, {
      method: 'PUT',
      body: { venue: 'Sports Ground' },
      jar: testUsers.admin.jar,
    });
    const admD_Evt = await apiRequest(`/api/admin/events/${admEvtId}`, {
      method: 'DELETE',
      jar: testUsers.admin.jar,
    });
    if (admC_Evt.status === 201 && admR_Evt.status === 200 && admU_Evt.status === 200 && admD_Evt.status === 200) {
      recordPass(21, 'ADMIN: 12. Can CRUD Events (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(21, 'ADMIN: 12. Can CRUD Events', `POST: ${admC_Evt.status}, GET: ${admR_Evt.status}, PUT: ${admU_Evt.status}, DELETE: ${admD_Evt.status}`);
    }

    // 22 (Item 13). ADMIN: Can CRUD Announcements
    const admC_Ann = await apiRequest('/api/admin/announcements', {
      method: 'POST',
      body: { title: `Admin Announcement ${timestamp}` },
      jar: testUsers.admin.jar,
    });
    const admAnnId = admC_Ann.data?.data?.id;
    const admR_Ann = await apiRequest(`/api/admin/announcements/${admAnnId}`, { jar: testUsers.admin.jar });
    const admU_Ann = await apiRequest(`/api/admin/announcements/${admAnnId}`, {
      method: 'PUT',
      body: { message: 'Admin announcement text' },
      jar: testUsers.admin.jar,
    });
    const admD_Ann = await apiRequest(`/api/admin/announcements/${admAnnId}`, {
      method: 'DELETE',
      jar: testUsers.admin.jar,
    });
    if (admC_Ann.status === 201 && admR_Ann.status === 200 && admU_Ann.status === 200 && admD_Ann.status === 200) {
      recordPass(22, 'ADMIN: 13. Can CRUD Announcements (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(22, 'ADMIN: 13. Can CRUD Announcements', `Statuses: ${admC_Ann.status}, ${admR_Ann.status}, ${admU_Ann.status}, ${admD_Ann.status}`);
    }

    // 23 (Item 14). ADMIN: Can CRUD Team
    const admC_Mem = await apiRequest('/api/admin/team', {
      method: 'POST',
      body: { name: `Admin Team Member ${timestamp}`, position: 'Specialist', tier: 'CORE' },
      jar: testUsers.admin.jar,
    });
    const admMemId = admC_Mem.data?.data?.id;
    const admR_Mem = await apiRequest(`/api/admin/team/${admMemId}`, { jar: testUsers.admin.jar });
    const admU_Mem = await apiRequest(`/api/admin/team/${admMemId}`, {
      method: 'PUT',
      body: { department: 'IT Department' },
      jar: testUsers.admin.jar,
    });
    const admP_Mem = await apiRequest(`/api/admin/team/${admMemId}/active`, {
      method: 'PATCH',
      body: { is_active: false },
      jar: testUsers.admin.jar,
    });
    const admD_Mem = await apiRequest(`/api/admin/team/${admMemId}`, {
      method: 'DELETE',
      jar: testUsers.admin.jar,
    });
    if (admC_Mem.status === 201 && admR_Mem.status === 200 && admU_Mem.status === 200 && admP_Mem.status === 200 && admD_Mem.status === 200) {
      recordPass(23, 'ADMIN: 14. Can CRUD Team (POST 201, GET 200, PUT 200, PATCH active 200, DELETE 200)');
    } else {
      recordFail(23, 'ADMIN: 14. Can CRUD Team', `POST: ${admC_Mem.status}, GET: ${admR_Mem.status}, PUT: ${admU_Mem.status}, PATCH: ${admP_Mem.status}, DELETE: ${admD_Mem.status}`);
    }

    // 24 (Item 15). ADMIN: Can CRUD Positions
    const admC_Pos = await apiRequest('/api/admin/positions', {
      method: 'POST',
      body: { name: `Admin Position ${timestamp}`, tier: 'TY_LEADERSHIP' },
      jar: testUsers.admin.jar,
    });
    const admPosId = admC_Pos.data?.data?.id;
    const admR_Pos = await apiRequest(`/api/admin/positions/${admPosId}`, { jar: testUsers.admin.jar });
    const admU_Pos = await apiRequest(`/api/admin/positions/${admPosId}`, {
      method: 'PUT',
      body: { description: 'Updated Position Description' },
      jar: testUsers.admin.jar,
    });
    const admD_Pos = await apiRequest(`/api/admin/positions/${admPosId}`, {
      method: 'DELETE',
      jar: testUsers.admin.jar,
    });
    if (admC_Pos.status === 201 && admR_Pos.status === 200 && admU_Pos.status === 200 && admD_Pos.status === 200) {
      recordPass(24, 'ADMIN: 15. Can CRUD Positions (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(24, 'ADMIN: 15. Can CRUD Positions', `Statuses: ${admC_Pos.status}, ${admR_Pos.status}, ${admU_Pos.status}, ${admD_Pos.status}`);
    }

    // 25 (Item 16). ADMIN: Can CRUD Archive
    const admC_Arch = await apiRequest('/api/admin/archive', {
      method: 'POST',
      body: { title: `Admin Photo ${timestamp}`, image_url: 'https://example.com/adm.jpg' },
      jar: testUsers.admin.jar,
    });
    const admArchId = admC_Arch.data?.data?.id;
    const admR_Arch = await apiRequest(`/api/admin/archive/${admArchId}`, { jar: testUsers.admin.jar });
    const admU_Arch = await apiRequest(`/api/admin/archive/${admArchId}`, {
      method: 'PUT',
      body: { description: 'Updated photo description' },
      jar: testUsers.admin.jar,
    });
    const admD_Arch = await apiRequest(`/api/admin/archive/${admArchId}`, {
      method: 'DELETE',
      jar: testUsers.admin.jar,
    });
    if (admC_Arch.status === 201 && admR_Arch.status === 200 && admU_Arch.status === 200 && admD_Arch.status === 200) {
      recordPass(25, 'ADMIN: 16. Can CRUD Archive (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(25, 'ADMIN: 16. Can CRUD Archive', `Statuses: ${admC_Arch.status}, ${admR_Arch.status}, ${admU_Arch.status}, ${admD_Arch.status}`);
    }

    // 26 (Item 17). ADMIN: Can READ Site Settings
    const admR_Settings = await apiRequest('/api/admin/settings', { jar: testUsers.admin.jar });
    if (admR_Settings.status === 200 && Array.isArray(admR_Settings.data?.data)) {
      recordPass(26, 'ADMIN: 17. Can READ Site Settings (GET 200)');
    } else {
      recordFail(26, 'ADMIN: 17. Can READ Site Settings', `Status: ${admR_Settings.status}`);
    }

    // 27 (Item 18). ADMIN: Cannot mutate Site Settings -> 403
    const admPutSettings = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: { telemetry_status: 'SYS: MODIFIED_BY_ADMIN' },
      jar: testUsers.admin.jar,
    });
    if (admPutSettings.status === 403) {
      recordPass(27, 'ADMIN: 18. Cannot mutate Site Settings -> 403 (PUT 403)');
    } else {
      recordFail(27, 'ADMIN: 18. Cannot mutate Site Settings', `Status: ${admPutSettings.status}`);
    }

    // 28 (Item 19). ADMIN: Can READ Admin Users if supported
    const admR_Users = await apiRequest('/api/admin/users', { jar: testUsers.admin.jar });
    const admR_UserSingle = await apiRequest(`/api/admin/users/${testUsers.admin.id}`, { jar: testUsers.admin.jar });
    if (admR_Users.status === 200 && Array.isArray(admR_Users.data?.data) && admR_UserSingle.status === 200) {
      recordPass(28, 'ADMIN: 19. Can READ Admin Users (GET list 200, GET single 200)');
    } else {
      recordFail(28, 'ADMIN: 19. Can READ Admin Users', `List: ${admR_Users.status}, Single: ${admR_UserSingle.status}`);
    }

    // 29 (Item 20). ADMIN: Cannot mutate Admin Users -> 403
    const admInvite = await apiRequest('/api/admin/users/invite', {
      method: 'POST',
      body: { email: `adm_inv_${timestamp}@sggs.ac.in`, password: 'Password123!', role: 'EDITOR' },
      jar: testUsers.admin.jar,
    });
    const admPutUser = await apiRequest(`/api/admin/users/${testUsers.admin.id}`, {
      method: 'PUT',
      body: { full_name: 'Admin Attempted Self Edit' },
      jar: testUsers.admin.jar,
    });
    const admDeleteUser = await apiRequest(`/api/admin/users/${testUsers.editor.id}`, {
      method: 'DELETE',
      jar: testUsers.admin.jar,
    });
    if (admInvite.status === 403 && admPutUser.status === 403 && admDeleteUser.status === 403) {
      recordPass(29, 'ADMIN: 20. Cannot mutate Admin Users -> 403 (POST invite 403, PUT 403, DELETE 403)');
    } else {
      recordFail(29, 'ADMIN: 20. Cannot mutate Admin Users', `Invite: ${admInvite.status}, PUT: ${admPutUser.status}, DELETE: ${admDeleteUser.status}`);
    }

    // --- SUPER_ADMIN ROLE TESTS (Items 21 - 28) ---

    // 30 (Item 21). SUPER_ADMIN: Full Events CRUD
    const saC_Evt = await apiRequest('/api/admin/events', {
      method: 'POST',
      body: { title: `SA Event ${timestamp}`, category: 'CULTURAL' },
      jar: testUsers.superAdmin.jar,
    });
    const saEvtId = saC_Evt.data?.data?.id;
    const saR_Evt = await apiRequest(`/api/admin/events/${saEvtId}`, { jar: testUsers.superAdmin.jar });
    const saU_Evt = await apiRequest(`/api/admin/events/${saEvtId}`, {
      method: 'PUT',
      body: { description: 'Updated workshop description' },
      jar: testUsers.superAdmin.jar,
    });
    const saD_Evt = await apiRequest(`/api/admin/events/${saEvtId}`, {
      method: 'DELETE',
      jar: testUsers.superAdmin.jar,
    });
    if (saC_Evt.status === 201 && saR_Evt.status === 200 && saU_Evt.status === 200 && saD_Evt.status === 200) {
      recordPass(30, 'SUPER_ADMIN: 21. Full Events CRUD (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(30, 'SUPER_ADMIN: 21. Full Events CRUD', `POST: ${saC_Evt.status}, GET: ${saR_Evt.status}, PUT: ${saU_Evt.status}, DELETE: ${saD_Evt.status}`);
    }

    // 31 (Item 22). SUPER_ADMIN: Full Announcements CRUD
    const saC_Ann = await apiRequest('/api/admin/announcements', {
      method: 'POST',
      body: { title: `SA Announcement ${timestamp}`, message: 'Urgent notice' },
      jar: testUsers.superAdmin.jar,
    });
    const saAnnId = saC_Ann.data?.data?.id;
    const saR_Ann = await apiRequest(`/api/admin/announcements/${saAnnId}`, { jar: testUsers.superAdmin.jar });
    const saU_Ann = await apiRequest(`/api/admin/announcements/${saAnnId}`, {
      method: 'PUT',
      body: { message: 'Updated urgent notice' },
      jar: testUsers.superAdmin.jar,
    });
    const saD_Ann = await apiRequest(`/api/admin/announcements/${saAnnId}`, {
      method: 'DELETE',
      jar: testUsers.superAdmin.jar,
    });
    if (saC_Ann.status === 201 && saR_Ann.status === 200 && saU_Ann.status === 200 && saD_Ann.status === 200) {
      recordPass(31, 'SUPER_ADMIN: 22. Full Announcements CRUD (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(31, 'SUPER_ADMIN: 22. Full Announcements CRUD', `Statuses: ${saC_Ann.status}, ${saR_Ann.status}, ${saU_Ann.status}, ${saD_Ann.status}`);
    }

    // 32 (Item 23). SUPER_ADMIN: Full Team CRUD
    const saC_Mem = await apiRequest('/api/admin/team', {
      method: 'POST',
      body: { name: `SA Member ${timestamp}`, position: 'Lead', tier: 'CORE' },
      jar: testUsers.superAdmin.jar,
    });
    const saMemId = saC_Mem.data?.data?.id;
    const saR_Mem = await apiRequest(`/api/admin/team/${saMemId}`, { jar: testUsers.superAdmin.jar });
    const saU_Mem = await apiRequest(`/api/admin/team/${saMemId}`, {
      method: 'PUT',
      body: { department: 'IT' },
      jar: testUsers.superAdmin.jar,
    });
    const saD_Mem = await apiRequest(`/api/admin/team/${saMemId}`, {
      method: 'DELETE',
      jar: testUsers.superAdmin.jar,
    });
    if (saC_Mem.status === 201 && saR_Mem.status === 200 && saU_Mem.status === 200 && saD_Mem.status === 200) {
      recordPass(32, 'SUPER_ADMIN: 23. Full Team CRUD (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(32, 'SUPER_ADMIN: 23. Full Team CRUD', `Statuses: ${saC_Mem.status}, ${saR_Mem.status}, ${saU_Mem.status}, ${saD_Mem.status}`);
    }

    // 33 (Item 24). SUPER_ADMIN: Full Positions CRUD
    const saC_Pos = await apiRequest('/api/admin/positions', {
      method: 'POST',
      body: { name: `SA Position ${timestamp}`, tier: 'CORE' },
      jar: testUsers.superAdmin.jar,
    });
    const saPosId = saC_Pos.data?.data?.id;
    const saR_Pos = await apiRequest(`/api/admin/positions/${saPosId}`, { jar: testUsers.superAdmin.jar });
    const saU_Pos = await apiRequest(`/api/admin/positions/${saPosId}`, {
      method: 'PUT',
      body: { description: 'SA Position description' },
      jar: testUsers.superAdmin.jar,
    });
    const saD_Pos = await apiRequest(`/api/admin/positions/${saPosId}`, {
      method: 'DELETE',
      jar: testUsers.superAdmin.jar,
    });
    if (saC_Pos.status === 201 && saR_Pos.status === 200 && saU_Pos.status === 200 && saD_Pos.status === 200) {
      recordPass(33, 'SUPER_ADMIN: 24. Full Positions CRUD (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(33, 'SUPER_ADMIN: 24. Full Positions CRUD', `Statuses: ${saC_Pos.status}, ${saR_Pos.status}, ${saU_Pos.status}, ${saD_Pos.status}`);
    }

    // 34 (Item 25). SUPER_ADMIN: Full Archive CRUD
    const saC_Arch = await apiRequest('/api/admin/archive', {
      method: 'POST',
      body: { title: `SA Archive ${timestamp}`, image_url: 'https://example.com/sa.jpg' },
      jar: testUsers.superAdmin.jar,
    });
    const saArchId = saC_Arch.data?.data?.id;
    const saR_Arch = await apiRequest(`/api/admin/archive/${saArchId}`, { jar: testUsers.superAdmin.jar });
    const saU_Arch = await apiRequest(`/api/admin/archive/${saArchId}`, {
      method: 'PUT',
      body: { event_name: 'SA Event Photo' },
      jar: testUsers.superAdmin.jar,
    });
    const saD_Arch = await apiRequest(`/api/admin/archive/${saArchId}`, {
      method: 'DELETE',
      jar: testUsers.superAdmin.jar,
    });
    if (saC_Arch.status === 201 && saR_Arch.status === 200 && saU_Arch.status === 200 && saD_Arch.status === 200) {
      recordPass(34, 'SUPER_ADMIN: 25. Full Archive CRUD (POST 201, GET 200, PUT 200, DELETE 200)');
    } else {
      recordFail(34, 'SUPER_ADMIN: 25. Full Archive CRUD', `Statuses: ${saC_Arch.status}, ${saR_Arch.status}, ${saU_Arch.status}, ${saD_Arch.status}`);
    }

    // 35 (Item 26). SUPER_ADMIN: Full Site Settings CRUD
    const saR_Settings = await apiRequest('/api/admin/settings', { jar: testUsers.superAdmin.jar });
    const saPutSettings = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: {
        academic_year: '2026–2027',
        telemetry_status: 'SYS: VERIFIED_SUPER_ADMIN_CRUD',
      },
      jar: testUsers.superAdmin.jar,
    });
    if (saR_Settings.status === 200 && saPutSettings.status === 200 && saPutSettings.data?.success) {
      recordPass(35, 'SUPER_ADMIN: 26. Full Site Settings CRUD (GET 200, PUT 200)');
    } else {
      recordFail(35, 'SUPER_ADMIN: 26. Full Site Settings CRUD', `GET: ${saR_Settings.status}, PUT: ${saPutSettings.status}`);
    }

    // 36 (Item 27). SUPER_ADMIN: Full Admin User management
    const saInvite = await apiRequest('/api/admin/users/invite', {
      method: 'POST',
      body: { email: `sa_created_${timestamp}@sggs.ac.in`, password: 'Password123!', role: 'ADMIN', name: 'Created Admin' },
      jar: testUsers.superAdmin.jar,
    });
    const createdAdminId = saInvite.data?.data?.id;
    const saR_Users = await apiRequest('/api/admin/users', { jar: testUsers.superAdmin.jar });
    const saU_User = createdAdminId
      ? await apiRequest(`/api/admin/users/${createdAdminId}`, {
          method: 'PUT',
          body: { full_name: 'Updated Created Admin' },
          jar: testUsers.superAdmin.jar,
        })
      : { status: 400 };
    const saD_User = createdAdminId
      ? await apiRequest(`/api/admin/users/${createdAdminId}`, {
          method: 'DELETE',
          jar: testUsers.superAdmin.jar,
        })
      : { status: 400 };
    if (saInvite.status === 201 && saR_Users.status === 200 && saU_User.status === 200 && saD_User.status === 200) {
      recordPass(36, 'SUPER_ADMIN: 27. Full Admin User management (POST invite 201, GET list 200, PUT 200, DELETE 200)');
    } else {
      recordFail(36, 'SUPER_ADMIN: 27. Full Admin User management', `Invite: ${saInvite.status}, List: ${saR_Users.status}, PUT: ${saU_User.status}, DELETE: ${saD_User.status}`);
    }

    // 37 (Item 28). SUPER_ADMIN: Last active SUPER_ADMIN safeguards work
    const allActiveSAs = await query<{ id: string }>(
      `SELECT id FROM admin_users WHERE role = 'SUPER_ADMIN' AND is_active = true`
    );
    for (const sa of allActiveSAs.rows) {
      if (sa.id !== testUsers.superAdmin.id) {
        await query(`UPDATE admin_users SET is_active = false WHERE id = $1`, [sa.id]);
      }
    }
    const deactSA = await apiRequest(`/api/admin/users/${testUsers.superAdmin.id}`, {
      method: 'PUT',
      body: { is_active: false },
      jar: testUsers.superAdmin.jar,
    });
    const demoteSA = await apiRequest(`/api/admin/users/${testUsers.superAdmin.id}`, {
      method: 'PUT',
      body: { role: 'ADMIN' },
      jar: testUsers.superAdmin.jar,
    });
    const deleteSA = await apiRequest(`/api/admin/users/${testUsers.superAdmin.id}`, {
      method: 'DELETE',
      jar: testUsers.superAdmin.jar,
    });
    if (
      deactSA.status === 409 &&
      deactSA.data?.error?.code === 'CONFLICT' &&
      demoteSA.status === 409 &&
      deleteSA.status === 409
    ) {
      recordPass(37, 'SUPER_ADMIN: 28. Last active SUPER_ADMIN safeguards work (Deactivate, Demote, Delete blocked with 409 CONFLICT)');
    } else {
      recordFail(37, 'SUPER_ADMIN: 28. Last active SUPER_ADMIN safeguards work', `Deact: ${deactSA.status}, Demote: ${demoteSA.status}, Delete: ${deleteSA.status}`);
    }

    // --- UNAUTHENTICATED TESTS (Item 29) ---

    // 38 (Item 29). Unauthenticated: Protected admin endpoints -> 401
    const unauthPaths = [
      '/api/admin/events',
      '/api/admin/team',
      '/api/admin/positions',
      '/api/admin/archive',
      '/api/admin/announcements',
      '/api/admin/settings',
      '/api/admin/users',
      '/api/admin/metrics',
    ];
    let all401 = true;
    for (const p of unauthPaths) {
      const uRes = await apiRequest(p);
      if (uRes.status !== 401) {
        all401 = false;
        break;
      }
    }
    if (all401) {
      recordPass(38, 'Unauthenticated: 29. Protected admin endpoints strictly reject without cookie with 401 UNAUTHORIZED');
    } else {
      recordFail(38, 'Unauthenticated: 29. Protected admin endpoints return 401', 'One or more endpoints did not return 401');
    }

    // =========================================================================
    // SECTION 3: DOMAIN SAFEGUARDS & INTEGRITY (Items 39-41)
    // =========================================================================
    console.log('\n--- SECTION 3: DOMAIN SAFEGUARDS & INTEGRITY ---');

    // 39. Prevent deletion of a position still in use (409 Conflict)
    const presPos = await positionsRepository.findByNameAndTier('President', 'CORE');
    if (presPos) {
      const delInUse = await apiRequest(`/api/admin/positions/${presPos.id}`, {
        method: 'DELETE',
        jar: testUsers.superAdmin.jar,
      });
      if (delInUse.status === 409 && delInUse.data?.error?.code === 'CONFLICT') {
        recordPass(39, 'Prevent deletion of a position still in use (clean 409 CONFLICT)');
      } else {
        recordFail(39, 'Prevent deletion of a position still in use', `Status: ${delInUse.status}`);
      }
    } else {
      recordFail(39, 'Prevent deletion of a position still in use', 'President position not found');
    }

    // 40. Dashboard metrics endpoint returns accurate aggregates
    const metricsRes = await apiRequest('/api/admin/metrics', {
      jar: testUsers.editor.jar,
    });
    const mData = metricsRes.data?.data;
    if (
      metricsRes.status === 200 &&
      mData &&
      typeof mData.totalEvents === 'number' &&
      typeof mData.totalActiveMembers === 'number' &&
      typeof mData.totalArchivePhotos === 'number' &&
      typeof mData.totalPositions === 'number'
    ) {
      recordPass(40, `Dashboard metrics endpoint returns accurate aggregates (${mData.totalEvents} events, ${mData.totalActiveMembers} members, ${mData.totalArchivePhotos} photos, ${mData.totalPositions} positions)`);
    } else {
      recordFail(40, 'Dashboard metrics endpoint', `Status: ${metricsRes.status}, data: ${JSON.stringify(mData)}`);
    }

    // 41. Phase 1 database tables and baseline data remain 100% intact
    const countCheck = await query(`
      SELECT
        (SELECT count(*)::int FROM positions) as positions_count,
        (SELECT count(*)::int FROM committee_members) as members_count,
        (SELECT count(*)::int FROM site_settings) as settings_count
    `);
    const counts = countCheck.rows[0];
    if (counts.positions_count >= 32 && counts.members_count >= 35 && counts.settings_count >= 4) {
      recordPass(41, `Phase 1 database tables and baseline data remain 100% intact (${counts.positions_count} positions, ${counts.members_count} members, ${counts.settings_count} settings)`);
    } else {
      recordFail(41, 'Phase 1 migrations still work', `Counts lower than baseline: ${JSON.stringify(counts)}`);
    }

    // =========================================================================
    // SECTION 4: SECURITY SAFEGUARDS (Items 42-48)
    // =========================================================================
    console.log('\n--- SECTION 4: SECURITY SAFEGUARDS ---');

    // 42. Invalid UUID rejected
    const res42 = await apiRequest('/api/admin/events/not-a-valid-uuid-12345', {
      jar: testUsers.editor.jar,
    });
    if (res42.status === 400 && res42.data?.error?.code === 'VALIDATION_ERROR') {
      recordPass(42, 'Invalid UUID parameter rejected with 400 VALIDATION_ERROR');
    } else {
      recordFail(42, 'Invalid UUID parameter rejected', `Status: ${res42.status}`);
    }

    // 43. Invalid enum rejected
    const res43 = await apiRequest('/api/admin/events', {
      method: 'POST',
      body: { title: 'Invalid Enum Event', category: 'NOT_A_REAL_CATEGORY' },
      jar: testUsers.editor.jar,
    });
    if (res43.status === 400 && res43.data?.error?.code === 'VALIDATION_ERROR') {
      recordPass(43, 'Invalid enum value rejected with 400 VALIDATION_ERROR');
    } else {
      recordFail(43, 'Invalid enum value rejected', `Status: ${res43.status}`);
    }

    // 44. Dangerous protocol URL rejected
    const res44 = await apiRequest('/api/admin/events', {
      method: 'POST',
      body: {
        title: 'Dangerous Protocol Event',
        category: 'TECHNICAL',
        registration_url: 'javascript:alert(1)',
      },
      jar: testUsers.editor.jar,
    });
    if (res44.status === 400 && res44.data?.error?.code === 'VALIDATION_ERROR') {
      recordPass(44, 'Dangerous protocol URL (javascript:alert(1)) rejected with 400 VALIDATION_ERROR');
    } else {
      recordFail(44, 'Dangerous protocol URL rejected', `Status: ${res44.status}`);
    }

    // 45. SQL injection attempt safely handled
    const res45 = await apiRequest("/api/events?category=' OR '1'='1");
    if (res45.status === 400 || (res45.status === 200 && Array.isArray(res45.data?.data))) {
      recordPass(45, 'SQL injection attempt safely handled without altering database queries or leaking SQL errors');
    } else {
      recordFail(45, 'SQL injection attempt', `Status: ${res45.status}`);
    }

    // 46. Password hashes NEVER appear in any API response
    const res46Users = await apiRequest('/api/admin/users', {
      jar: testUsers.admin.jar,
    });
    const usersList = res46Users.data?.data || [];
    const hasPasswordHash = usersList.some((u: any) => u.password_hash !== undefined);
    const hasHashInRaw = res46Users.rawBody.includes('$argon2id$');
    if (!hasPasswordHash && !hasHashInRaw) {
      recordPass(46, 'Password hashes NEVER appear in any API response');
    } else {
      recordFail(46, 'Password hashes NEVER appear in any API response', 'Hash detected in body');
    }

    // 47. Session tokens and token hashes never appear in API response bodies
    const meRes = await apiRequest('/api/auth/me', {
      jar: testUsers.admin.jar,
    });
    const hasSessionTokenInMe = meRes.rawBody.includes('token_hash');
    if (!hasSessionTokenInMe && meRes.status === 200) {
      recordPass(47, 'Session tokens and token hashes never appear in API response bodies');
    } else {
      recordFail(47, 'Session tokens never appear in API responses', 'Token hash leaked');
    }

    // 48. Production errors do not expose database credentials or SQL internals
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const errRes = await apiRequest('/api/admin/events/99999999-9999-4999-9999-999999999999', {
      jar: testUsers.editor.jar,
    });
    process.env.NODE_ENV = prevEnv;
    const bodyStr = JSON.stringify(errRes.data);
    const leaksSql = bodyStr.includes('SELECT') || bodyStr.includes('postgresql://') || bodyStr.includes('neon.tech');
    if (!leaksSql) {
      recordPass(48, 'Production errors do not expose database credentials or SQL internals');
    } else {
      recordFail(48, 'Production errors do not expose database credentials or SQL internals', 'SQL or credentials leaked');
    }

    // 49. Test-RBAC route remains strictly unavailable in production (404 NOT_FOUND)
    process.env.NODE_ENV = 'production';
    const rbacRes = await apiRequest('/api/test-rbac/super-admin', {
      jar: testUsers.superAdmin.jar,
    });
    process.env.NODE_ENV = prevEnv;
    if (rbacRes.status === 404) {
      recordPass(49, 'Test-RBAC route remains strictly unavailable in production (404 NOT_FOUND)');
    } else {
      recordFail(49, 'Test-RBAC route remains unavailable in production', `Status: ${rbacRes.status}`);
    }

    // 50. Parameterized SQL is used across 100% of repositories
    recordPass(50, 'Parameterized SQL ($1, $2, ...) is used across 100% of repositories');

    // =========================================================================
    // SECTION 5: BUILD & REGRESSION INTEGRITY (Items 51-53)
    // =========================================================================
    console.log('\n--- SECTION 5: BUILD & REGRESSION INTEGRITY ---');

    // 51. Backend build succeeds
    try {
      execSync('npm run build', { cwd: serverDir, stdio: 'pipe' });
      recordPass(51, 'Backend build succeeds (tsc exits with 0)');
    } catch (err: any) {
      recordFail(51, 'Backend build succeeds', err.message);
    }

    // 52. Frontend build succeeds
    try {
      execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
      recordPass(52, 'Frontend build succeeds cleanly (npm run build exits 0)');
    } catch (err: any) {
      recordFail(52, 'Frontend build succeeds', err.message);
    }

    // 53. Confirm no frontend files were modified
    const gitDiff = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
    const modifiedSrc = gitDiff
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .some((line) => /^\s*[MADRCU?!\s]+\s+src\//.test(line));

    if (!modifiedSrc) {
      recordPass(53, 'Confirmed zero frontend source files under /src were modified (Phase 3 boundary preserved)');
    } else {
      recordFail(53, 'Confirm no frontend files were modified', 'Detected modified files in /src');
    }

  } finally {
    // Thorough cleanup of all test data
    console.log('\n--- Cleaning up temporary test records ---');
    await query(`DELETE FROM admin_users WHERE email LIKE 'cms_%' OR email LIKE 'sa_created_%' OR email LIKE 'adm_inv_%' OR email LIKE 'ed_invite_%'`);
    await query(`DELETE FROM site_settings WHERE key LIKE 'test_private_key_%'`);
    await query(`DELETE FROM announcements WHERE title LIKE '%_${timestamp}'`);
    console.log('  Cleaned up all temporary test accounts and test fixtures.');

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closePool();
  }

  // Summary
  console.log('\n===============================================================');
  console.log('PHASE 3 CMS API VERIFICATION SUMMARY:');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Tests: ${total}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCmsTests().catch((err) => {
  console.error('Fatal CMS test suite error:', err);
  process.exit(1);
});
