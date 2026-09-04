import { z } from 'zod';

export const adminRoleEnum = z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR'], {
  errorMap: () => ({ message: 'Role must be one of: SUPER_ADMIN, ADMIN, EDITOR' }),
});

export const inviteUserSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or fewer'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be 128 characters or fewer'),
  full_name: z.string().trim().max(255).nullable().optional(),
  role: adminRoleEnum.default('ADMIN'),
  is_active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  full_name: z.string().trim().max(255).nullable().optional(),
  role: adminRoleEnum.optional(),
  is_active: z.boolean().optional(),
});

export const toggleUserActiveSchema = z.object({
  is_active: z.boolean().optional(),
});
