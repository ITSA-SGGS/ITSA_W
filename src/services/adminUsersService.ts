import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminProfile, AdminRole } from '../types';

let inMemoryAdminUsers: AdminProfile[] = [
  {
    id: 'user-super-1',
    email: 'admin@sggs.ac.in',
    full_name: 'Lead Department Administrator',
    role: 'SUPER_ADMIN',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-admin-1',
    email: 'itsa.council@sggs.ac.in',
    full_name: 'ITSA Executive Council',
    role: 'ADMIN',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-editor-1',
    email: 'media.desk@sggs.ac.in',
    full_name: 'Editorial & Publicity Desk',
    role: 'EDITOR',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
// ADMINISTRATIVE READ & MUTATION QUERIES (Restricted to SUPER_ADMIN via RLS)
// ============================================================================

/**
 * Fetches all admin profile records for user management.
 */
export async function getAllAdminProfiles(): Promise<AdminProfile[]> {
  if (!isSupabaseConfigured) {
    return [...inMemoryAdminUsers];
  }

  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase admin_profiles query error, using fallback:', error.message);
      return [...inMemoryAdminUsers];
    }

    if (!data || data.length === 0) {
      return [...inMemoryAdminUsers];
    }

    return data.map(mapDbAdminProfileToApp);
  } catch (err) {
    console.warn('Failed to fetch admin profiles from Supabase:', err);
    return [...inMemoryAdminUsers];
  }
}

/**
 * Updates an admin profile's role, name, or active status.
 */
export async function updateAdminProfile(
  id: string,
  data: { role?: AdminRole; is_active?: boolean; full_name?: string }
): Promise<AdminProfile> {
  // Safety guard: ensure we don't deactivate or demote the last SUPER_ADMIN
  const currentProfiles = await getAllAdminProfiles();
  const target = currentProfiles.find((p) => p.id === id);
  if (target?.role === 'SUPER_ADMIN') {
    const activeSuperAdmins = currentProfiles.filter(
      (p) => p.role === 'SUPER_ADMIN' && p.is_active && p.id !== id
    );
    if ((data.is_active === false || (data.role && data.role !== 'SUPER_ADMIN')) && activeSuperAdmins.length === 0) {
      throw new Error(
        'Cannot deactivate or demote the only remaining active SUPER_ADMIN account.'
      );
    }
  }

  if (!isSupabaseConfigured) {
    inMemoryAdminUsers = inMemoryAdminUsers.map((u) => {
      if (u.id === id) {
        return {
          ...u,
          role: data.role || u.role,
          is_active: data.is_active !== undefined ? data.is_active : u.is_active,
          full_name: data.full_name !== undefined ? data.full_name : u.full_name,
          updated_at: new Date().toISOString(),
        };
      }
      return u;
    });
    const updated = inMemoryAdminUsers.find((u) => u.id === id)!;
    return updated;
  }

  const payload: any = {
    updated_at: new Date().toISOString(),
  };
  if (data.role !== undefined) payload.role = data.role;
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  if (data.full_name !== undefined) payload.full_name = data.full_name;

  const { data: updatedDb, error } = await (supabase
    .from('admin_profiles') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update admin profile.');
  }

  return mapDbAdminProfileToApp(updatedDb);
}

/**
 * Toggles an admin account's active state.
 */
export async function toggleAdminActive(
  id: string,
  currentStatus: boolean
): Promise<AdminProfile> {
  return updateAdminProfile(id, { is_active: !currentStatus });
}

/**
 * Revokes admin authorization by deleting the admin_profiles record.
 */
export async function revokeAdminProfile(id: string): Promise<void> {
  const currentProfiles = await getAllAdminProfiles();
  const target = currentProfiles.find((p) => p.id === id);
  if (target?.role === 'SUPER_ADMIN') {
    const remainingSuperAdmins = currentProfiles.filter(
      (p) => p.role === 'SUPER_ADMIN' && p.is_active && p.id !== id
    );
    if (remainingSuperAdmins.length === 0) {
      throw new Error('Cannot revoke access for the last remaining SUPER_ADMIN account.');
    }
  }

  if (!isSupabaseConfigured) {
    inMemoryAdminUsers = inMemoryAdminUsers.filter((u) => u.id !== id);
    return;
  }

  const { error } = await supabase
    .from('admin_profiles')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to revoke admin profile.');
  }
}
