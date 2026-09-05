/**
 * ITSA Platform — In-Memory Storage Provider (Testing & Mock)
 * Phase 4: Storage & Media Migration
 */

import {
  IStorageProvider,
  StorageFile,
  StorageObjectMetadata,
  StorageUploadResult,
  UploadOptions,
  StorageCategory,
} from '../types.js';
import { resolveCategoryFromKey } from '../validation.js';

interface StoredObject {
  buffer: Buffer;
  mimeType: string;
  size: number;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export class MemoryStorageProvider implements IStorageProvider {
  public readonly name = 'In-Memory Storage (Mock)';
  private readonly storage = new Map<string, StoredObject>();
  private readonly baseUrl: string;
  private readonly bucketName: string;

  constructor(baseUrl: string = 'https://mock-r2.itsa.sggs.ac.in', bucketName: string = 'mock-bucket') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.bucketName = bucketName;
  }

  public async upload(
    key: string,
    file: StorageFile,
    options?: UploadOptions
  ): Promise<StorageUploadResult> {
    const contentType = options?.contentType || file.mimetype;
    this.storage.set(key, {
      buffer: Buffer.from(file.buffer),
      mimeType: contentType,
      size: file.size,
      lastModified: new Date(),
      metadata: options?.metadata,
    });

    const publicUrl = this.getPublicUrl(key);
    const category = resolveCategoryFromKey(key);

    return {
      url: publicUrl,
      key,
      bucket: this.bucketName,
      size: file.size,
      mimeType: contentType,
      category,
      createdAt: new Date().toISOString(),
    };
  }

  public async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  public getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `${this.baseUrl}/${cleanKey}`;
  }

  public async head(key: string): Promise<StorageObjectMetadata | null> {
    const item = this.storage.get(key);
    if (!item) return null;

    return {
      key,
      size: item.size,
      contentType: item.mimeType,
      lastModified: item.lastModified,
    };
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  // Helper for test assertions
  public getObject(key: string): StoredObject | undefined {
    return this.storage.get(key);
  }

  public clear(): void {
    this.storage.clear();
  }
}
