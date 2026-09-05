/**
 * ITSA Platform — Object Storage Abstraction Types
 * Phase 4: Storage & Media Migration
 */

export type StorageCategory = 'team' | 'event' | 'archive';
export type LegacyBucket = 'team-photos' | 'event-media' | 'archive-media';

export const CANONICAL_STORAGE_NAMESPACES = [
  'team/portraits/',
  'events/covers/',
  'archive/photos/',
] as const;

export type CanonicalStorageNamespace = (typeof CANONICAL_STORAGE_NAMESPACES)[number];

export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StorageUploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
  category: StorageCategory;
  createdAt: string;
}

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface StorageObjectMetadata {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
  eTag?: string;
}

export interface StorageCategoryConfig {
  category: StorageCategory;
  prefix: string;
  legacyBucket: LegacyBucket;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  description: string;
}

export interface IStorageProvider {
  readonly name: string;
  upload(key: string, file: StorageFile, options?: UploadOptions): Promise<StorageUploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  head(key: string): Promise<StorageObjectMetadata | null>;
  healthCheck(): Promise<boolean>;
}

export interface R2ProviderConfig {
  accountId?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
  endpoint?: string;
  region?: string;
}

export interface LocalProviderConfig {
  uploadDir: string;
  publicBaseUrl?: string;
  bucketName?: string;
}
