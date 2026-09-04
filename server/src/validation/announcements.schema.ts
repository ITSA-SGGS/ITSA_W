import { z } from 'zod';
import { optionalSafeUrlSchema } from './url.validator.js';

export const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be 255 characters or fewer'),
  message: z.string().trim().nullable().optional(),
  link_url: optionalSafeUrlSchema,
  is_published: z.boolean().default(false),
  published_at: z.string().trim().nullable().optional(),
  expires_at: z.string().trim().nullable().optional(),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const adminAnnouncementsQuerySchema = z.object({
  is_published: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => (typeof val === 'string' ? val === 'true' : val))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const toggleAnnouncementPublishSchema = z.object({
  is_published: z.boolean().optional(),
});
