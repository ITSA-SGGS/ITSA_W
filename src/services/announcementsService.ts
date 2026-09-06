import { api } from '../lib/api';
import { sanitizeUrl } from '../lib/security';
import { Announcement, AnnouncementFormData } from '../types';

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
  try {
    const data = await api.get<any[]>('/api/announcements/active');
    return (data || []).map(mapDbAnnouncementToApp);
  } catch (err) {
    console.error('Failed to fetch published announcements from API:', err);
    return [];
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Governed by RLS)
// ============================================================================

/**
 * Fetches all announcements (both published and drafts) for the Admin Dashboard.
 */
export async function getAllAdminAnnouncements(): Promise<Announcement[]> {
  try {
    const data = await api.get<any[]>('/api/admin/announcements?limit=100');
    return (data || []).map(mapDbAnnouncementToApp);
  } catch (err) {
    console.error('Failed to fetch admin announcements from API:', err);
    return [];
  }
}

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
    link_url: sanitizeUrl(formData.link_url) || null,
    is_published: Boolean(formData.is_published),
    published_at: formData.published_at ? new Date(formData.published_at).toISOString() : new Date().toISOString(),
    expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
    display_order: Number(formData.display_order) || 0,
  };

  const data = await api.post<any>('/api/admin/announcements', payload);
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
  if (formData.link_url !== undefined) payload.link_url = sanitizeUrl(formData.link_url) || null;
  if (formData.is_published !== undefined) payload.is_published = Boolean(formData.is_published);
  if (formData.published_at !== undefined) {
    payload.published_at = formData.published_at ? new Date(formData.published_at).toISOString() : null;
  }
  if (formData.expires_at !== undefined) {
    payload.expires_at = formData.expires_at ? new Date(formData.expires_at).toISOString() : null;
  }
  if (formData.display_order !== undefined) payload.display_order = Number(formData.display_order);

  const data = await api.put<any>(`/api/admin/announcements/${encodeURIComponent(id)}`, payload);
  return mapDbAnnouncementToApp(data);
}

/**
 * Toggles publication status (is_published).
 */
export async function toggleAnnouncementPublished(
  id: string,
  currentStatus: boolean
): Promise<Announcement> {
  const data = await api.patch<any>(`/api/admin/announcements/${encodeURIComponent(id)}/publish`, {
    is_published: !currentStatus,
  });
  return mapDbAnnouncementToApp(data);
}

/**
 * Deletes an announcement.
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete<{ message: string }>(`/api/admin/announcements/${encodeURIComponent(id)}`);
}
