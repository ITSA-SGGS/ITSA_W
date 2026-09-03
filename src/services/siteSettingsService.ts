import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  if (!isSupabaseConfigured) {
    return { ...inMemorySettings };
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('is_public', true);

    if (error) {
      console.warn('Supabase site_settings query failed, using fallback:', error.message);
      return { ...inMemorySettings };
    }

    if (!data || data.length === 0) {
      return { ...inMemorySettings };
    }

    const settingsMap: Record<string, any> = { ...inMemorySettings };
    const rows = data as Array<{ key: string; value: any }>;
    for (const item of rows) {
      settingsMap[item.key] = item.value;
    }
    return settingsMap;
  } catch (err) {
    console.warn('Failed to fetch site settings from Supabase:', err);
    return { ...inMemorySettings };
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Governed by RLS - Restricted to SUPER_ADMIN)
// ============================================================================

/**
 * Updates or upserts a single setting by key.
 */
export async function updateSiteSetting(
  key: string,
  value: any,
  description?: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    inMemorySettings[key] = value;
    return;
  }

  const { error } = await (supabase
    .from('site_settings') as any)
    .upsert(
      {
        key,
        value,
        description: description || null,
        is_public: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    throw new Error(error.message || `Failed to update site setting "${key}".`);
  }
}

import { sanitizeUrl } from '../lib/security';

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

  if (!isSupabaseConfigured) {
    inMemorySettings = {
      ...inMemorySettings,
      ...sanitizedMap,
    };
    return;
  }

  const upsertRows = Object.entries(sanitizedMap).map(([key, value]) => ({
    key,
    value,
    is_public: true,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await (supabase
    .from('site_settings') as any)
    .upsert(upsertRows, { onConflict: 'key' });

  if (error) {
    throw new Error(error.message || 'Failed to save site settings.');
  }
}
