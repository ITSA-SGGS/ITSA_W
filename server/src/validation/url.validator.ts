import { z } from 'zod';

/**
 * Validates whether a URL is safe to store and display.
 * Strictly blocks dangerous pseudo-protocols such as javascript:, data:, vbscript:, and file:.
 * Accepts valid HTTP/HTTPS URLs, mailto, tel, and relative path strings.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();

  // Block dangerous pseudo-protocols
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  // Root-relative paths (e.g. /archive/photo.jpg, /team/portrait.png)
  if (trimmed.startsWith('/')) {
    return true;
  }

  // Absolute URLs
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    // If not a full URL with protocol, check if it's a domain/path (e.g. "linkedin.com/in/user")
    const domainRegex = /^[a-zA-Z0-9][-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
    return domainRegex.test(trimmed);
  }
}

/**
 * Zod schema requiring a safe URL string.
 */
export const safeUrlSchema = z
  .string({ invalid_type_error: 'URL must be a string' })
  .trim()
  .min(1, 'URL cannot be empty')
  .refine(isSafeUrl, {
    message:
      'Invalid or unsafe URL. Dangerous protocols (javascript:, data:, vbscript:) are strictly forbidden.',
  });

/**
 * Optional safe URL schema: permits null, undefined, or empty string (converted to null).
 * If a value is supplied, it MUST pass the safety check.
 */
export const optionalSafeUrlSchema = z
  .union([
    z.string().trim().refine(isSafeUrl, {
      message:
        'Invalid or unsafe URL. Dangerous protocols (javascript:, data:, vbscript:) are strictly forbidden.',
    }),
    z.literal(''),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => {
    if (!val || val.trim() === '') return null;
    return val.trim();
  });
