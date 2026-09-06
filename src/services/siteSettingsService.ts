import { api } from '../lib/api';
import { sanitizeUrl } from '../lib/security';
import { SiteSetting } from '../types';

let inMemorySettings: Record<string, any> = {
  academic_year: '2026–2027',
  telemetry_status: 'SYS: LINUX_KERNEL_STABLE',
  quote_content: {
    quote: 'The best way to predict the future is to invent it.',
    author: 'Alan Kay',
  },
  contact_info: {
    email: 'itsa@sggs.ac.in',
    institution: 'SGGSIE&T, Nanded',
    address: 'Department of Information Technology, SGGSIE&T, Vishnupuri, Nanded - 431606',
  },
  social_links: {
    linkedin: 'https://linkedin.com/company/itsa-sggsiet',
    github: 'https://github.com/itsa-sggsiet',
    instagram: 'https://instagram.com/itsa_sggsiet',
  },
};

// ============================================================================
// PUBLIC READ QUERIES (Filtered strictly by is_public = true)
// ============================================================================

/**
 * Fetches all public site settings with fallback.
 */
export async function getPublicSiteSettings(): Promise<Record<string, any>> {
  try {
    const data = await api.get<Record<string, any>>('/api/settings/public');

    if (!data || Object.keys(data).length === 0) {
      return { ...inMemorySettings };
    }

    const settingsMap: Record<string, any> = { ...inMemorySettings };
    for (const [key, value] of Object.entries(data)) {
      settingsMap[key] = value;
    }
    return settingsMap;
  } catch (err) {
    console.warn('Failed to fetch site settings from API:', err);
    return { ...inMemorySettings };
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
  inMemorySettings[key] = value;
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
  inMemorySettings = {
    ...inMemorySettings,
    ...sanitizedMap,
  };
}
