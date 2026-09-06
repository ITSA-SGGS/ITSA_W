import { api } from '../lib/api';
import { GalleryItem, ArchiveFormData } from '../types';

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
 * Synchronously resolves archive image URLs for immediate UI rendering safely.
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

  try {
    return encodeURI(decodeURI(`/${trimmed}`));
  } catch {
    return `/${trimmed}`;
  }
}

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
 * Fetches published archive records from the Express API.
 */
export async function getPublishedArchiveRecords(): Promise<GalleryItem[]> {
  try {
    const data = await api.get<any[]>('/api/archive?limit=100');
    return (data || []).map((row, i) => mapDbArchiveToApp(row, i));
  } catch (err) {
    console.error('Failed to fetch archive records from API:', err);
    return [];
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Governed by RLS)
// ============================================================================

/**
 * Fetches all archive records (both published and drafts) for the Admin Dashboard.
 */
export async function getAllAdminArchiveRecords(): Promise<GalleryItem[]> {
  const data = await api.get<any[]>('/api/admin/archive?limit=100');
  return (data || []).map((row, i) => mapDbArchiveToApp(row, i));
}

/**
 * Creates a new archive photograph record.
 */
export async function createArchiveRecord(formData: ArchiveFormData): Promise<GalleryItem> {
  if (!formData.image_url?.trim()) {
    throw new Error('Image URL or uploaded file is required for archive records.');
  }

  let parsedYear: number | null = null;
  if (formData.year !== undefined && formData.year !== null) {
    if (typeof formData.year === 'number') {
      parsedYear = formData.year;
    } else {
      const match = String(formData.year).match(/\b(19\d\d|20\d\d)\b/);
      parsedYear = match ? parseInt(match[0], 10) : null;
    }
  }

  const payload = {
    title: formData.title?.trim() || null,
    description: formData.description?.trim() || null,
    image_url: formData.image_url.trim(),
    year: parsedYear,
    event_name: formData.event_name?.trim() || null,
    display_order: Number(formData.display_order) || 0,
    is_published: Boolean(formData.is_published),
  };

  const data = await api.post<any>('/api/admin/archive', payload);
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
  if (formData.year !== undefined) {
    if (formData.year === null || formData.year === '') {
      payload.year = null;
    } else if (typeof formData.year === 'number') {
      payload.year = formData.year;
    } else {
      const match = String(formData.year).match(/\b(19\d\d|20\d\d)\b/);
      payload.year = match ? parseInt(match[0], 10) : null;
    }
  }
  if (formData.event_name !== undefined) payload.event_name = formData.event_name?.trim() || null;
  if (formData.display_order !== undefined) payload.display_order = Number(formData.display_order);
  if (formData.is_published !== undefined) payload.is_published = Boolean(formData.is_published);

  const data = await api.put<any>(`/api/admin/archive/${encodeURIComponent(id)}`, payload);
  return mapDbArchiveToApp(data, 0);
}

/**
 * Toggles publication status (is_published).
 */
export async function toggleArchivePublished(
  id: string,
  currentPublishedState: boolean
): Promise<GalleryItem> {
  const data = await api.patch<any>(`/api/admin/archive/${encodeURIComponent(id)}/publish`, {
    is_published: !currentPublishedState,
  });
  return mapDbArchiveToApp(data, 0);
}

/**
 * Deletes an archive photograph record.
 */
export async function deleteArchiveRecord(id: string): Promise<void> {
  await api.delete<{ message: string }>(`/api/admin/archive/${encodeURIComponent(id)}`);
}

/**
 * Uploads an archive photograph using the backend Express media API.
 * Permitted for ADMIN and SUPER_ADMIN.
 */
export async function uploadArchiveImage(file: File): Promise<string> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WebP, or AVIF.');
  }

  // Enforce 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds 10MB limit.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<MediaUploadResult>('/api/admin/media/upload/archive', formData);
  return res.url;
}
