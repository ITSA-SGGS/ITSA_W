import { api } from '../lib/api';
import { SampleEvent, EventCategoryType, DbEventCategory, EventStatus, EventFormData } from '../types';
import {
  SAMPLE_TECHNICAL_EVENTS,
  SAMPLE_SPORTS_EVENTS,
  SAMPLE_CULTURAL_EVENTS,
} from '../data/mockData';

const ALL_MOCK_EVENTS: Record<string, SampleEvent[]> = {
  TECHNICAL: SAMPLE_TECHNICAL_EVENTS,
  'TECHNICAL EVENTS': SAMPLE_TECHNICAL_EVENTS,
  SPORTS: SAMPLE_SPORTS_EVENTS,
  'SPORTS EVENTS': SAMPLE_SPORTS_EVENTS,
  CULTURAL: SAMPLE_CULTURAL_EVENTS,
  'CULTURAL EVENTS': SAMPLE_CULTURAL_EVENTS,
};

// In-memory mock store for local development before Supabase is connected
let inMemoryEvents: SampleEvent[] = [
  ...SAMPLE_TECHNICAL_EVENTS.map((e, idx) => ({
    ...e,
    category: 'TECHNICAL' as DbEventCategory,
    status: 'UPCOMING' as EventStatus,
    is_published: true,
    is_featured: idx === 0,
    display_order: idx + 1,
  })),
  ...SAMPLE_SPORTS_EVENTS.map((e, idx) => ({
    ...e,
    category: 'SPORTS' as DbEventCategory,
    status: 'UPCOMING' as EventStatus,
    is_published: true,
    is_featured: false,
    display_order: idx + 5,
  })),
  ...SAMPLE_CULTURAL_EVENTS.map((e, idx) => ({
    ...e,
    category: 'CULTURAL' as DbEventCategory,
    status: 'UPCOMING' as EventStatus,
    is_published: true,
    is_featured: false,
    display_order: idx + 9,
  })),
];

/**
 * Media upload response type matching backend StorageUploadResult.
 */
export interface MediaUploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
  category: string;
  createdAt: string;
}

/**
 * Asynchronously resolves a media key, relative path, or legacy URL to a public URL
 * using the authoritative backend media resolution endpoint: GET /api/media/resolve?url=...
 */
export async function resolveMediaUrl(rawUrl: string | null | undefined): Promise<string> {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('/uploads/')) {
    try {
      return encodeURI(decodeURI(trimmed));
    } catch {
      return trimmed;
    }
  }

  const res = await api.get<{ original: string; resolvedUrl: string }>(
    `/api/media/resolve?url=${encodeURIComponent(trimmed)}`
  );
  return res.resolvedUrl;
}

/**
 * Synchronously resolves event image URLs for immediate UI rendering safely.
 */
export function resolveEventImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    try {
      return encodeURI(decodeURI(trimmed));
    } catch {
      return trimmed;
    }
  }

  try {
    return encodeURI(decodeURI(`/${trimmed}`));
  } catch {
    return `/${trimmed}`;
  }
}

/**
 * Normalizes a category string to database standard format ('TECHNICAL' | 'SPORTS' | 'CULTURAL')
 */
export function normalizeCategory(category: string): DbEventCategory {
  const upper = category.toUpperCase().trim();
  if (upper.includes('TECH')) return 'TECHNICAL';
  if (upper.includes('SPORT')) return 'SPORTS';
  if (upper.includes('CULT')) return 'CULTURAL';
  return 'TECHNICAL';
}

/**
 * Formats database event rows into the application EventItem format.
 */
function mapDbEventToApp(row: any, idx: number): SampleEvent {
  const formattedIndex = row.display_order ? String(row.display_order).padStart(2, '0') : String(idx + 1).padStart(2, '0');
  const resolvedCover = resolveEventImageUrl(row.cover_image_url);
  return {
    id: row.id,
    index: formattedIndex,
    title: row.title,
    subtitle: row.venue ? `${row.venue} · ${row.status}` : (row.category ? `${row.category} SESSION` : 'ITSA Session'),
    description: row.description || '',
    year: row.year ? String(row.year) : (row.event_date ? row.event_date.substring(0, 4) : '2026'),
    category: row.category,
    event_date: row.event_date,
    start_time: row.start_time,
    end_time: row.end_time,
    venue: row.venue,
    registration_url: row.registration_url,
    cover_image_url: resolvedCover,
    status: row.status,
    is_published: row.is_published,
    is_featured: row.is_featured,
    display_order: row.display_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ============================================================================
// PUBLIC READ QUERIES (Filtered by is_published = true)
// ============================================================================

/**
 * Fetches published events for the public website.
 */
export async function getPublishedEvents(): Promise<SampleEvent[]> {
  try {
    const data = await api.get<any[]>('/api/events?limit=100');

    if (!data || data.length === 0) {
      return inMemoryEvents.filter((e) => e.is_published);
    }

    return data.map((row, i) => mapDbEventToApp(row, i));
  } catch (err) {
    console.warn('Failed to fetch events from API, using in-memory fallback:', err);
    return inMemoryEvents.filter((e) => e.is_published);
  }
}

/**
 * Fetches published events filtered by category.
 */
export async function getPublishedEventsByCategory(
  category: EventCategoryType | string
): Promise<SampleEvent[]> {
  const normCat = normalizeCategory(category);

  try {
    const data = await api.get<any[]>(`/api/events?category=${encodeURIComponent(normCat)}&limit=100`);

    if (!data || data.length === 0) {
      return inMemoryEvents.filter((e) => e.is_published && e.category === normCat);
    }

    return data.map((row, i) => mapDbEventToApp(row, i));
  } catch (err) {
    console.warn(`Failed to fetch events for category ${normCat} from API:`, err);
    return inMemoryEvents.filter((e) => e.is_published && e.category === normCat);
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Full Access governed by RLS)
// ============================================================================
import { sanitizeUrl } from '../lib/security';

/**
 * Fetches all events (including drafts and unpublished records) for the Admin Dashboard.
 */
export async function getAllAdminEvents(): Promise<SampleEvent[]> {
  const data = await api.get<any[]>('/api/admin/events?limit=100');
  return (data || []).map((row, i) => mapDbEventToApp(row, i));
}

/**
 * Creates a new event record.
 */
export async function createEvent(formData: EventFormData): Promise<SampleEvent> {
  const payload = {
    title: formData.title.trim(),
    description: formData.description?.trim() || null,
    category: formData.category,
    year: formData.year ? Number(formData.year) : null,
    event_date: formData.event_date || null,
    start_time: formData.start_time || null,
    end_time: formData.end_time || null,
    venue: formData.venue?.trim() || null,
    registration_url: sanitizeUrl(formData.registration_url),
    cover_image_url: formData.cover_image_url?.trim() || null,
    status: formData.status || 'UPCOMING',
    is_published: Boolean(formData.is_published),
    is_featured: Boolean(formData.is_featured),
    display_order: Number(formData.display_order) || 0,
  };

  const data = await api.post<any>('/api/admin/events', payload);
  return mapDbEventToApp(data, 0);
}

/**
 * Updates an existing event record.
 */
export async function updateEvent(
  id: string,
  formData: Partial<EventFormData>
): Promise<SampleEvent> {
  const payload: any = {};
  if (formData.title !== undefined) payload.title = formData.title.trim();
  if (formData.description !== undefined) payload.description = formData.description?.trim() || null;
  if (formData.category !== undefined) payload.category = formData.category;
  if (formData.year !== undefined) payload.year = formData.year ? Number(formData.year) : null;
  if (formData.event_date !== undefined) payload.event_date = formData.event_date || null;
  if (formData.start_time !== undefined) payload.start_time = formData.start_time || null;
  if (formData.end_time !== undefined) payload.end_time = formData.end_time || null;
  if (formData.venue !== undefined) payload.venue = formData.venue?.trim() || null;
  if (formData.registration_url !== undefined) payload.registration_url = sanitizeUrl(formData.registration_url);
  if (formData.cover_image_url !== undefined) payload.cover_image_url = formData.cover_image_url?.trim() || null;
  if (formData.status !== undefined) payload.status = formData.status;
  if (formData.is_published !== undefined) payload.is_published = Boolean(formData.is_published);
  if (formData.is_featured !== undefined) payload.is_featured = Boolean(formData.is_featured);
  if (formData.display_order !== undefined) payload.display_order = Number(formData.display_order);

  const data = await api.put<any>(`/api/admin/events/${id}`, payload);
  return mapDbEventToApp(data, 0);
}

/**
 * Deletes an event record.
 */
export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/api/admin/events/${id}`);
}

/**
 * Quick toggle for publication status (is_published).
 */
export async function togglePublishEvent(id: string, currentPublishedState: boolean): Promise<SampleEvent> {
  const data = await api.patch<any>(`/api/admin/events/${id}/publish`, { is_published: !currentPublishedState });
  return mapDbEventToApp(data, 0);
}

/**
 * Quick toggle for featured status (is_featured).
 */
export async function toggleFeatureEvent(id: string, currentFeaturedState: boolean): Promise<SampleEvent> {
  const data = await api.patch<any>(`/api/admin/events/${id}/feature`, { is_featured: !currentFeaturedState });
  return mapDbEventToApp(data, 0);
}

/**
 * Uploads a cover image using the backend Express media API.
 * Permitted for EDITOR, ADMIN, and SUPER_ADMIN.
 */
export async function uploadEventCoverImage(file: File): Promise<string> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WebP, or AVIF.');
  }

  // Validate size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds 10MB limit.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<MediaUploadResult>('/api/admin/media/upload/event', formData);
  return res.url;
}
