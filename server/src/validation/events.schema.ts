import { z } from 'zod';
import { optionalSafeUrlSchema } from './url.validator.js';

export const eventCategoryEnum = z.enum(['TECHNICAL', 'SPORTS', 'CULTURAL'], {
  errorMap: () => ({ message: 'Category must be one of: TECHNICAL, SPORTS, CULTURAL' }),
});

export const eventStatusEnum = z.enum(['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED'], {
  errorMap: () => ({ message: 'Status must be one of: DRAFT, UPCOMING, ONGOING, COMPLETED' }),
});

export const createEventSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be 255 characters or fewer'),
  description: z.string().trim().nullable().optional(),
  category: eventCategoryEnum,
  year: z.coerce.number().int().min(1980).max(2100).nullable().optional(),
  event_date: z.string().trim().nullable().optional(),
  start_time: z.string().trim().nullable().optional(),
  end_time: z.string().trim().nullable().optional(),
  venue: z.string().trim().nullable().optional(),
  registration_url: optionalSafeUrlSchema,
  cover_image_url: optionalSafeUrlSchema,
  status: eventStatusEnum.default('UPCOMING'),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const updateEventSchema = createEventSchema.partial();

export const publicEventsQuerySchema = z.object({
  category: eventCategoryEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const adminEventsQuerySchema = z.object({
  category: eventCategoryEnum.optional(),
  status: eventStatusEnum.optional(),
  is_published: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => (typeof val === 'string' ? val === 'true' : val))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const togglePublishSchema = z.object({
  is_published: z.boolean().optional(),
});

export const toggleFeatureSchema = z.object({
  is_featured: z.boolean().optional(),
});
