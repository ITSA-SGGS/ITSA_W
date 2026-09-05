/**
 * ITSA Platform — Storage Provider Factory
 * Phase 4: Storage & Media Migration
 */

import { IStorageProvider } from '../types.js';
import { R2StorageProvider } from './r2.provider.js';
import { LocalStorageProvider } from './local.provider.js';
import { MemoryStorageProvider } from './memory.provider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface StorageFactoryOptions {
  providerType?: 'r2' | 's3' | 'local' | 'memory';
  uploadDir?: string;
  publicBaseUrl?: string;
  bucketName?: string;
}

export function createStorageProvider(options: StorageFactoryOptions = {}): IStorageProvider {
  const providerType = options.providerType || env.STORAGE_PROVIDER;

  switch (providerType) {
    case 'memory': {
      logger.info('Initializing Storage Provider: MemoryStorageProvider (In-Memory Mock)');
      return new MemoryStorageProvider(
        options.publicBaseUrl || env.R2_PUBLIC_URL || 'https://mock-r2.itsa.sggs.ac.in',
        options.bucketName || env.R2_BUCKET_NAME || 'mock-bucket'
      );
    }

    case 'local': {
      const uploadDir = options.uploadDir || env.UPLOAD_DIR || 'uploads';
      const publicBaseUrl = options.publicBaseUrl || '/uploads';
      logger.info(`Initializing Storage Provider: LocalStorageProvider (Directory: "${uploadDir}")`);
      return new LocalStorageProvider({
        uploadDir,
        publicBaseUrl,
        bucketName: options.bucketName || env.R2_BUCKET_NAME || 'local-media',
      });
    }

    case 'r2':
    case 's3': {
      const accessKeyId = env.R2_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID;
      const secretAccessKey = env.R2_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY;
      const bucketName = options.bucketName || env.R2_BUCKET_NAME || env.S3_BUCKET_NAME || 'itsa-media';
      const publicUrl = options.publicBaseUrl || env.R2_PUBLIC_URL || env.S3_PUBLIC_URL;
      const accountId = env.R2_ACCOUNT_ID;
      const endpoint = env.S3_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
      const region = env.S3_REGION || 'auto';

      if (!accessKeyId || !secretAccessKey || !endpoint) {
        if (env.NODE_ENV === 'production') {
          throw new Error(
            'Missing required Cloudflare R2 / S3 storage credentials (ACCESS_KEY_ID, SECRET_ACCESS_KEY, ACCOUNT_ID/ENDPOINT) in production.'
          );
        }

        logger.warn(
          'Cloudflare R2 credentials not fully specified in environment. Falling back to LocalStorageProvider for development.'
        );
        return new LocalStorageProvider({
          uploadDir: env.UPLOAD_DIR || 'uploads',
          publicBaseUrl: '/uploads',
          bucketName,
        });
      }

      logger.info(`Initializing Storage Provider: R2StorageProvider (Bucket: "${bucketName}", Endpoint: "${endpoint}")`);
      return new R2StorageProvider({
        accountId,
        endpoint,
        region,
        accessKeyId,
        secretAccessKey,
        bucketName,
        publicUrl,
      });
    }

    default: {
      logger.warn(`Unknown storage provider "${providerType}". Falling back to LocalStorageProvider.`);
      return new LocalStorageProvider({
        uploadDir: env.UPLOAD_DIR || 'uploads',
        publicBaseUrl: '/uploads',
        bucketName: 'itsa-media',
      });
    }
  }
}
