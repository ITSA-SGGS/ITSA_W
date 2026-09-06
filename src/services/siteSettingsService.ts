import { api } from '../lib/api';
import { sanitizeUrl } from '../lib/security';
import { SiteSetting } from '../types';

// ============================================================================
// PUBLIC READ QUERIES (Filtered strictly by is_public = true)
// ============================================================================

/**
 * Fetches all public site settings from Neon API.
 */
export async function getPublicSiteSettings(): Promise<Record<string, any>> {
  try {
    const data = await api.get<Record<string, any>>('/api/settings/public');
    return data || {};
  } catch (err) {
    console.error('Failed to fetch site settings from API:', err);
    return {};
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Restricted to SUPER_ADMIN)
// ============================================================================

/**
 * Updates or upserts a single setting by key.
 */
export async function updateSiteSetting(
  key: string,
  value: any,
  _description?: string
): Promise<void> {
  await api.put<{ message: string }>('/api/admin/settings', { [key]: value });
}

/**
 * Saves a batch of site settings.
 */
export async function saveBatchSiteSettings(
  settingsMap: Record<string, any>
): Promise<void> {
  const sanitizedMap = { ...settingsMap };

  if (sanitizedMap.social_links) {
    sanitizedMap.social_links = {
      linkedin: sanitizeUrl(sanitizedMap.social_links.linkedin),
      github: sanitizeUrl(sanitizedMap.social_links.github),
      instagram: sanitizeUrl(sanitizedMap.social_links.instagram),
    };
  }

  await api.put<{ message: string }>('/api/admin/settings', sanitizedMap);
}
