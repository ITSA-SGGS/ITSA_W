/**
 * ITSA Platform — Object Storage Validation & Sanitization
 * Phase 4: Storage & Media Migration
 */

import crypto from 'crypto';
import path from 'path';
import { StorageCategory, StorageCategoryConfig, StorageFile } from './types.js';
import { ValidationError } from '../utils/errors.js';

export const CATEGORY_CONFIGS: Record<StorageCategory, StorageCategoryConfig> = {
  team: {
    category: 'team',
    prefix: 'team/portraits/',
    legacyBucket: 'team-photos',
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
    description: 'Committee and faculty member portrait photos',
  },
  event: {
    category: 'event',
    prefix: 'events/covers/',
    legacyBucket: 'event-media',
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
    description: 'Event cover images, posters, and media banners',
  },
  archive: {
    category: 'archive',
    prefix: 'archive/photos/',
    legacyBucket: 'archive-media',
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
    description: 'Historical archive photographs and gallery records',
  },
};

/**
 * Normalizes user-supplied category string to valid StorageCategory
 */
export function normalizeCategory(input: unknown): StorageCategory {
  if (typeof input !== 'string') {
    throw new ValidationError('Storage category is required and must be a string.');
  }

  const clean = input.trim().toLowerCase().replace(/[_\s]+/g, '-');

  if (clean === 'team' || clean === 'team-photos' || clean === 'portraits') {
    return 'team';
  }
  if (clean === 'event' || clean === 'events' || clean === 'event-media' || clean === 'covers') {
    return 'event';
  }
  if (clean === 'archive' || clean === 'archives' || clean === 'archive-media' || clean === 'photos') {
    return 'archive';
  }

  throw new ValidationError(
    `Invalid storage category: "${input}". Allowed categories are: "team", "event", "archive".`
  );
}

/**
 * Resolves StorageCategory from an object key prefix.
 */
export function resolveCategoryFromKey(key: string): StorageCategory {
  if (key.startsWith('team/portraits/') || key.startsWith('team/')) return 'team';
  if (key.startsWith('events/covers/') || key.startsWith('events/')) return 'event';
  if (key.startsWith('archive/photos/') || key.startsWith('archive/')) return 'archive';
  return 'event';
}

/**
 * Detects image MIME type from binary magic bytes.
 * Never trusts client-provided Content-Type or file extension alone.
 */
export function detectImageMimeType(
  buffer: Buffer
): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 3. WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // 4. AVIF: ISOBMFF box with 'ftyp' at bytes 4-8, with brand 'avif' or 'avis'
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis') {
      return 'image/avif';
    }
    // Check compatible brands in the ftyp box
    const boxLength = buffer.readUInt32BE(0);
    const checkLength = Math.min(boxLength, buffer.length, 64);
    for (let offset = 12; offset + 4 <= checkLength; offset += 4) {
      const compatible = buffer.toString('ascii', offset, offset + 4);
      if (compatible === 'avif' || compatible === 'avis') {
        return 'image/avif';
      }
    }
  }

  return null;
}

/**
 * Sanitizes original filename to prevent path traversal, control chars, and shell injection.
 */
export function sanitizeFileName(name: string): string {
  if (!name) return 'media';
  // Strip null bytes, path traversal, slashes, backslashes
  const basename = path.basename(name).replace(/\0/g, '');
  // Keep only alphanumeric, dashes, dots, and underscores
  const cleaned = basename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return cleaned.length > 0 ? cleaned : 'media';
}

/**
 * Generates a non-guessable, collision-free, timestamped object key.
 * Enforces server-controlled path prefix and safe extension.
 */
export function generateStorageKey(category: StorageCategory, extension: string): string {
  const config = CATEGORY_CONFIGS[category];
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString('hex');
  const safeExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  return `${config.prefix}${timestamp}-${randomHex}${safeExt}`;
}

export interface ValidatedFileResult {
  category: StorageCategory;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
  extension: string;
  key: string;
  size: number;
}

/**
 * Validates a file against category constraints and binary signatures.
 * Rejects oversized files, unsupported formats, spoofed MIME types, and path traversal.
 */
export function validateStorageFile(
  file: StorageFile,
  category: StorageCategory
): ValidatedFileResult {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new ValidationError('File payload is empty or missing.');
  }

  const config = CATEGORY_CONFIGS[category];

  // 1. Size Validation
  const maxMb = Math.round(config.maxSizeBytes / (1024 * 1024));
  if (file.size > config.maxSizeBytes || file.buffer.length > config.maxSizeBytes) {
    const actualMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new ValidationError(
      `File size (${actualMb} MB) exceeds the ${maxMb} MB maximum limit for ${config.description.toLowerCase()}.`
    );
  }

  // 2. Client MIME Type Whitelist Check
  const clientMime = (file.mimetype || '').toLowerCase().trim();
  if (!config.allowedMimeTypes.includes(clientMime)) {
    throw new ValidationError(
      `Unsupported MIME type: "${file.mimetype}". Allowed types are: ${config.allowedMimeTypes.join(', ')}.`
    );
  }

  // 3. File Extension Whitelist Check
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    throw new ValidationError(
      `Unsupported file extension: "${ext}". Allowed extensions are: ${config.allowedExtensions.join(', ')}.`
    );
  }

  // 4. Binary Magic Bytes Verification (Do NOT trust client headers alone!)
  const detectedMime = detectImageMimeType(file.buffer);
  if (!detectedMime) {
    throw new ValidationError(
      'Invalid file content: The uploaded file does not match any recognized valid image signature (JPEG, PNG, WebP, AVIF).'
    );
  }

  // 5. Cross-check client claimed MIME against detected magic bytes
  if (detectedMime !== clientMime) {
    throw new ValidationError(
      `MIME type spoofing detected: Claimed "${clientMime}" does not match verified binary signature "${detectedMime}".`
    );
  }

  // 6. Generate server-controlled safe object key
  const finalExt = ext === '.jpeg' ? '.jpg' : ext;
  const key = generateStorageKey(category, finalExt);

  return {
    category,
    mimeType: detectedMime,
    extension: finalExt,
    key,
    size: file.size,
  };
}
