import { api } from '../lib/api';
import { CommitteeMember, CommitteeTier, MemberFormData } from '../types';
import { sanitizeUrl } from '../lib/security';

/**
 * Normalizes and sanitizes URL strings safely
 */
export function normalizeSocialUrl(url: string | null | undefined): string | null {
  return sanitizeUrl(url);
}

function mapDbMemberToApp(row: any): CommitteeMember {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    tier: row.tier,
    domain: row.domain || undefined,
    photo: row.photo_url || undefined,
    photo_url: row.photo_url || undefined,
    linkedin_url: row.linkedin_url || undefined,
    github_url: row.github_url || undefined,
    tenure_year: row.tenure_year || '2026–2027',
    department: row.department || undefined,
    display_order: row.display_order ?? 0,
    is_active: row.is_active ?? true,
  };
}

// ============================================================================
// PUBLIC READ QUERIES (Filtered strictly by is_active = true)
// ============================================================================

/**
 * Fetches all active committee members for the public website.
 */
export async function getActiveCommitteeMembers(): Promise<CommitteeMember[]> {
  try {
    const data = await api.get<any[]>('/api/team');
    return (data || []).map(mapDbMemberToApp);
  } catch (err) {
    console.error('Failed to fetch committee members from API:', err);
    return [];
  }
}

/**
 * Fetches active committee members by specific tier (CORE, TY_LEADERSHIP, SY_COORDINATOR, FACULTY)
 */
export async function getActiveCommitteeMembersByTier(
  tier: CommitteeTier
): Promise<CommitteeMember[]> {
  try {
    const data = await api.get<any[]>(`/api/team?tier=${encodeURIComponent(tier)}`);
    return (data || []).map(mapDbMemberToApp);
  } catch (err) {
    console.error(`Failed to fetch tier ${tier} members from API:`, err);
    return [];
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Governed by RLS)
// ============================================================================

/**
 * Fetches all members (including inactive members) for the Admin Dashboard.
 */
export async function getAllAdminMembers(): Promise<CommitteeMember[]> {
  const data = await api.get<any[]>('/api/admin/team?limit=100');
  return (data || []).map(mapDbMemberToApp);
}

/**
 * Creates a new committee member record.
 */
export async function createMember(formData: MemberFormData): Promise<CommitteeMember> {
  const payload = {
    name: formData.name.trim(),
    position: formData.position.trim(),
    tier: formData.tier,
    domain: formData.domain?.trim() || 'OVERALL',
    department: formData.department?.trim() || null,
    photo_url: formData.photo_url?.trim() || null,
    linkedin_url: normalizeSocialUrl(formData.linkedin_url),
    github_url: normalizeSocialUrl(formData.github_url),
    tenure_year: formData.tenure_year?.trim() || '2026–2027',
    display_order: Number(formData.display_order) || 0,
    is_active: Boolean(formData.is_active),
  };

  const data = await api.post<any>('/api/admin/team', payload);
  return mapDbMemberToApp(data);
}

/**
 * Updates an existing committee member record.
 */
export async function updateMember(
  id: string,
  formData: Partial<MemberFormData>
): Promise<CommitteeMember> {
  const payload: any = {};
  if (formData.name !== undefined) payload.name = formData.name.trim();
  if (formData.position !== undefined) payload.position = formData.position.trim();
  if (formData.tier !== undefined) payload.tier = formData.tier;
  if (formData.domain !== undefined) payload.domain = formData.domain?.trim() || 'OVERALL';
  if (formData.department !== undefined) payload.department = formData.department?.trim() || null;
  if (formData.photo_url !== undefined) payload.photo_url = formData.photo_url?.trim() || null;
  if (formData.linkedin_url !== undefined) payload.linkedin_url = normalizeSocialUrl(formData.linkedin_url);
  if (formData.github_url !== undefined) payload.github_url = normalizeSocialUrl(formData.github_url);
  if (formData.tenure_year !== undefined) payload.tenure_year = formData.tenure_year?.trim() || '2026–2027';
  if (formData.display_order !== undefined) payload.display_order = Number(formData.display_order);
  if (formData.is_active !== undefined) payload.is_active = Boolean(formData.is_active);

  const data = await api.put<any>(`/api/admin/team/${id}`, payload);
  return mapDbMemberToApp(data);
}

/**
 * Toggles active/inactive status (is_active).
 */
export async function toggleMemberActive(
  id: string,
  currentStatus: boolean
): Promise<CommitteeMember> {
  const data = await api.patch<any>(`/api/admin/team/${id}/active`, { is_active: !currentStatus });
  return mapDbMemberToApp(data);
}

/**
 * Permanently deletes a committee member record.
 */
export async function deleteMember(id: string): Promise<void> {
  await api.delete(`/api/admin/team/${id}`);
}

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
 * Uploads a team member portrait using the backend Express media API.
 * Permitted for ADMIN and SUPER_ADMIN.
 */
export async function uploadMemberPhoto(file: File): Promise<string> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WebP, or AVIF.');
  }

  // Enforce 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Photo size exceeds the 5MB limit.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<MediaUploadResult>('/api/admin/media/upload/team', formData);
  return res.url;
}
