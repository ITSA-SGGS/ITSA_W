import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
 * Resolves event image URLs from Supabase Storage paths, absolute URLs, or local paths safely.
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

  if (isSupabaseConfigured) {
    const { data } = supabase.storage.from('event-media').getPublicUrl(trimmed);
    if (data?.publicUrl) {
      return data.publicUrl;
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
  if (!isSupabaseConfigured) {
    return inMemoryEvents.filter((e) => e.is_published);
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('event_date', { ascending: false });

    if (error) {
      console.warn('Supabase query failed, using in-memory fallback:', error.message);
      return inMemoryEvents.filter((e) => e.is_published);
    }

    if (!data || data.length === 0) {
      return inMemoryEvents.filter((e) => e.is_published);
    }

    return data.map((row, i) => mapDbEventToApp(row, i));
  } catch (err) {
    console.warn('Failed to fetch events from Supabase:', err);
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

  if (!isSupabaseConfigured) {
    return inMemoryEvents.filter((e) => e.is_published && e.category === normCat);
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .eq('category', normCat)
      .order('display_order', { ascending: true })
      .order('event_date', { ascending: false });

    if (error) {
      console.warn(`Supabase query for category ${normCat} failed:`, error.message);
      return inMemoryEvents.filter((e) => e.is_published && e.category === normCat);
    }

    if (!data || data.length === 0) {
      return inMemoryEvents.filter((e) => e.is_published && e.category === normCat);
    }

    return data.map((row, i) => mapDbEventToApp(row, i));
  } catch (err) {
    console.warn(`Failed to fetch events for category ${normCat}:`, err);
    return inMemoryEvents.filter((e) => e.is_published && e.category === normCat);
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Full Access governed by RLS)
// ============================================================================

/**
 * Fetches all events (including drafts and unpublished records) for the Admin Dashboard.
 */
export async function getAllAdminEvents(): Promise<SampleEvent[]> {
  if (!isSupabaseConfigured) {
    return [...inMemoryEvents].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Admin events fetch encountered an error, using fallback:', error.message);
      return [...inMemoryEvents].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    if (!data || data.length === 0) {
      return [...inMemoryEvents].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return data.map((row, i) => mapDbEventToApp(row, i));
  } catch (err) {
    console.warn('Failed to fetch admin events:', err);
    return [...inMemoryEvents].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
}

import { sanitizeUrl } from '../lib/security';

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

  if (!isSupabaseConfigured) {
    const newMock: SampleEvent = {
      id: `mock-event-${Date.now()}`,
      index: String(payload.display_order || inMemoryEvents.length + 1).padStart(2, '0'),
      title: payload.title,
      subtitle: payload.venue ? `${payload.venue} · ${payload.status}` : `${payload.category} SESSION`,
      description: payload.description || '',
      year: String(payload.year || '2026'),
      category: payload.category,
      event_date: payload.event_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      venue: payload.venue,
      registration_url: payload.registration_url,
      cover_image_url: payload.cover_image_url,
      status: payload.status,
      is_published: payload.is_published,
      is_featured: payload.is_featured,
      display_order: payload.display_order,
      created_at: new Date().toISOString(),
    };
    inMemoryEvents = [newMock, ...inMemoryEvents];
    return newMock;
  }

  const { data, error } = await (supabase
    .from('events') as any)
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create event in database.');
  }

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

  if (!isSupabaseConfigured) {
    inMemoryEvents = inMemoryEvents.map((evt) => {
      if (evt.id === id) {
        return {
          ...evt,
          ...payload,
          year: payload.year ? String(payload.year) : evt.year,
        };
      }
      return evt;
    });
    const updated = inMemoryEvents.find((e) => e.id === id)!;
    return updated;
  }

  const { data, error } = await (supabase
    .from('events') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update event in database.');
  }

  return mapDbEventToApp(data, 0);
}

/**
 * Deletes an event record.
 */
export async function deleteEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    inMemoryEvents = inMemoryEvents.filter((e) => e.id !== id);
    return;
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete event.');
  }
}

/**
 * Quick toggle for publication status (is_published).
 */
export async function togglePublishEvent(id: string, currentPublishedState: boolean): Promise<SampleEvent> {
  return updateEvent(id, { is_published: !currentPublishedState } as any);
}

/**
 * Quick toggle for featured status (is_featured).
 */
export async function toggleFeatureEvent(id: string, currentFeaturedState: boolean): Promise<SampleEvent> {
  return updateEvent(id, { is_featured: !currentFeaturedState } as any);
}

/**
 * Uploads a cover image to the 'event-media' Supabase Storage bucket.
 */
export async function uploadEventCoverImage(file: File): Promise<string> {
  // Validate file format
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WebP, or AVIF.');
  }

  // Validate size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds 10MB limit.');
  }

  if (!isSupabaseConfigured) {
    // In mock mode, generate a local object URL for preview
    return URL.createObjectURL(file);
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `covers/${cleanFileName}`;

  const { error: uploadError } = await supabase.storage
    .from('event-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('event-media')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
