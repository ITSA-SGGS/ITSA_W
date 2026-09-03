import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GalleryItem, ArchiveFormData } from '../types';
import { GALLERY_ITEMS } from '../data/mockData';

/**
 * Resolves archive image URLs from Supabase Storage paths, absolute URLs, or local paths safely.
 */
export function resolveArchiveImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // If already an absolute HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it is a root-relative path (e.g. "/archive/WhatsApp..."), ensure proper URI encoding for spaces/parentheses
  if (trimmed.startsWith('/')) {
    try {
      return encodeURI(decodeURI(trimmed));
    } catch {
      return trimmed;
    }
  }

  // If it's a Supabase storage path like "archives/xyz.jpg"
  if (isSupabaseConfigured) {
    const { data } = supabase.storage.from('archive-media').getPublicUrl(trimmed);
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

// In-memory fallback representation for the 5 authentic ITSA archive photographs
let inMemoryArchive: GalleryItem[] = GALLERY_ITEMS.map((item, idx) => {
  const resolved = resolveArchiveImageUrl(item.image);
  return {
    ...item,
    image: resolved,
    image_url: resolved,
    event_name: 'ITSA Departmental Assembly',
    year: '2025–2026',
    display_order: idx + 1,
    is_published: true,
    created_at: new Date().toISOString(),
  };
});

function mapDbArchiveToApp(row: any, idx: number): GalleryItem {
  const indexNum = row.display_order ? String(row.display_order).padStart(2, '0') : String(idx + 1).padStart(2, '0');
  const resolved = resolveArchiveImageUrl(row.image_url);
  return {
    id: row.id,
    index: indexNum,
    title: row.title || `Archive Record ${indexNum}`,
    caption: row.description || undefined,
    description: row.description || null,
    year: row.year ? String(row.year) : '2025–2026',
    category: 'ARCHIVE',
    image: resolved,
    image_url: resolved,
    aspect: row.display_order === 1 || row.display_order === 2 ? 'wide' : 'square',
    meta: 'ITSA · SGGSIE&T Records',
    event_name: row.event_name || null,
    display_order: row.display_order ?? idx + 1,
    is_published: row.is_published ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ============================================================================
// PUBLIC READ QUERIES (Filtered strictly by is_published = true)
// ============================================================================

/**
 * Fetches published archive records from Supabase with graceful fallback to the 5 local photographs.
 */
export async function getPublishedArchiveRecords(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured) {
    return inMemoryArchive.filter((a) => a.is_published);
  }

  try {
    const { data, error } = await supabase
      .from('archive_records')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase query for archive records failed, using fallback:', error.message);
      return inMemoryArchive.filter((a) => a.is_published);
    }

    if (!data || data.length === 0) {
      return inMemoryArchive.filter((a) => a.is_published);
    }

    return data.map((row, i) => mapDbArchiveToApp(row, i));
  } catch (err) {
    console.warn('Failed to fetch archive records from Supabase, using mock fallback:', err);
    return inMemoryArchive.filter((a) => a.is_published);
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Governed by RLS)
// ============================================================================

/**
 * Fetches all archive records (both published and drafts) for the Admin Dashboard.
 */
export async function getAllAdminArchiveRecords(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured) {
    return [...inMemoryArchive].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  try {
    const { data, error } = await supabase
      .from('archive_records')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Admin archive fetch encountered an error, using fallback:', error.message);
      return [...inMemoryArchive].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    if (!data || data.length === 0) {
      return [...inMemoryArchive].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return data.map((row, i) => mapDbArchiveToApp(row, i));
  } catch (err) {
    console.warn('Failed to fetch admin archive records:', err);
    return [...inMemoryArchive].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
}

/**
 * Creates a new archive photograph record.
 */
export async function createArchiveRecord(formData: ArchiveFormData): Promise<GalleryItem> {
  if (!formData.image_url?.trim()) {
    throw new Error('Image URL or uploaded file is required for archive records.');
  }

  const payload = {
    title: formData.title?.trim() || null,
    description: formData.description?.trim() || null,
    image_url: formData.image_url.trim(),
    year: formData.year ? String(formData.year) : '2026',
    event_name: formData.event_name?.trim() || null,
    display_order: Number(formData.display_order) || 0,
    is_published: Boolean(formData.is_published),
  };

  if (!isSupabaseConfigured) {
    const nextIdx = inMemoryArchive.length + 1;
    const newMock: GalleryItem = {
      id: `mock-archive-${Date.now()}`,
      index: String(payload.display_order || nextIdx).padStart(2, '0'),
      title: payload.title || '',
      caption: payload.description || undefined,
      description: payload.description,
      year: payload.year,
      category: 'ARCHIVE',
      image: payload.image_url,
      image_url: payload.image_url,
      aspect: (payload.display_order === 1 || payload.display_order === 2) ? 'wide' : 'square',
      meta: 'ITSA · SGGSIE&T Records',
      event_name: payload.event_name,
      display_order: payload.display_order,
      is_published: payload.is_published,
      created_at: new Date().toISOString(),
    };
    inMemoryArchive = [...inMemoryArchive, newMock];
    return newMock;
  }

  const { data, error } = await (supabase
    .from('archive_records') as any)
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create archive record.');
  }

  return mapDbArchiveToApp(data, 0);
}

/**
 * Updates an existing archive photograph record.
 */
export async function updateArchiveRecord(
  id: string,
  formData: Partial<ArchiveFormData>
): Promise<GalleryItem> {
  const payload: any = {};
  if (formData.title !== undefined) payload.title = formData.title?.trim() || null;
  if (formData.description !== undefined) payload.description = formData.description?.trim() || null;
  if (formData.image_url !== undefined) payload.image_url = formData.image_url.trim();
  if (formData.year !== undefined) payload.year = formData.year ? String(formData.year) : null;
  if (formData.event_name !== undefined) payload.event_name = formData.event_name?.trim() || null;
  if (formData.display_order !== undefined) payload.display_order = Number(formData.display_order);
  if (formData.is_published !== undefined) payload.is_published = Boolean(formData.is_published);

  if (!isSupabaseConfigured) {
    inMemoryArchive = inMemoryArchive.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          ...payload,
          image: payload.image_url || item.image,
          image_url: payload.image_url || item.image_url,
        };
      }
      return item;
    });
    const updated = inMemoryArchive.find((a) => a.id === id)!;
    return updated;
  }

  const { data, error } = await (supabase
    .from('archive_records') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update archive record.');
  }

  return mapDbArchiveToApp(data, 0);
}

/**
 * Toggles publication status (is_published).
 */
export async function toggleArchivePublished(
  id: string,
  currentPublishedState: boolean
): Promise<GalleryItem> {
  return updateArchiveRecord(id, { is_published: !currentPublishedState });
}

/**
 * Deletes an archive photograph record.
 */
export async function deleteArchiveRecord(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    inMemoryArchive = inMemoryArchive.filter((a) => a.id !== id);
    return;
  }

  const { error } = await supabase
    .from('archive_records')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete archive record.');
  }
}

/**
 * Uploads an archive photograph to the 'archive-media' Supabase Storage bucket.
 */
export async function uploadArchiveImage(file: File): Promise<string> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WebP, or AVIF.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds 10MB limit.');
  }

  if (!isSupabaseConfigured) {
    return URL.createObjectURL(file);
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `archives/${cleanFileName}`;

  const { error: uploadError } = await supabase.storage
    .from('archive-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('archive-media')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
