import { useState, useEffect, useCallback } from 'react';
import { AdminProfile, AdminRole } from '../types';
import {
  getAllAdminProfiles,
  updateAdminProfile as serviceUpdateProfile,
  toggleAdminActive as serviceToggleActive,
  revokeAdminProfile as serviceRevokeProfile,
} from '../services/adminUsersService';

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllAdminProfiles();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUser = async (
    id: string,
    data: { role?: AdminRole; is_active?: boolean; full_name?: string }
  ): Promise<AdminProfile> => {
    const updated = await serviceUpdateProfile(id, data);
    await fetchUsers();
    return updated;
  };

  const handleToggleActive = async (id: string, currentStatus: boolean): Promise<AdminProfile> => {
    const updated = await serviceToggleActive(id, currentStatus);
    await fetchUsers();
    return updated;
  };

  const handleRevoke = async (id: string): Promise<void> => {
    await serviceRevokeProfile(id);
    await fetchUsers();
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUser: handleUpdateUser,
    toggleActive: handleToggleActive,
    revokeAccess: handleRevoke,
  };
}
