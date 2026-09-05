/**
 * ITSA Platform — Object Storage Service Abstraction
 * Phase 4: Storage & Media Migration
 */

import {
  IStorageProvider,
  StorageCategory,
  StorageCategoryConfig,
  StorageFile,
  StorageUploadResult,
  UploadOptions,
  CANONICAL_STORAGE_NAMESPACES,
} from './types.js';
import {
  CATEGORY_CONFIGS,
  normalizeCategory,
  validateStorageFile,
} from './validation.js';
import { createStorageProvider } from './providers/factory.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

export class StorageService {
  constructor(private readonly provider: IStorageProvider) {}

  public getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Validates and uploads media file into category partition.
   * Generates safe key, checks file limits and magic byte signatures.
   */
  public async uploadMedia(
    file: StorageFile,
    rawCategory: unknown,
    options?: UploadOptions
  ): Promise<StorageUploadResult> {
    const category = normalizeCategory(rawCategory);
    const validated = validateStorageFile(file, category);

    logger.info(
      `Uploading ${validated.category} media (${(validated.size / 1024).toFixed(1)} KB) using provider "${this.provider.name}"`
    );

    const result = await this.provider.upload(validated.key, file, {
      ...options,
      contentType: validated.mimeType,
      cacheControl: options?.cacheControl || 'public, max-age=31536000, immutable',
    });

    logger.info(`Media uploaded successfully: Key="${result.key}", URL="${result.url}"`);
    return result;
  }

  /**
   * Checks whether a key starts with one of the allowed canonical namespaces:
   * - 'team/portraits/'
   * - 'events/covers/'
   * - 'archive/photos/'
   */
  public isCanonicalNamespace(key: string): boolean {
    return (
      key.startsWith('team/portraits/') ||
      key.startsWith('events/covers/') ||
      key.startsWith('archive/photos/')
    );
  }

  /**
   * Detects path traversal attempts, null bytes, backslashes, or encoded sequences.
   */
  public containsTraversal(input: string): boolean {
    if (!input) return false;
    if (input.includes('\0') || input.includes('\\')) {
      return true;
    }
    // Check for ".." segment or URL-encoded versions (%2e%2e, %2E%2E, %252e, etc.)
    if (/\.\.(?:\/|\\|$)/.test(input) || /(?:^|\/|\\)\.\./.test(input) || input.includes('..')) {
      return true;
    }
    if (/%2e|%252e/i.test(input)) {
      try {
        const decoded = decodeURIComponent(input);
        if (decoded.includes('..') || decoded.includes('\0') || decoded.includes('\\')) {
          return true;
        }
      } catch {
        return true; // malformed URI encoding is suspicious
      }
    }
    return false;
  }

  /**
   * Deletes a media object given either its storage key or full URL.
   * Rejects path traversal attempts. Gracefully returns false if unmanaged external/static asset.
   */
  public async deleteMedia(keyOrUrl: string): Promise<boolean> {
    if (!keyOrUrl || typeof keyOrUrl !== 'string') {
      return false;
    }

    if (this.containsTraversal(keyOrUrl)) {
      throw new ValidationError('Invalid storage path: Path traversal attempt detected.');
    }

    const key = this.extractKey(keyOrUrl);
    if (!key) {
      logger.info(`Skipping media deletion for unmanaged resource: "${keyOrUrl}"`);
      return false;
    }

    logger.info(`Deleting media object: Key="${key}"`);
    await this.provider.delete(key);
    return true;
  }

  /**
   * Resolves a stored media reference, key, or legacy Supabase URL to a public URL.
   */
  public resolveMediaUrl(keyOrUrl: string | null | undefined): string {
    if (!keyOrUrl) return '';
    const trimmed = keyOrUrl.trim();
    if (!trimmed) return '';

    // If it is already an absolute HTTP/HTTPS URL, return it directly
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Root-relative static paths (e.g. /team/tanishq-raut.jpg, /archive/photo.jpeg)
    if (trimmed.startsWith('/')) {
      return trimmed;
    }

    // Legacy relative path mappings
    if (trimmed.startsWith('portraits/')) {
      return this.provider.getPublicUrl(`team/${trimmed}`);
    }
    if (trimmed.startsWith('covers/')) {
      return this.provider.getPublicUrl(`events/${trimmed}`);
    }
    if (trimmed.startsWith('photos/')) {
      return this.provider.getPublicUrl(`archive/${trimmed}`);
    }
    if (trimmed.startsWith('archives/')) {
      return this.provider.getPublicUrl(`archive/photos/${trimmed.slice(9)}`);
    }

    // Standard storage key (e.g. team/portraits/..., events/covers/..., archive/photos/...)
    return this.provider.getPublicUrl(trimmed);
  }

  /**
   * Extracts clean storage key from R2 URLs, local upload URLs, legacy Supabase URLs, or raw keys.
   * Returns null if key cannot be determined (e.g. external link) or if traversal/invalid namespace.
   */
  public extractKey(keyOrUrl: string | null | undefined): string | null {
    if (!keyOrUrl) return null;
    const trimmed = keyOrUrl.trim();
    if (!trimmed) return null;

    // 0. Path traversal / malicious tokens rejection
    if (this.containsTraversal(trimmed)) {
      return null;
    }

    // 1. Local upload URL: /uploads/team/portraits/abc.jpg or http://.../uploads/...
    const localUploadMatch = trimmed.match(/(?:\/uploads\/|^uploads\/)(.+)$/);
    if (localUploadMatch && localUploadMatch[1]) {
      const subKey = localUploadMatch[1].replace(/^\/+/, '');
      if (this.isCanonicalNamespace(subKey)) {
        return subKey;
      }
    }

    // 2. Supabase Storage URL pattern:
    // https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const supabaseMatch = trimmed.match(
      /\/storage\/v1\/object\/public\/(team-photos|event-media|archive-media)\/(.+)$/
    );
    if (supabaseMatch) {
      const bucket = supabaseMatch[1];
      const subPath = supabaseMatch[2].replace(/^\/+/, '');
      if (bucket === 'team-photos') {
        const key = subPath.startsWith('portraits/') ? `team/${subPath}` : `team/portraits/${subPath}`;
        if (this.isCanonicalNamespace(key)) return key;
      }
      if (bucket === 'event-media') {
        const key = subPath.startsWith('covers/') ? `events/${subPath}` : `events/covers/${subPath}`;
        if (this.isCanonicalNamespace(key)) return key;
      }
      if (bucket === 'archive-media') {
        const cleanSubPath = subPath.startsWith('archives/')
          ? subPath.slice(9)
          : subPath.startsWith('photos/')
          ? subPath.slice(7)
          : subPath;
        const key = `archive/photos/${cleanSubPath}`;
        if (this.isCanonicalNamespace(key)) return key;
      }
    }

    // 3. Absolute URL with domain (e.g. R2 public CDN or S3 endpoint)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const parsed = new URL(trimmed);
        const pathname = parsed.pathname.replace(/^\/+/, '');
        // Check if pathname starts with a canonical namespace
        if (this.isCanonicalNamespace(pathname)) {
          return pathname;
        }
        // If pathname starts with bucket name e.g. /itsa-media/team/portraits/...
        const parts = pathname.split('/');
        if (parts.length > 1 && this.isCanonicalNamespace(parts.slice(1).join('/'))) {
          return parts.slice(1).join('/');
        }
      } catch {
        // Not a valid URL
      }
      return null;
    }

    // 4. Raw storage key starting with canonical namespace
    if (this.isCanonicalNamespace(trimmed)) {
      return trimmed;
    }

    // 5. Normalization for legacy keys e.g. archive/archives/ -> archive/photos/
    if (trimmed.startsWith('archive/archives/')) {
      const normalized = `archive/photos/${trimmed.slice(17)}`;
      if (this.isCanonicalNamespace(normalized)) return normalized;
    }

    // 6. Legacy relative storage paths
    if (trimmed.startsWith('portraits/')) {
      const key = `team/${trimmed}`;
      if (this.isCanonicalNamespace(key)) return key;
    }
    if (trimmed.startsWith('covers/')) {
      const key = `events/${trimmed}`;
      if (this.isCanonicalNamespace(key)) return key;
    }
    if (trimmed.startsWith('photos/')) {
      const key = `archive/${trimmed}`;
      if (this.isCanonicalNamespace(key)) return key;
    }
    if (trimmed.startsWith('archives/')) {
      const key = `archive/photos/${trimmed.slice(9)}`;
      if (this.isCanonicalNamespace(key)) return key;
    }

    return null;
  }

  public getCategoryConfig(category: StorageCategory): StorageCategoryConfig {
    return CATEGORY_CONFIGS[category];
  }

  public getAllCategoryConfigs(): Record<StorageCategory, StorageCategoryConfig> {
    return CATEGORY_CONFIGS;
  }

  public async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }
}

// Default singleton instance initialized with the configured provider
export const storageService = new StorageService(createStorageProvider());
