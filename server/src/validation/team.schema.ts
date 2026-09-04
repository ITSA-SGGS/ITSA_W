import { z } from 'zod';
import { optionalSafeUrlSchema } from './url.validator.js';

export const committeeTierEnum = z.enum(
  ['CORE', 'TY_LEADERSHIP', 'SY_COORDINATOR', 'FACULTY'],
  {
    errorMap: () => ({
      message: 'Tier must be one of: CORE, TY_LEADERSHIP, SY_COORDINATOR, FACULTY',
    }),
  }
);

export const createMemberSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name cannot be empty')
    .max(255, 'Name must be 255 characters or fewer'),
  position: z
    .string({ required_error: 'Position is required' })
    .trim()
    .min(1, 'Position cannot be empty')
    .max(255, 'Position must be 255 characters or fewer'),
  tier: committeeTierEnum,
  domain: z.string().trim().default('OVERALL'),
  department: z.string().trim().nullable().optional(),
  photo_url: optionalSafeUrlSchema,
  linkedin_url: optionalSafeUrlSchema,
  github_url: optionalSafeUrlSchema,
  tenure_year: z.string().trim().default('2026–2027'),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const updateMemberSchema = createMemberSchema.partial();

export const publicTeamQuerySchema = z.object({
  tier: committeeTierEnum.optional(),
});

export const adminTeamQuerySchema = z.object({
  tier: committeeTierEnum.optional(),
  is_active: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => (typeof val === 'string' ? val === 'true' : val))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const toggleMemberActiveSchema = z.object({
  is_active: z.boolean().optional(),
});
