import { z } from 'zod';
import { isSafeUrl } from './url.validator.js';

/**
 * Validates batch site settings payload.
 * Accepts either { settings: { ... } } or directly { key: value, ... }.
 */
export const batchSettingsSchema = z
  .union([
    z.object({
      settings: z.record(z.any()),
    }),
    z.record(z.any()),
  ])
  .transform((input) => {
    const raw = 'settings' in input && typeof input.settings === 'object' && input.settings !== null
      ? input.settings
      : input;

    // Recursively sanitize URLs within known link structures
    const sanitized: Record<string, any> = { ...raw };
    if (sanitized.social_links && typeof sanitized.social_links === 'object') {
      for (const [platform, url] of Object.entries(sanitized.social_links)) {
        if (typeof url === 'string' && url.trim() !== '') {
          if (!isSafeUrl(url)) {
            throw new z.ZodError([
              {
                code: z.ZodIssueCode.custom,
                path: ['social_links', platform],
                message: `Dangerous or invalid URL protocol detected in social_links.${platform}`,
              },
            ]);
          }
        }
      }
    }
    return sanitized;
  });
