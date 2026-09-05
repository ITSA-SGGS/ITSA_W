import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from server directory if it exists
dotenv.config();

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1024).max(65535).default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  SESSION_TTL_HOURS: z.coerce.number().min(1).max(720).default(24),
  COOKIE_NAME: z.string().default('itsa_session'),

  // Phase 4 Object Storage Configuration
  STORAGE_PROVIDER: z.enum(['r2', 's3', 'local', 'memory']).default('r2'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('itsa-media'),
  R2_PUBLIC_URL: z.string().optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  UPLOAD_DIR: z.string().default('uploads'),
});

const envSchema = rawEnvSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.AUTH_SECRET || data.AUTH_SECRET.trim().length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUTH_SECRET'],
        message:
          'AUTH_SECRET is mandatory in production and must be at least 32 characters long (e.g. generate via `openssl rand -base64 32`).',
      });
    }

    if (data.STORAGE_PROVIDER === 'r2') {
      const hasKey = !!(data.R2_ACCESS_KEY_ID || data.S3_ACCESS_KEY_ID);
      const hasSecret = !!(data.R2_SECRET_ACCESS_KEY || data.S3_SECRET_ACCESS_KEY);
      const hasEndpoint = !!(data.R2_ACCOUNT_ID || data.S3_ENDPOINT);

      if (!hasKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['R2_ACCESS_KEY_ID'],
          message: 'R2_ACCESS_KEY_ID (or S3_ACCESS_KEY_ID) is required in production when STORAGE_PROVIDER is r2.',
        });
      }
      if (!hasSecret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['R2_SECRET_ACCESS_KEY'],
          message: 'R2_SECRET_ACCESS_KEY (or S3_SECRET_ACCESS_KEY) is required in production when STORAGE_PROVIDER is r2.',
        });
      }
      if (!hasEndpoint) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['R2_ACCOUNT_ID'],
          message: 'R2_ACCOUNT_ID (or S3_ENDPOINT) is required in production when STORAGE_PROVIDER is r2.',
        });
      }
    }
  }
});

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  CLIENT_ORIGIN: string;
  DATABASE_URL?: string;
  AUTH_SECRET: string;
  SESSION_TTL_HOURS: number;
  COOKIE_NAME: string;
  STORAGE_PROVIDER: 'r2' | 's3' | 'local' | 'memory';
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL?: string;
  S3_ENDPOINT?: string;
  S3_REGION: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_BUCKET_NAME?: string;
  S3_PUBLIC_URL?: string;
  UPLOAD_DIR: string;
}

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(` - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const parsed = result.data;

  // In non-production environments, provide a secure development fallback if unset
  const authSecret =
    parsed.AUTH_SECRET && parsed.AUTH_SECRET.trim().length >= 16
      ? parsed.AUTH_SECRET
      : 'dev_auth_secret_itsa_development_only_not_for_production_min32chars';

  if (parsed.NODE_ENV === 'development' && (!parsed.AUTH_SECRET || parsed.AUTH_SECRET.length < 32)) {
    console.warn(
      '[WARN] Using default development AUTH_SECRET. For production, set a cryptographically secure 32+ character AUTH_SECRET.'
    );
  }

  // In non-production, if R2 credentials are unset, default to local storage
  let storageProvider = parsed.STORAGE_PROVIDER;
  const hasR2Credentials = !!(
    (parsed.R2_ACCESS_KEY_ID || parsed.S3_ACCESS_KEY_ID) &&
    (parsed.R2_SECRET_ACCESS_KEY || parsed.S3_SECRET_ACCESS_KEY) &&
    (parsed.R2_ACCOUNT_ID || parsed.S3_ENDPOINT)
  );

  if (parsed.NODE_ENV !== 'production' && storageProvider === 'r2' && !hasR2Credentials) {
    storageProvider = parsed.NODE_ENV === 'test' ? 'memory' : 'local';
    if (parsed.NODE_ENV === 'development') {
      console.warn(
        '[INFO] Cloudflare R2 credentials not detected in development; using local disk storage abstraction.'
      );
    }
  }

  return {
    ...parsed,
    AUTH_SECRET: authSecret,
    STORAGE_PROVIDER: storageProvider,
  };
}

export const env = parseEnv();
export const SESSION_COOKIE_NAME = env.COOKIE_NAME;
export const SESSION_TTL_MS = env.SESSION_TTL_HOURS * 60 * 60 * 1000;
