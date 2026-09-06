import { api } from '../lib/api';
import { AdminProfile, AdminRole } from '../types';

function mapDbAdminProfileToApp(row: any): AdminProfile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name || null,
    role: row.role as AdminRole,
    is_active: row.is_active ?? true,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

// ============================================================================
// ADMINISTRATIVE READ & MUTATION QUERIES (Restricted to SUPER_ADMIN / ADMIN)
// ============================================================================

/**
 * Fetches all admin profile records for user management.
 */
export async function getAllAdminProfiles(): Promise<AdminProfile[]> {
  try {
    const data = await api.get<any[]>('/api/admin/users');
    return (data || []).map(mapDbAdminProfileToApp);
  } catch (err) {
    console.error('Failed to fetch admin profiles from API:', err);
    return [];
  }
}

/**
 * Invites / creates a new administrator account.
 */
export async function inviteAdminUser(data: {
  email: string;
  password: string;
  full_name?: string | null;
  role?: AdminRole;
  is_active?: boolean;
}): Promise<AdminProfile> {
  const payload = {
    email: data.email.trim(),
    password: data.password,
    full_name: data.full_name?.trim() || null,
    role: data.role || 'ADMIN',
    is_active: data.is_active ?? true,
  };

  const res = await api.post<any>('/api/admin/users/invite', payload);
  return mapDbAdminProfileToApp(res);
}

/**
 * Updates an admin profile's role, name, or active status.
 */
export async function updateAdminProfile(
  id: string,
  data: { role?: AdminRole; is_active?: boolean; full_name?: string }
): Promise<AdminProfile> {
  const payload: any = {};
  if (data.role !== undefined) payload.role = data.role;
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  if (data.full_name !== undefined) payload.full_name = data.full_name?.trim() || null;

  const res = await api.put<any>(`/api/admin/users/${encodeURIComponent(id)}`, payload);
  return mapDbAdminProfileToApp(res);
}

/**
 * Toggles an admin account's active state.
 */
export async function toggleAdminActive(
  id: string,
  currentStatus: boolean
): Promise<AdminProfile> {
  const res = await api.patch<any>(`/api/admin/users/${encodeURIComponent(id)}/active`, {
    is_active: !currentStatus,
  });
  return mapDbAdminProfileToApp(res);
}

/**
 * Revokes admin authorization by deleting the admin user record.
 */
export async function revokeAdminProfile(id: string): Promise<void> {
  await api.delete<{ message: string }>(`/api/admin/users/${encodeURIComponent(id)}`);
}
