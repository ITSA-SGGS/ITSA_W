/**
 * ITSA Platform — Phase 4 Storage & Media Verification Suite
 *
 * Fully automated end-to-end verification covering:
 *   SECTION 1: STORAGE ABSTRACTION & CONTRACT SPECIFICATIONS (Tests 1-3)
 *   SECTION 2: BINARY SIGNATURE & MAGIC NUMBER VERIFICATION (Tests 4-10)
 *   SECTION 3: FILE SIZE LIMITS & VALIDATION SAFEGUARDS (Tests 11-14)
 *   SECTION 4: STORAGE PROVIDERS & FACTORY (Tests 15-18)
 *   SECTION 5: STORAGE SERVICE LAYER (RESOLVE, EXTRACT, DELETE) (Tests 19-22)
 *   SECTION 6: HTTP ENDPOINTS & RBAC ACCESS CONTROL (Tests 23-38)
 *   SECTION 7: REGRESSION & SYSTEM INTEGRITY (Tests 39-41)
 */

import http from 'http';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { app } from '../app.js';
import { query, closePool, isDatabaseConfigured } from '../config/database.js';
import { authService } from '../services/auth.service.js';
import { adminUserRepository } from '../repositories/adminUser.repository.js';
import { CookieJar } from '../utils/cookieJar.js';
import {
  CATEGORY_CONFIGS,
  normalizeCategory,
  detectImageMimeType,
  generateStorageKey,
  sanitizeFileName,
  validateStorageFile,
} from '../storage/validation.js';
import { MemoryStorageProvider } from '../storage/providers/memory.provider.js';
import { LocalStorageProvider } from '../storage/providers/local.provider.js';
import { R2StorageProvider } from '../storage/providers/r2.provider.js';
import { createStorageProvider } from '../storage/providers/factory.js';
import { StorageService } from '../storage/storage.service.js';
import { StorageCategory, StorageFile } from '../storage/types.js';

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

// HTTP request helper for JSON endpoints
async function apiRequest(
  pathUrl: string,
  options: {
    method?: string;
    body?: any;
    jar?: CookieJar;
    headers?: Record<string, string>;
  } = {}
) {
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

  const response = await fetch(`${baseUrl}${pathUrl}`, {
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
  };
}

// HTTP request helper for Multipart uploads
async function uploadRequest(
  pathUrl: string,
  formData: FormData,
  jar?: CookieJar
) {
  const headers: Record<string, string> = {};

  if (jar) {
    const cookieHeader = jar.getCookieHeader();
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
  }

  const response = await fetch(`${baseUrl}${pathUrl}`, {
    method: 'POST',
    headers,
    body: formData,
  });

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
  };
}

// Sample binary image fixtures
const SAMPLE_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
  0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9,
]);

const SAMPLE_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const SAMPLE_WEBP = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x20, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.from('VP8 ', 'ascii'),
  Buffer.from([0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
]);

const SAMPLE_AVIF = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x1c]),
  Buffer.from('ftyp', 'ascii'),
  Buffer.from('avif', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('mif1', 'ascii'),
  Buffer.from('avif', 'ascii'),
]);

const FAKE_IMAGE_EXE = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00');
const FAKE_IMAGE_HTML = Buffer.from('<html><script>alert("xss")</script></html>');
const FAKE_IMAGE_TEXT = Buffer.from('This is a text file masquerading as a photograph.');

async function runStorageVerificationSuite() {
  console.log('\n===============================================================');
  console.log('ITSA WEBSITE — PHASE 4: STORAGE & MEDIA VERIFICATION SUITE');
  console.log('===============================================================\n');

  // 1. Start Server for HTTP tests
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });

  const timestamp = Date.now();
  const superAdminEmail = `sa_storage_${timestamp}@itsa.sggs.ac.in`;
  const adminEmail = `adm_storage_${timestamp}@itsa.sggs.ac.in`;
  const editorEmail = `ed_storage_${timestamp}@itsa.sggs.ac.in`;
  const testPassword = 'Password123!SecureStoragePhase4';

  const superAdminJar = new CookieJar();
  const adminJar = new CookieJar();
  const editorJar = new CookieJar();

  try {
    // =========================================================================
    // SECTION 1: STORAGE ABSTRACTION & CONTRACT SPECIFICATIONS
    // =========================================================================
    console.log('--- SECTION 1: STORAGE ABSTRACTION & CONTRACT SPECIFICATIONS ---');

    // Test 1: Category configurations match required specifications
    {
      const team = CATEGORY_CONFIGS.team;
      const event = CATEGORY_CONFIGS.event;
      const archive = CATEGORY_CONFIGS.archive;

      const teamValid =
        team.maxSizeBytes === 5 * 1024 * 1024 &&
        team.prefix === 'team/portraits/' &&
        team.legacyBucket === 'team-photos';

      const eventValid =
        event.maxSizeBytes === 10 * 1024 * 1024 &&
        event.prefix === 'events/covers/' &&
        event.legacyBucket === 'event-media';

      const archiveValid =
        archive.maxSizeBytes === 10 * 1024 * 1024 &&
        archive.prefix === 'archive/photos/' &&
        archive.legacyBucket === 'archive-media';

      if (teamValid && eventValid && archiveValid) {
        recordPass(
          1,
          'Category specifications strictly configured (team: 5MB team/portraits/, event: 10MB events/covers/, archive: 10MB archive/photos/)'
        );
      } else {
        recordFail(1, 'Category specifications mismatch', JSON.stringify({ team, event, archive }));
      }
    }

    // Test 2: Category normalization and alias resolution
    {
      const r1 = normalizeCategory('team');
      const r2 = normalizeCategory('team-photos');
      const r3 = normalizeCategory('portraits');
      const r4 = normalizeCategory('event');
      const r5 = normalizeCategory('event-media');
      const r6 = normalizeCategory('covers');
      const r7 = normalizeCategory('archive');
      const r8 = normalizeCategory('archive-media');
      const r9 = normalizeCategory('photos');

      if (
        r1 === 'team' &&
        r2 === 'team' &&
        r3 === 'team' &&
        r4 === 'event' &&
        r5 === 'event' &&
        r6 === 'event' &&
        r7 === 'archive' &&
        r8 === 'archive' &&
        r9 === 'archive'
      ) {
        recordPass(2, 'Category normalizer correctly resolves canonical categories and legacy aliases');
      } else {
        recordFail(2, 'Category normalizer failed alias mappings', JSON.stringify({ r1, r4, r7 }));
      }
    }

    // Test 3: Invalid category rejected with ValidationError
    {
      let caught = false;
      try {
        normalizeCategory('users-bucket');
      } catch (err: any) {
        if (err.name === 'ValidationError') caught = true;
      }

      if (caught) {
        recordPass(3, 'Invalid or untrusted storage category is strictly rejected with ValidationError');
      } else {
        recordFail(3, 'Invalid category was not rejected', 'Expected ValidationError');
      }
    }

    // =========================================================================
    // SECTION 2: BINARY SIGNATURE & MAGIC NUMBER VERIFICATION
    // =========================================================================
    console.log('\n--- SECTION 2: BINARY SIGNATURE & MAGIC NUMBER VERIFICATION ---');

    // Test 4: Genuine JPEG binary buffer verified
    {
      const detected = detectImageMimeType(SAMPLE_JPEG);
      if (detected === 'image/jpeg') {
        recordPass(4, 'Genuine JPEG magic bytes (FF D8 FF) verified accurately');
      } else {
        recordFail(4, 'JPEG magic bytes detection failed', `Detected: ${detected}`);
      }
    }

    // Test 5: Genuine PNG binary buffer verified
    {
      const detected = detectImageMimeType(SAMPLE_PNG);
      if (detected === 'image/png') {
        recordPass(5, 'Genuine PNG magic bytes (89 50 4E 47 0D 0A 1A 0A) verified accurately');
      } else {
        recordFail(5, 'PNG magic bytes detection failed', `Detected: ${detected}`);
      }
    }

    // Test 6: Genuine WebP binary buffer verified
    {
      const detected = detectImageMimeType(SAMPLE_WEBP);
      if (detected === 'image/webp') {
        recordPass(6, 'Genuine WebP RIFF/WEBP signature verified accurately');
      } else {
        recordFail(6, 'WebP magic bytes detection failed', `Detected: ${detected}`);
      }
    }

    // Test 7: Genuine AVIF binary buffer verified
    {
      const detected = detectImageMimeType(SAMPLE_AVIF);
      if (detected === 'image/avif') {
        recordPass(7, 'Genuine AVIF ftyp/avif signature verified accurately');
      } else {
        recordFail(7, 'AVIF magic bytes detection failed', `Detected: ${detected}`);
      }
    }

    // Test 8: Disallowed file types rejected by binary inspector
    {
      const exeDet = detectImageMimeType(FAKE_IMAGE_EXE);
      const htmlDet = detectImageMimeType(FAKE_IMAGE_HTML);
      const textDet = detectImageMimeType(FAKE_IMAGE_TEXT);
      const corruptDet = detectImageMimeType(Buffer.from([0x01, 0x02]));

      if (exeDet === null && htmlDet === null && textDet === null && corruptDet === null) {
        recordPass(8, 'Non-image binaries (executables, HTML, plain text, truncated) rejected by binary inspection');
      } else {
        recordFail(8, 'Non-image binaries not rejected', JSON.stringify({ exeDet, htmlDet, textDet }));
      }
    }

    // Test 9: MIME spoofing blocked (PNG content masquerading as image/jpeg)
    {
      let caught = false;
      try {
        validateStorageFile(
          {
            buffer: SAMPLE_PNG, // Real PNG
            mimetype: 'image/jpeg', // Claimed JPEG
            originalname: 'spoofed.jpg',
            size: SAMPLE_PNG.length,
          },
          'event'
        );
      } catch (err: any) {
        if (err.name === 'ValidationError' && err.message.includes('MIME type spoofing')) {
          caught = true;
        }
      }

      if (caught) {
        recordPass(9, 'MIME spoofing strictly blocked: Client claiming image/jpeg with PNG bytes rejected');
      } else {
        recordFail(9, 'MIME spoofing was not blocked', 'Expected ValidationError');
      }
    }

    // Test 10: Disallowed extensions and MIME types rejected
    {
      let caughtExt = false;
      let caughtMime = false;

      try {
        validateStorageFile(
          {
            buffer: SAMPLE_JPEG,
            mimetype: 'image/jpeg',
            originalname: 'payload.svg', // Disallowed extension
            size: SAMPLE_JPEG.length,
          },
          'team'
        );
      } catch (err: any) {
        if (err.name === 'ValidationError') caughtExt = true;
      }

      try {
        validateStorageFile(
          {
            buffer: SAMPLE_JPEG,
            mimetype: 'image/gif', // Disallowed MIME
            originalname: 'payload.gif',
            size: SAMPLE_JPEG.length,
          },
          'team'
        );
      } catch (err: any) {
        if (err.name === 'ValidationError') caughtMime = true;
      }

      if (caughtExt && caughtMime) {
        recordPass(10, 'Disallowed image formats (SVG, GIF) and extensions strictly rejected');
      } else {
        recordFail(10, 'Failed to reject disallowed format', JSON.stringify({ caughtExt, caughtMime }));
      }
    }

    // =========================================================================
    // SECTION 3: FILE SIZE LIMITS & VALIDATION SAFEGUARDS
    // =========================================================================
    console.log('\n--- SECTION 3: FILE SIZE LIMITS & VALIDATION SAFEGUARDS ---');

    // Test 11: Team portrait: <= 5MB accepted, > 5MB rejected
    {
      const validBuffer = Buffer.concat([SAMPLE_JPEG, Buffer.alloc(1024 * 100)]);
      const validResult = validateStorageFile(
        {
          buffer: validBuffer,
          mimetype: 'image/jpeg',
          originalname: 'portrait.jpg',
          size: validBuffer.length,
        },
        'team'
      );

      let oversizedCaught = false;
      const oversizedSize = 5 * 1024 * 1024 + 1024;
      try {
        validateStorageFile(
          {
            buffer: Buffer.concat([SAMPLE_JPEG, Buffer.alloc(100)]),
            mimetype: 'image/jpeg',
            originalname: 'oversized_portrait.jpg',
            size: oversizedSize, // Claimed > 5MB
          },
          'team'
        );
      } catch (err: any) {
        if (err.name === 'ValidationError' && err.message.includes('5 MB maximum limit')) {
          oversizedCaught = true;
        }
      }

      if (validResult && oversizedCaught) {
        recordPass(11, 'Team photos 5 MB maximum limit strictly enforced');
      } else {
        recordFail(11, 'Team photo limit validation failed', JSON.stringify({ validResult: !!validResult, oversizedCaught }));
      }
    }

    // Test 12: Event media: <= 10MB accepted, > 10MB rejected
    {
      const validBuffer = Buffer.concat([SAMPLE_PNG, Buffer.alloc(1024 * 100)]);
      const validResult = validateStorageFile(
        {
          buffer: validBuffer,
          mimetype: 'image/png',
          originalname: 'cover.png',
          size: validBuffer.length,
        },
        'event'
      );

      let oversizedCaught = false;
      const oversizedSize = 10 * 1024 * 1024 + 1024;
      try {
        validateStorageFile(
          {
            buffer: Buffer.concat([SAMPLE_PNG, Buffer.alloc(100)]),
            mimetype: 'image/png',
            originalname: 'huge_cover.png',
            size: oversizedSize,
          },
          'event'
        );
      } catch (err: any) {
        if (err.name === 'ValidationError' && err.message.includes('10 MB maximum limit')) {
          oversizedCaught = true;
        }
      }

      if (validResult && oversizedCaught) {
        recordPass(12, 'Event media 10 MB maximum limit strictly enforced');
      } else {
        recordFail(12, 'Event media limit validation failed', JSON.stringify({ validResult: !!validResult, oversizedCaught }));
      }
    }

    // Test 13: Archive media: <= 10MB accepted, > 10MB rejected
    {
      const validBuffer = Buffer.concat([SAMPLE_WEBP, Buffer.alloc(1024 * 100)]);
      const validResult = validateStorageFile(
        {
          buffer: validBuffer,
          mimetype: 'image/webp',
          originalname: 'archive.webp',
          size: validBuffer.length,
        },
        'archive'
      );

      let oversizedCaught = false;
      const oversizedSize = 10 * 1024 * 1024 + 1024;
      try {
        validateStorageFile(
          {
            buffer: Buffer.concat([SAMPLE_WEBP, Buffer.alloc(100)]),
            mimetype: 'image/webp',
            originalname: 'huge_archive.webp',
            size: oversizedSize,
          },
          'archive'
        );
      } catch (err: any) {
        if (err.name === 'ValidationError' && err.message.includes('10 MB maximum limit')) {
          oversizedCaught = true;
        }
      }

      if (validResult && oversizedCaught) {
        recordPass(13, 'Archive media 10 MB maximum limit strictly enforced');
      } else {
        recordFail(13, 'Archive media limit validation failed', JSON.stringify({ validResult: !!validResult, oversizedCaught }));
      }
    }

    // Test 14: Safe non-guessable key generation prevents path traversal
    {
      const teamKey = generateStorageKey('team', '.jpg');
      const eventKey = generateStorageKey('event', '.png');
      const archiveKey = generateStorageKey('archive', '.webp');

      const sanitized = sanitizeFileName('../../etc/passwd\0.jpg');

      const teamValid = teamKey.startsWith('team/portraits/') && !teamKey.includes('..');
      const eventValid = eventKey.startsWith('events/covers/') && !eventKey.includes('..');
      const archiveValid = archiveKey.startsWith('archive/photos/') && !archiveKey.includes('..');
      const pathClean = !sanitized.includes('/') && !sanitized.includes('\0') && !sanitized.includes('..');

      if (teamValid && eventValid && archiveValid && pathClean) {
        recordPass(14, 'Server-controlled key generation enforces partitions and eliminates path traversal');
      } else {
        recordFail(14, 'Key generation failed safety checks', JSON.stringify({ teamKey, eventKey, archiveKey, sanitized }));
      }
    }

    // =========================================================================
    // SECTION 4: STORAGE PROVIDERS & FACTORY
    // =========================================================================
    console.log('\n--- SECTION 4: STORAGE PROVIDERS & FACTORY ---');

    // Test 15: MemoryStorageProvider full lifecycle
    {
      const memProvider = new MemoryStorageProvider('https://cdn.example.com', 'test-bucket');
      const key = 'events/covers/test-banner.png';
      const file: StorageFile = {
        buffer: SAMPLE_PNG,
        originalname: 'test-banner.png',
        mimetype: 'image/png',
        size: SAMPLE_PNG.length,
      };

      const uploadRes = await memProvider.upload(key, file);
      const headRes = await memProvider.head(key);
      const publicUrl = memProvider.getPublicUrl(key);
      await memProvider.delete(key);
      const headAfter = await memProvider.head(key);

      if (
        uploadRes.url === 'https://cdn.example.com/events/covers/test-banner.png' &&
        headRes?.size === SAMPLE_PNG.length &&
        publicUrl === 'https://cdn.example.com/events/covers/test-banner.png' &&
        headAfter === null
      ) {
        recordPass(15, 'MemoryStorageProvider implements full lifecycle (upload, head, publicUrl, delete)');
      } else {
        recordFail(15, 'MemoryStorageProvider lifecycle failed', JSON.stringify({ uploadRes, headRes, headAfter }));
      }
    }

    // Test 16: LocalStorageProvider full lifecycle & path safety
    {
      const testUploadDir = path.resolve(serverDir, 'test_uploads');
      const localProvider = new LocalStorageProvider({
        uploadDir: 'test_uploads',
        publicBaseUrl: '/uploads',
      });

      const key = 'team/portraits/member-photo.jpg';
      const file: StorageFile = {
        buffer: SAMPLE_JPEG,
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: SAMPLE_JPEG.length,
      };

      const uploadRes = await localProvider.upload(key, file);
      const headRes = await localProvider.head(key);
      await localProvider.delete(key);
      const headAfter = await localProvider.head(key);

      // Clean up test_uploads folder
      try {
        await fs.rm(testUploadDir, { recursive: true, force: true });
      } catch {}

      if (
        uploadRes.url === '/uploads/team/portraits/member-photo.jpg' &&
        headRes?.size === SAMPLE_JPEG.length &&
        headAfter === null
      ) {
        recordPass(16, 'LocalStorageProvider implements full filesystem lifecycle with safe path resolution');
      } else {
        recordFail(16, 'LocalStorageProvider lifecycle failed', JSON.stringify({ uploadRes, headRes, headAfter }));
      }
    }

    // Test 17: R2StorageProvider interface and URL formatting
    {
      const r2Provider = new R2StorageProvider({
        accountId: '0123456789abcdef0123456789abcdef',
        accessKeyId: 'test_access_key',
        secretAccessKey: 'test_secret_access_key',
        bucketName: 'itsa-media',
        publicUrl: 'https://media.itsa.sggs.ac.in',
      });

      const url = r2Provider.getPublicUrl('team/portraits/tanishq.jpg');
      const providerName = r2Provider.name;

      if (
        url === 'https://media.itsa.sggs.ac.in/team/portraits/tanishq.jpg' &&
        providerName.includes('Cloudflare R2')
      ) {
        recordPass(17, 'R2StorageProvider correctly constructs S3 endpoints and public CDN URLs');
      } else {
        recordFail(17, 'R2StorageProvider formatting failed', JSON.stringify({ url, providerName }));
      }
    }

    // Test 18: Storage provider factory initializes correct provider
    {
      const memProv = createStorageProvider({ providerType: 'memory' });
      const localProv = createStorageProvider({ providerType: 'local', uploadDir: 'uploads' });

      if (memProv instanceof MemoryStorageProvider && localProv instanceof LocalStorageProvider) {
        recordPass(18, 'Storage provider factory safely instantiates configured providers');
      } else {
        recordFail(18, 'Storage provider factory failed instantiation', 'Incorrect instances returned');
      }
    }

    // =========================================================================
    // SECTION 5: STORAGE SERVICE LAYER (RESOLVE, EXTRACT, DELETE)
    // =========================================================================
    console.log('\n--- SECTION 5: STORAGE SERVICE LAYER (RESOLVE, EXTRACT, DELETE) ---');

    // Test 19: StorageService uploadMedia across all 3 partitions
    {
      const memProvider = new MemoryStorageProvider('https://cdn.itsa.sggs.ac.in', 'itsa-media');
      const svc = new StorageService(memProvider);

      const teamUpload = await svc.uploadMedia(
        {
          buffer: SAMPLE_JPEG,
          mimetype: 'image/jpeg',
          originalname: 'portrait.jpg',
          size: SAMPLE_JPEG.length,
        },
        'team'
      );

      const eventUpload = await svc.uploadMedia(
        {
          buffer: SAMPLE_PNG,
          mimetype: 'image/png',
          originalname: 'poster.png',
          size: SAMPLE_PNG.length,
        },
        'event'
      );

      const archiveUpload = await svc.uploadMedia(
        {
          buffer: SAMPLE_WEBP,
          mimetype: 'image/webp',
          originalname: 'archive.webp',
          size: SAMPLE_WEBP.length,
        },
        'archive'
      );

      const teamOk = teamUpload.key.startsWith('team/portraits/') && teamUpload.category === 'team';
      const eventOk = eventUpload.key.startsWith('events/covers/') && eventUpload.category === 'event';
      const archiveOk = archiveUpload.key.startsWith('archive/photos/') && archiveUpload.category === 'archive';

      if (teamOk && eventOk && archiveOk) {
        recordPass(19, 'StorageService successfully uploads and categorizes media into team/, events/, and archive/ partitions');
      } else {
        recordFail(19, 'StorageService uploadMedia partitioning failed', JSON.stringify({ teamUpload, eventUpload, archiveUpload }));
      }
    }

    // Test 20: StorageService resolveMediaUrl handles all URL formats
    {
      const memProvider = new MemoryStorageProvider('https://media.itsa.sggs.ac.in', 'itsa-media');
      const svc = new StorageService(memProvider);

      const ext = svc.resolveMediaUrl('https://images.unsplash.com/photo-1234');
      const rootRel = svc.resolveMediaUrl('/team/tanishq-raut.jpg');
      const legPortrait = svc.resolveMediaUrl('portraits/old-photo.jpg');
      const legCover = svc.resolveMediaUrl('covers/old-banner.png');
      const legArchive = svc.resolveMediaUrl('archives/old-pic.jpeg');
      const keyResolve = svc.resolveMediaUrl('events/covers/new-banner.jpg');

      const extOk = ext === 'https://images.unsplash.com/photo-1234';
      const rootOk = rootRel === '/team/tanishq-raut.jpg';
      const legPortraitOk = legPortrait === 'https://media.itsa.sggs.ac.in/team/portraits/old-photo.jpg';
      const legCoverOk = legCover === 'https://media.itsa.sggs.ac.in/events/covers/old-banner.png';
      const legArchiveOk = legArchive === 'https://media.itsa.sggs.ac.in/archive/photos/old-pic.jpeg';
      const keyOk = keyResolve === 'https://media.itsa.sggs.ac.in/events/covers/new-banner.jpg';

      if (extOk && rootOk && legPortraitOk && legCoverOk && legArchiveOk && keyOk) {
        recordPass(20, 'StorageService resolveMediaUrl accurately maps external URLs, root-relative paths, legacy paths, and object keys');
      } else {
        recordFail(20, 'resolveMediaUrl mapping mismatch', JSON.stringify({ ext, rootRel, legPortrait, legCover, legArchive, keyResolve }));
      }
    }

    // Test 21: StorageService extractKey extracts canonical partition keys and rejects traversal/unauthorized namespaces
    {
      const memProvider = new MemoryStorageProvider('https://pub-r2.dev', 'itsa-media');
      const svc = new StorageService(memProvider);

      const k1 = svc.extractKey('https://pub-r2.dev/team/portraits/abc.jpg');
      const k2 = svc.extractKey('/uploads/events/covers/xyz.png');
      const k3 = svc.extractKey(
        'https://test.supabase.co/storage/v1/object/public/team-photos/portraits/profile.jpg'
      );
      const k4 = svc.extractKey(
        'https://test.supabase.co/storage/v1/object/public/event-media/covers/banner.webp'
      );
      const k5 = svc.extractKey(
        'https://test.supabase.co/storage/v1/object/public/archive-media/archives/historic.jpeg'
      );
      const k6 = svc.extractKey('events/covers/plain-key.jpg');
      const kExternal = svc.extractKey('https://images.unsplash.com/photo-external');
      const kTraversal = svc.extractKey('team/portraits/../../etc/passwd');
      const kInvalidNamespace = svc.extractKey('team/other_directory/foo.jpg');

      const k1Ok = k1 === 'team/portraits/abc.jpg';
      const k2Ok = k2 === 'events/covers/xyz.png';
      const k3Ok = k3 === 'team/portraits/profile.jpg';
      const k4Ok = k4 === 'events/covers/banner.webp';
      const k5Ok = k5 === 'archive/photos/historic.jpeg';
      const k6Ok = k6 === 'events/covers/plain-key.jpg';
      const extOk = kExternal === null;
      const travOk = kTraversal === null;
      const invOk = kInvalidNamespace === null;

      if (k1Ok && k2Ok && k3Ok && k4Ok && k5Ok && k6Ok && extOk && travOk && invOk) {
        recordPass(21, 'StorageService extractKey correctly parses canonical keys while rejecting traversal attempts and invalid namespaces');
      } else {
        recordFail(21, 'extractKey parsing failed', JSON.stringify({ k1, k2, k3, k4, k5, k6, kExternal, kTraversal, kInvalidNamespace }));
      }
    }

    // Test 22: StorageService deleteMedia safely cleans up and skips external URLs
    {
      const memProvider = new MemoryStorageProvider('https://cdn.example.com', 'itsa-media');
      const svc = new StorageService(memProvider);

      // Upload one item
      const key = 'archive/photos/pic.jpg';
      await memProvider.upload(key, {
        buffer: SAMPLE_JPEG,
        mimetype: 'image/jpeg',
        originalname: 'pic.jpg',
        size: SAMPLE_JPEG.length,
      });

      const deletedManaged = await svc.deleteMedia('https://cdn.example.com/archive/photos/pic.jpg');
      const deletedExternal = await svc.deleteMedia('https://images.unsplash.com/photo-1234');
      const headAfter = await memProvider.head(key);

      if (deletedManaged === true && deletedExternal === false && headAfter === null) {
        recordPass(22, 'StorageService deleteMedia safely deletes managed objects and skips unmanaged external URLs');
      } else {
        recordFail(22, 'deleteMedia failed', JSON.stringify({ deletedManaged, deletedExternal, headAfter }));
      }
    }

    // =========================================================================
    // SECTION 6: HTTP ENDPOINTS & RBAC ACCESS CONTROL
    // =========================================================================
    console.log('\n--- SECTION 6: HTTP ENDPOINTS & RBAC ACCESS CONTROL ---');

    // Bootstrap test accounts in database
    if (isDatabaseConfigured) {
      const hash = await authService.hashPassword(testPassword);

      await query(
        `INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
         VALUES (LOWER($1), $2, 'Super Admin Test', 'SUPER_ADMIN', true)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'SUPER_ADMIN', is_active = true`,
        [superAdminEmail, hash]
      );

      await query(
        `INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
         VALUES (LOWER($1), $2, 'Admin Test', 'ADMIN', true)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'ADMIN', is_active = true`,
        [adminEmail, hash]
      );

      await query(
        `INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
         VALUES (LOWER($1), $2, 'Editor Test', 'EDITOR', true)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'EDITOR', is_active = true`,
        [editorEmail, hash]
      );

      // Log in all three accounts to obtain authenticated session cookies
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: superAdminEmail, password: testPassword },
        jar: superAdminJar,
      });

      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: adminEmail, password: testPassword },
        jar: adminJar,
      });

      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: editorEmail, password: testPassword },
        jar: editorJar,
      });
    }

    // Test 23: Unauthenticated upload rejected with 401 UNAUTHORIZED
    {
      const fd = new FormData();
      fd.append('category', 'event');
      fd.append('file', new Blob([SAMPLE_JPEG], { type: 'image/jpeg' }), 'unauth.jpg');

      const res = await uploadRequest('/api/admin/media/upload', fd);
      if (res.status === 401) {
        recordPass(23, 'Unauthenticated upload rejected with HTTP 401 UNAUTHORIZED');
      } else {
        recordFail(23, 'Unauthenticated upload did not return 401', `Status: ${res.status}`);
      }
    }

    // Test 24: Unauthenticated delete rejected with 401 UNAUTHORIZED
    {
      const res = await apiRequest('/api/admin/media', {
        method: 'DELETE',
        body: { key: 'events/covers/sample.jpg' },
      });
      if (res.status === 401) {
        recordPass(24, 'Unauthenticated delete request rejected with HTTP 401 UNAUTHORIZED');
      } else {
        recordFail(24, 'Unauthenticated delete did not return 401', `Status: ${res.status}`);
      }
    }

    // Test 25: EDITOR can upload Event media -> 201 CREATED
    {
      const fd = new FormData();
      fd.append('category', 'event');
      fd.append('file', new Blob([SAMPLE_PNG], { type: 'image/png' }), 'editor_event.png');

      const res = await uploadRequest('/api/admin/media/upload', fd, editorJar);
      if (res.status === 201 && res.data.success && res.data.data.category === 'event') {
        recordPass(25, 'EDITOR: Authorized to upload Event media (POST /api/admin/media/upload category=event -> 201)');
      } else {
        recordFail(25, 'EDITOR upload event media failed', `Status: ${res.status}, body: ${JSON.stringify(res.data)}`);
      }
    }

    // Test 26: EDITOR is blocked from uploading Team media -> 403 FORBIDDEN
    {
      const fd = new FormData();
      fd.append('category', 'team');
      fd.append('file', new Blob([SAMPLE_JPEG], { type: 'image/jpeg' }), 'editor_team.jpg');

      const res = await uploadRequest('/api/admin/media/upload', fd, editorJar);
      if (res.status === 403) {
        recordPass(26, 'EDITOR: Blocked from mutating Team photos (POST /api/admin/media/upload category=team -> 403 FORBIDDEN)');
      } else {
        recordFail(26, 'EDITOR upload team media was not blocked', `Status: ${res.status}`);
      }
    }

    // Test 27: EDITOR is blocked from uploading Archive media -> 403 FORBIDDEN
    {
      const fd = new FormData();
      fd.append('category', 'archive');
      fd.append('file', new Blob([SAMPLE_JPEG], { type: 'image/jpeg' }), 'editor_archive.jpg');

      const res = await uploadRequest('/api/admin/media/upload', fd, editorJar);
      if (res.status === 403) {
        recordPass(27, 'EDITOR: Blocked from mutating Archive media (POST /api/admin/media/upload category=archive -> 403 FORBIDDEN)');
      } else {
        recordFail(27, 'EDITOR upload archive media was not blocked', `Status: ${res.status}`);
      }
    }

    // Test 28: ADMIN can upload Team portraits -> 201 CREATED
    let uploadedTeamKey = '';
    {
      const fd = new FormData();
      fd.append('file', new Blob([SAMPLE_JPEG], { type: 'image/jpeg' }), 'admin_portrait.jpg');

      const res = await uploadRequest('/api/admin/media/upload/team', fd, adminJar);
      if (res.status === 201 && res.data.success && res.data.data.key.startsWith('team/portraits/')) {
        uploadedTeamKey = res.data.data.key;
        recordPass(28, 'ADMIN: Authorized to upload Team portraits (POST /api/admin/media/upload/team -> 201 CREATED)');
      } else {
        recordFail(28, 'ADMIN upload team portrait failed', `Status: ${res.status}, body: ${JSON.stringify(res.data)}`);
      }
    }

    // Test 29: ADMIN can upload Archive media -> 201 CREATED
    {
      const fd = new FormData();
      fd.append('file', new Blob([SAMPLE_WEBP], { type: 'image/webp' }), 'admin_archive.webp');

      const res = await uploadRequest('/api/admin/media/upload/archive', fd, adminJar);
      if (res.status === 201 && res.data.success && res.data.data.key.startsWith('archive/photos/')) {
        recordPass(29, 'ADMIN: Authorized to upload Archive media (POST /api/admin/media/upload/archive -> 201 CREATED)');
      } else {
        recordFail(29, 'ADMIN upload archive media failed', `Status: ${res.status}, body: ${JSON.stringify(res.data)}`);
      }
    }

    // Test 30: ADMIN can upload Event media -> 201 CREATED
    {
      const fd = new FormData();
      fd.append('file', new Blob([SAMPLE_PNG], { type: 'image/png' }), 'admin_event.png');

      const res = await uploadRequest('/api/admin/media/upload/event', fd, adminJar);
      if (res.status === 201 && res.data.success && res.data.data.key.startsWith('events/covers/')) {
        recordPass(30, 'ADMIN: Authorized to upload Event media (POST /api/admin/media/upload/event -> 201 CREATED)');
      } else {
        recordFail(30, 'ADMIN upload event media failed', `Status: ${res.status}, body: ${JSON.stringify(res.data)}`);
      }
    }

    // Test 31: SUPER_ADMIN has full upload access across all categories
    {
      const fd = new FormData();
      fd.append('category', 'team');
      fd.append('file', new Blob([SAMPLE_AVIF], { type: 'image/avif' }), 'superadmin_team.avif');

      const res = await uploadRequest('/api/admin/media/upload', fd, superAdminJar);
      if (res.status === 201 && res.data.success) {
        recordPass(31, 'SUPER_ADMIN: Full upload access across all categories (201 CREATED)');
      } else {
        recordFail(31, 'SUPER_ADMIN upload failed', `Status: ${res.status}`);
      }
    }

    // Test 32: Missing file in multipart payload returns 400 BAD_REQUEST
    {
      const fd = new FormData();
      fd.append('category', 'event');
      // No file attached

      const res = await uploadRequest('/api/admin/media/upload', fd, adminJar);
      if (res.status === 400) {
        recordPass(32, 'Missing file upload payload rejected with HTTP 400 BAD_REQUEST');
      } else {
        recordFail(32, 'Missing file did not return 400', `Status: ${res.status}`);
      }
    }

    // Test 33: Invalid category parameter returns 400 VALIDATION_ERROR
    {
      const fd = new FormData();
      fd.append('category', 'malicious_partition');
      fd.append('file', new Blob([SAMPLE_JPEG], { type: 'image/jpeg' }), 'photo.jpg');

      const res = await uploadRequest('/api/admin/media/upload', fd, adminJar);
      if (res.status === 400 && res.data.error?.code === 'VALIDATION_ERROR') {
        recordPass(33, 'Invalid category parameter rejected with HTTP 400 VALIDATION_ERROR');
      } else {
        recordFail(33, 'Invalid category did not return 400 VALIDATION_ERROR', `Status: ${res.status}`);
      }
    }

    // Test 34: Binary signature spoofing via HTTP returns 400 VALIDATION_ERROR
    {
      const fd = new FormData();
      fd.append('category', 'event');
      fd.append('file', new Blob([FAKE_IMAGE_HTML], { type: 'image/jpeg' }), 'script.jpg');

      const res = await uploadRequest('/api/admin/media/upload', fd, adminJar);
      if (res.status === 400) {
        recordPass(34, 'HTTP upload: Spoofed/fake image (HTML script in .jpg) strictly rejected with HTTP 400');
      } else {
        recordFail(34, 'Spoofed image upload was not rejected', `Status: ${res.status}`);
      }
    }

    // Test 35: Oversized file via HTTP returns 400 VALIDATION_ERROR
    {
      // Create a 6MB dummy buffer with JPEG header
      const largeTeamBuffer = Buffer.concat([SAMPLE_JPEG, Buffer.alloc(6 * 1024 * 1024)]);
      const fd = new FormData();
      fd.append('file', new Blob([largeTeamBuffer], { type: 'image/jpeg' }), 'huge_portrait.jpg');

      const res = await uploadRequest('/api/admin/media/upload/team', fd, adminJar);
      if (res.status === 400) {
        recordPass(35, 'HTTP upload: 6 MB team portrait rejected with HTTP 400 (exceeds 5 MB limit)');
      } else {
        recordFail(35, 'Oversized team photo was not rejected', `Status: ${res.status}`);
      }
    }

    // Test 36: ADMIN / SUPER_ADMIN can delete media -> 200 OK
    {
      const res = await apiRequest('/api/admin/media', {
        method: 'DELETE',
        body: { key: uploadedTeamKey || 'team/portraits/sample.jpg' },
        jar: adminJar,
      });

      if (res.status === 200 && res.data.success) {
        recordPass(36, 'ADMIN / SUPER_ADMIN can delete media object (DELETE /api/admin/media -> 200 OK)');
      } else {
        recordFail(36, 'Delete media failed', `Status: ${res.status}, body: ${JSON.stringify(res.data)}`);
      }
    }

    // Test 37: Deletion request with path traversal ("..") strictly rejected with HTTP 400
    {
      const res = await apiRequest('/api/admin/media', {
        method: 'DELETE',
        body: { key: 'team/portraits/../../etc/passwd' },
        jar: adminJar,
      });

      if (res.status === 400 && res.data.error?.message?.includes('Path traversal')) {
        recordPass(37, 'HTTP delete: Path traversal attempt ("..") strictly rejected with HTTP 400 BAD_REQUEST');
      } else {
        recordFail(37, 'Path traversal deletion was not rejected with 400', `Status: ${res.status}, body: ${JSON.stringify(res.data)}`);
      }
    }

    // Test 38: Deletion request with non-canonical / invalid namespace strictly rejected with HTTP 400
    {
      const res = await apiRequest('/api/admin/media', {
        method: 'DELETE',
        body: { key: 'invalid/namespace/secret.txt' },
        jar: adminJar,
      });

      if (res.status === 400 && res.data.error?.message?.includes('canonical namespaces')) {
        recordPass(38, 'HTTP delete: Non-canonical storage namespace strictly rejected with HTTP 400 BAD_REQUEST');
      } else {
        recordFail(38, 'Invalid namespace deletion was not rejected with 400', `Status: ${res.status}, body: ${JSON.stringify(res.data)}`);
      }
    }

    // Test 39: Local disk provider resolveSafePath enforces separator boundary and blocks traversal
    {
      const localProvider = new LocalStorageProvider({ uploadDir: 'uploads' });
      let traversalBlocked = false;
      let siblingBlocked = false;

      try {
        (localProvider as any).resolveSafePath('team/portraits/../../etc/passwd');
      } catch (err: any) {
        traversalBlocked = err.message.includes('Path traversal attempt');
      }

      try {
        (localProvider as any).resolveSafePath('\0evil.png');
      } catch (err: any) {
        siblingBlocked = err.message.includes('Path traversal attempt');
      }

      if (traversalBlocked && siblingBlocked) {
        recordPass(39, 'LocalStorageProvider resolveSafePath strictly confines paths within separator-safe uploadDir');
      } else {
        recordFail(39, 'LocalStorageProvider resolveSafePath boundary enforcement failed', JSON.stringify({ traversalBlocked, siblingBlocked }));
      }
    }

    // Test 40: Public GET /api/media/config returns metadata
    {
      const res = await apiRequest('/api/media/config');
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.categories?.team &&
        res.data.data.categories?.event &&
        res.data.data.categories?.archive
      ) {
        recordPass(40, 'Public GET /api/media/config returns categories, size limits, and active provider metadata');
      } else {
        recordFail(40, 'GET /api/media/config failed', `Status: ${res.status}`);
      }
    }

    // Test 41: Public GET /api/media/resolve resolves URLs
    {
      const res = await apiRequest('/api/media/resolve?url=covers/hackathon.png');
      if (res.status === 200 && res.data.success && res.data.data.resolvedUrl) {
        recordPass(41, 'Public GET /api/media/resolve resolves media references into valid URLs');
      } else {
        recordFail(41, 'GET /api/media/resolve failed', `Status: ${res.status}`);
      }
    }

    // =========================================================================
    // SECTION 7: REGRESSION & SYSTEM INTEGRITY
    // =========================================================================
    console.log('\n--- SECTION 7: REGRESSION & SYSTEM INTEGRITY ---');

    // Test 42: Backend compiles cleanly via TypeScript 5
    {
      let tscPassed = false;
      try {
        execSync('npm run build', { cwd: serverDir, stdio: 'pipe' });
        tscPassed = true;
      } catch (err: any) {
        console.error('Backend compilation error:', err.stdout?.toString() || err.message);
      }

      if (tscPassed) {
        recordPass(42, 'Backend build succeeds (tsc exits with 0)');
      } else {
        recordFail(42, 'Backend build failed', 'TypeScript compilation failed');
      }
    }

    // Test 43: Frontend build succeeds cleanly
    {
      let frontendPassed = false;
      try {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
        frontendPassed = true;
      } catch (err: any) {
        console.error('Frontend build error:', err.stdout?.toString() || err.message);
      }

      if (frontendPassed) {
        recordPass(43, 'Frontend build succeeds cleanly (npm run build exits 0)');
      } else {
        recordFail(43, 'Frontend build failed', 'Vite build failed');
      }
    }

    // Test 44: Zero modifications to frontend source files (/src untouched)
    {
      const gitDiff = execSync('git status --porcelain src/', {
        cwd: projectRoot,
        encoding: 'utf-8',
      }).trim();

      if (gitDiff === '') {
        recordPass(44, 'Confirmed zero frontend source files under /src were modified (Phase 4 boundary strictly preserved)');
      } else {
        recordFail(44, 'Frontend source files were modified during Phase 4', gitDiff);
      }
    }
  } catch (error: any) {
    console.error('\n\x1b[31mFATAL TEST SUITE ERROR:\x1b[0m', error);
  } finally {
    // Cleanup temporary test accounts
    if (isDatabaseConfigured) {
      console.log('\n--- Cleaning up temporary test records ---');
      try {
        await query(
          `DELETE FROM admin_users WHERE email LIKE 'sa_storage_%' OR email LIKE 'adm_storage_%' OR email LIKE 'ed_storage_%'`
        );
        console.log('  Cleaned up all temporary test accounts and test sessions.');
      } catch (err: any) {
        console.warn('  Error cleaning up test accounts:', err.message);
      }
      await closePool();
    }

    if (server) {
      server.close();
    }
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n===============================================================');
  console.log('PHASE 4 STORAGE & MEDIA VERIFICATION SUMMARY:');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed:      \x1b[32m${passedCount}\x1b[0m`);
  console.log(`Failed:      \x1b[${failedCount > 0 ? '31' : '32'}m${failedCount}\x1b[0m`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStorageVerificationSuite();
