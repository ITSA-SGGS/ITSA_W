import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CommitteeMember, CommitteeTier, MemberFormData } from '../types';
import {
  CORE_COMMITTEE,
  TY_LEADERSHIP,
  SY_COORDINATOR_GROUPS,
  FACULTY_DIGNITARIES,
} from '../data/mockData';

// Flattened initial fallback member roster
let inMemoryMembers: CommitteeMember[] = [
  ...CORE_COMMITTEE.map((m, idx) => ({
    ...m,
    photo_url: m.photo,
    display_order: idx + 1,
    is_active: true,
  })),
  ...TY_LEADERSHIP.map((m, idx) => ({
    ...m,
    photo_url: m.photo,
    display_order: idx + 6,
    is_active: true,
  })),
  ...SY_COORDINATOR_GROUPS.flatMap((g) => g.members).map((m, idx) => ({
    ...m,
    photo_url: m.photo,
    display_order: idx + 18,
    is_active: true,
  })),
  ...FACULTY_DIGNITARIES.map((f, idx) => ({
    id: f.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: f.name,
    position: f.position,
    photo: f.photo,
    photo_url: f.photo,
    tier: 'FACULTY' as const,
    domain: 'OVERALL',
    department: f.department,
    display_order: idx + 33,
    is_active: true,
  })),
];

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
  if (!isSupabaseConfigured) {
    return inMemoryMembers.filter((m) => m.is_active);
  }

  try {
    const { data, error } = await supabase
      .from('committee_members')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase query for committee members failed, using fallback:', error.message);
      return inMemoryMembers.filter((m) => m.is_active);
    }

    if (!data || data.length === 0) {
      return inMemoryMembers.filter((m) => m.is_active);
    }

    return data.map(mapDbMemberToApp);
  } catch (err) {
    console.warn('Failed to fetch committee members from Supabase, using mock fallback:', err);
    return inMemoryMembers.filter((m) => m.is_active);
  }
}

/**
 * Fetches active committee members by specific tier (CORE, TY_LEADERSHIP, SY_COORDINATOR, FACULTY)
 */
export async function getActiveCommitteeMembersByTier(
  tier: CommitteeTier
): Promise<CommitteeMember[]> {
  if (!isSupabaseConfigured) {
    return inMemoryMembers.filter((m) => m.is_active && m.tier === tier);
  }

  try {
    const { data, error } = await supabase
      .from('committee_members')
      .select('*')
      .eq('is_active', true)
      .eq('tier', tier)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn(`Supabase query for tier ${tier} failed, using fallback:`, error.message);
      return inMemoryMembers.filter((m) => m.is_active && m.tier === tier);
    }

    if (!data || data.length === 0) {
      return inMemoryMembers.filter((m) => m.is_active && m.tier === tier);
    }

    return data.map(mapDbMemberToApp);
  } catch (err) {
    console.warn(`Failed to fetch tier ${tier} members, using fallback:`, err);
    return inMemoryMembers.filter((m) => m.is_active && m.tier === tier);
  }
}

// ============================================================================
// ADMINISTRATIVE CRUD OPERATIONS (Governed by RLS)
// ============================================================================

/**
 * Fetches all members (including inactive members) for the Admin Dashboard.
 */
export async function getAllAdminMembers(): Promise<CommitteeMember[]> {
  if (!isSupabaseConfigured) {
    return [...inMemoryMembers].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  try {
    const { data, error } = await supabase
      .from('committee_members')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Admin members fetch encountered an error, using fallback:', error.message);
      return [...inMemoryMembers].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    if (!data || data.length === 0) {
      return [...inMemoryMembers].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return data.map(mapDbMemberToApp);
  } catch (err) {
    console.warn('Failed to fetch admin members:', err);
    return [...inMemoryMembers].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
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

  if (!isSupabaseConfigured) {
    const newMock: CommitteeMember = {
      id: `mock-member-${Date.now()}`,
      name: payload.name,
      position: payload.position,
      tier: payload.tier,
      domain: payload.domain,
      department: payload.department || undefined,
      photo: payload.photo_url || undefined,
      photo_url: payload.photo_url || undefined,
      linkedin_url: payload.linkedin_url || undefined,
      github_url: payload.github_url || undefined,
      tenure_year: payload.tenure_year,
      display_order: payload.display_order,
      is_active: payload.is_active,
    };
    inMemoryMembers = [...inMemoryMembers, newMock];
    return newMock;
  }

  const { data, error } = await (supabase
    .from('committee_members') as any)
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create committee member.');
  }

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

  if (!isSupabaseConfigured) {
    inMemoryMembers = inMemoryMembers.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          ...payload,
          photo: payload.photo_url || m.photo,
        };
      }
      return m;
    });
    const updated = inMemoryMembers.find((m) => m.id === id)!;
    return updated;
  }

  const { data, error } = await (supabase
    .from('committee_members') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update committee member.');
  }

  return mapDbMemberToApp(data);
}

/**
 * Toggles active/inactive status (is_active).
 */
export async function toggleMemberActive(
  id: string,
  currentStatus: boolean
): Promise<CommitteeMember> {
  return updateMember(id, { is_active: !currentStatus });
}

/**
 * Permanently deletes a committee member record.
 */
export async function deleteMember(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    inMemoryMembers = inMemoryMembers.filter((m) => m.id !== id);
    return;
  }

  const { error } = await supabase
    .from('committee_members')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete committee member.');
  }
}

/**
 * Uploads a profile portrait to the 'team-photos' Supabase Storage bucket.
 */
export async function uploadMemberPhoto(file: File): Promise<string> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WebP, or AVIF.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Photo size exceeds the 5MB limit.');
  }

  if (!isSupabaseConfigured) {
    return URL.createObjectURL(file);
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `portraits/${cleanFileName}`;

  const { error: uploadError } = await supabase.storage
    .from('team-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('team-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
