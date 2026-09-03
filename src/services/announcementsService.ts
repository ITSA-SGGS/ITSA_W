import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Announcement, AnnouncementFormData } from '../types';

let inMemoryAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'ITSA Academic Tenure & Technical Session Registrations Open',
    message: 'Official registrations for departmental symposium tracks, algorithmic sprints, and sports leagues are now live.',
    link_url: 'https://forms.google.com',
    is_published: true,
    published_at: new Date().toISOString(),
    expires_at: null,
    display_order: 1,
    created_at: new Date().toISOString(),
  },
];

function mapDbAnnouncementToApp(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    message: row.message || null,
    link_url: row.link_url || null,
    is_published: row.is_published ?? true,
    published_at: row.published_at || null,
    expires_at: row.expires_at || null,
    display_order: row.display_order ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ============================================================================
// PUBLIC READ QUERIES (Filtered strictly by is_published = true and active timeframe)
// ============================================================================

/**
 * Fetches published and active announcements for the public website.
 */
export async function getPublishedAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured) {
    return inMemoryAnnouncements.filter((a) => a.is_published);
  }

  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .or(`published_at.is.null,published_at.lte.${nowIso}`)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase announcements query failed, using fallback:', error.message);
      return inMemoryAnnouncements.filter((a) => a.is_published);
    }

    if (!data || data.length === 0) {
      return inMemoryAnnouncements.filter((a) => a.is_published);
    }

    return data.map(mapDbAnnouncementToApp);
  } catch (err) {
    console.warn('Failed to fetch announcements from Supabase:', err);
    return inMemoryAnnouncements.filter((a) => a.is_published);
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Governed by RLS)
// ============================================================================

/**
 * Fetches all announcements (both published and drafts) for the Admin Dashboard.
 */
export async function getAllAdminAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured) {
    return [...inMemoryAnnouncements].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Admin announcements fetch encountered an error, using fallback:', error.message);
      return [...inMemoryAnnouncements].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    if (!data || data.length === 0) {
      return [...inMemoryAnnouncements].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return data.map(mapDbAnnouncementToApp);
  } catch (err) {
    console.warn('Failed to fetch admin announcements:', err);
    return [...inMemoryAnnouncements].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
}

import { sanitizeUrl } from '../lib/security';

/**
 * Creates a new announcement.
 */
export async function createAnnouncement(formData: AnnouncementFormData): Promise<Announcement> {
  const title = formData.title.trim();
  if (!title) {
    throw new Error('Announcement Title is required.');
  }

  const payload = {
    title,
    message: formData.message?.trim() || null,
    link_url: sanitizeUrl(formData.link_url),
    is_published: Boolean(formData.is_published),
    published_at: formData.published_at ? new Date(formData.published_at).toISOString() : new Date().toISOString(),
    expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
    display_order: Number(formData.display_order) || 0,
  };

  if (!isSupabaseConfigured) {
    const newMock: Announcement = {
      id: `mock-ann-${Date.now()}`,
      title: payload.title,
      message: payload.message,
      link_url: payload.link_url,
      is_published: payload.is_published,
      published_at: payload.published_at,
      expires_at: payload.expires_at,
      display_order: payload.display_order,
      created_at: new Date().toISOString(),
    };
    inMemoryAnnouncements = [newMock, ...inMemoryAnnouncements];
    return newMock;
  }

  const { data, error } = await (supabase
    .from('announcements') as any)
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create announcement.');
  }

  return mapDbAnnouncementToApp(data);
}

/**
 * Updates an existing announcement.
 */
export async function updateAnnouncement(
  id: string,
  formData: Partial<AnnouncementFormData>
): Promise<Announcement> {
  const payload: any = {};
  if (formData.title !== undefined) payload.title = formData.title.trim();
  if (formData.message !== undefined) payload.message = formData.message?.trim() || null;
  if (formData.link_url !== undefined) payload.link_url = sanitizeUrl(formData.link_url);
  if (formData.is_published !== undefined) payload.is_published = Boolean(formData.is_published);
  if (formData.published_at !== undefined) {
    payload.published_at = formData.published_at ? new Date(formData.published_at).toISOString() : null;
  }
  if (formData.expires_at !== undefined) {
    payload.expires_at = formData.expires_at ? new Date(formData.expires_at).toISOString() : null;
  }
  if (formData.display_order !== undefined) payload.display_order = Number(formData.display_order);

  if (!isSupabaseConfigured) {
    inMemoryAnnouncements = inMemoryAnnouncements.map((a) => {
      if (a.id === id) {
        return { ...a, ...payload };
      }
      return a;
    });
    const updated = inMemoryAnnouncements.find((a) => a.id === id)!;
    return updated;
  }

  const { data, error } = await (supabase
    .from('announcements') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update announcement.');
  }

  return mapDbAnnouncementToApp(data);
}

/**
 * Toggles publication status (is_published).
 */
export async function toggleAnnouncementPublished(
  id: string,
  currentStatus: boolean
): Promise<Announcement> {
  return updateAnnouncement(id, { is_published: !currentStatus });
}

/**
 * Deletes an announcement.
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    inMemoryAnnouncements = inMemoryAnnouncements.filter((a) => a.id !== id);
    return;
  }

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete announcement.');
  }
}
