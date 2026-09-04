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

  return {
    ...parsed,
    AUTH_SECRET: authSecret,
  };
}

export const env = parseEnv();
export const SESSION_COOKIE_NAME = env.COOKIE_NAME;
export const SESSION_TTL_MS = env.SESSION_TTL_HOURS * 60 * 60 * 1000;
