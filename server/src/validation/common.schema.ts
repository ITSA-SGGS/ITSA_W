import { z } from 'zod';

/**
 * Validates route path parameters containing a UUID `id`.
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid UUID format.' }),
});

/**
 * Validates query pagination parameters with sensible defaults and maximums.
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

/**
 * Strips HTML script tags from string inputs.
 */
export function sanitizePlainText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').trim();
}
