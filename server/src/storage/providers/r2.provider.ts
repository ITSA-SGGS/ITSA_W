/**
 * ITSA Platform — Cloudflare R2 / S3 Storage Provider
 * Phase 4: Storage & Media Migration
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  IStorageProvider,
  R2ProviderConfig,
  StorageFile,
  StorageObjectMetadata,
  StorageUploadResult,
  UploadOptions,
  StorageCategory,
} from '../types.js';
import { resolveCategoryFromKey } from '../validation.js';
import { logger } from '../../utils/logger.js';

export class R2StorageProvider implements IStorageProvider {
  public readonly name = 'Cloudflare R2 (S3-Compatible)';
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl?: string;
  private readonly endpoint: string;

  constructor(config: R2ProviderConfig) {
    this.bucketName = config.bucketName;
    this.publicUrl = config.publicUrl?.trim() || undefined;

    // Cloudflare R2 default endpoint pattern or custom S3 endpoint
    if (config.endpoint) {
      this.endpoint = config.endpoint.trim();
    } else if (config.accountId) {
      this.endpoint = `https://${config.accountId.trim()}.r2.cloudflarestorage.com`;
    } else {
      throw new Error('R2StorageProvider requires either accountId or endpoint.');
    }

    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  public async upload(
    key: string,
    file: StorageFile,
    options?: UploadOptions
  ): Promise<StorageUploadResult> {
    const contentType = options?.contentType || file.mimetype;
    const cacheControl = options?.cacheControl || 'public, max-age=31536000, immutable';

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: options?.metadata,
    });

    await this.client.send(command);

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
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  public getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/+$/, '')}/${cleanKey}`;
    }
    return `${this.endpoint.replace(/\/+$/, '')}/${this.bucketName}/${cleanKey}`;
  }

  public async head(key: string): Promise<StorageObjectMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      return {
        key,
        size: Number(response.ContentLength || 0),
        contentType: response.ContentType,
        lastModified: response.LastModified,
        eTag: response.ETag,
      };
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      logger.error(`Error inspecting storage object "${key}":`, err.message);
      throw err;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
      });
      await this.client.send(command);
      return true;
    } catch (err: any) {
      logger.error('R2 health check failed:', err.message);
      return false;
    }
  }
}
