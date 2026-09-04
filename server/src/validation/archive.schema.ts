import { z } from 'zod';
import { safeUrlSchema } from './url.validator.js';

export const createArchiveSchema = z.object({
  title: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  image_url: safeUrlSchema,
  year: z.coerce.number().int().min(1980).max(2100).nullable().optional(),
  event_name: z.string().trim().nullable().optional(),
  display_order: z.coerce.number().int().min(0).default(0),
  is_published: z.boolean().default(false),
});

export const updateArchiveSchema = createArchiveSchema.partial();

export const publicArchiveQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const adminArchiveQuerySchema = z.object({
  is_published: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => (typeof val === 'string' ? val === 'true' : val))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const toggleArchivePublishSchema = z.object({
  is_published: z.boolean().optional(),
});
