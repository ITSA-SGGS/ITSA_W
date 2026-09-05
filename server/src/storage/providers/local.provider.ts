/**
 * ITSA Platform — Local Disk Storage Provider
 * Phase 4: Storage & Media Migration
 */

import fs from 'fs/promises';
import path from 'path';
import {
  IStorageProvider,
  LocalProviderConfig,
  StorageFile,
  StorageObjectMetadata,
  StorageUploadResult,
  UploadOptions,
  StorageCategory,
} from '../types.js';
import { resolveCategoryFromKey } from '../validation.js';
import { logger } from '../../utils/logger.js';

export class LocalStorageProvider implements IStorageProvider {
  public readonly name = 'Local Disk Storage';
  private readonly uploadDir: string;
  private readonly publicBaseUrl: string;
  private readonly bucketName: string;

  constructor(config: LocalProviderConfig) {
    this.uploadDir = path.resolve(process.cwd(), config.uploadDir);
    this.publicBaseUrl = (config.publicBaseUrl || '/uploads').replace(/\/+$/, '');
    this.bucketName = config.bucketName || 'local-storage';
  }

  private resolveSafePath(key: string): string {
    if (key.includes('\0') || key.includes('..') || key.includes('\\')) {
      throw new Error(`Path traversal attempt detected for key "${key}".`);
    }

    const cleanKey = key.replace(/^\/+/, '');
    const fullPath = path.resolve(this.uploadDir, cleanKey);

    // Security: Prevent path traversal outside uploadDir using separator-safe boundary
    const rootWithSep = this.uploadDir.endsWith(path.sep)
      ? this.uploadDir
      : `${this.uploadDir}${path.sep}`;

    if (fullPath !== this.uploadDir && !fullPath.startsWith(rootWithSep)) {
      throw new Error(`Path traversal attempt detected for key "${key}".`);
    }

    return fullPath;
  }

  public async upload(
    key: string,
    file: StorageFile,
    options?: UploadOptions
  ): Promise<StorageUploadResult> {
    const fullPath = this.resolveSafePath(key);
    const dir = path.dirname(fullPath);

    // Ensure parent directories exist
    await fs.mkdir(dir, { recursive: true });

    // Write file to disk
    await fs.writeFile(fullPath, file.buffer);

    const publicUrl = this.getPublicUrl(key);
    const category = resolveCategoryFromKey(key);
    const contentType = options?.contentType || file.mimetype;

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
    try {
      const fullPath = this.resolveSafePath(key);
      await fs.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        logger.error(`Error deleting local file "${key}":`, err.message);
        throw err;
      }
    }
  }

  public getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `${this.publicBaseUrl}/${cleanKey}`;
  }

  public async head(key: string): Promise<StorageObjectMetadata | null> {
    try {
      const fullPath = this.resolveSafePath(key);
      const stat = await fs.stat(fullPath);
      return {
        key,
        size: stat.size,
        lastModified: stat.mtime,
      };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.access(this.uploadDir, fs.constants.W_OK);
      return true;
    } catch (err: any) {
      logger.error('Local storage health check failed:', err.message);
      return false;
    }
  }
}
