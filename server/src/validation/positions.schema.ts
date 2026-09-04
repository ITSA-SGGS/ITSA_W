import { z } from 'zod';
import { committeeTierEnum } from './team.schema.js';

export const createPositionSchema = z.object({
  name: z
    .string({ required_error: 'Position name is required' })
    .trim()
    .min(1, 'Position name cannot be empty')
    .max(255, 'Position name must be 255 characters or fewer'),
  tier: committeeTierEnum,
  domain: z.string().trim().default('OVERALL'),
  description: z.string().trim().nullable().optional(),
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const updatePositionSchema = createPositionSchema.partial();

export const publicPositionsQuerySchema = z.object({
  tier: committeeTierEnum.optional(),
});

export const adminPositionsQuerySchema = z.object({
  tier: committeeTierEnum.optional(),
  is_active: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => (typeof val === 'string' ? val === 'true' : val))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const togglePositionActiveSchema = z.object({
  is_active: z.boolean().optional(),
});
