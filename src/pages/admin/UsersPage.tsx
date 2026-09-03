import React, { useState, useMemo } from 'react';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { useAuth } from '../../hooks/useAuth';
import { AdminProfile, AdminRole } from '../../types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminLoadingState } from '../../components/admin/AdminLoadingState';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { AdminUserModal } from '../../components/admin/AdminUserModal';
import {
  ShieldCheck,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  UserPlus,
  Lock,
  Key,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { isSuperAdmin, user: currentAuthUser } = useAuth();
  const { users, loading, updateUser, toggleActive, revokeAccess } = useAdminUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminProfile | null>(null);

  // Revoke modal states
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState<AdminProfile | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
      return matchSearch && matchRole;
    });
  }, [users, searchQuery, selectedRole]);

  // Handle Save
  const handleSaveUser = async (
    id: string,
    data: { role?: AdminRole; is_active?: boolean; full_name?: string }
  ) => {
    if (!isSuperAdmin) {
      addToast('error', 'Only SUPER_ADMIN accounts can modify administrative permissions.');
      return;
    }

    try {
      await updateUser(id, data);
      addToast('success', 'Admin profile authorization updated successfully.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update admin profile.');
    }
  };

  // Handle Active Status Toggle
  const handleToggleActive = async (targetUser: AdminProfile) => {
    if (!isSuperAdmin) {
      addToast('error', 'Only SUPER_ADMIN accounts can alter account active status.');
      return;
    }

    try {
      const nextStatus = !targetUser.is_active;
      await toggleActive(targetUser.id, Boolean(targetUser.is_active));
      addToast(
        'info',
        nextStatus
          ? `Activated portal access for ${targetUser.email}.`
          : `Deactivated portal access for ${targetUser.email}.`
      );
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update account status.');
    }
  };

  // Handle Revoke Confirmation
  const confirmRevoke = async () => {
    if (!isSuperAdmin) {
      addToast('error', 'Only SUPER_ADMIN accounts can revoke administrative profiles.');
      return;
    }
    if (!userToRevoke) return;

    try {
      setIsRevoking(true);
      await revokeAccess(userToRevoke.id);
      addToast('success', `Revoked administrative profile for ${userToRevoke.email}.`);
      setRevokeModalOpen(false);
      setUserToRevoke(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to revoke admin profile.');
    } finally {
      setIsRevoking(false);
    }
  };

  if (loading && users.length === 0) {
    return <AdminLoadingState message="FETCHING ADMINISTRATIVE ACCESS ROSTER // ITSA CMS" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Feedback */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <AdminPageHeader
        eyebrow="SYSTEM AUTHORIZATION"
        title="Admin Users &amp; Roles"
        description="Manage administrative identities, assign RBAC access levels (SUPER_ADMIN, ADMIN, EDITOR), and control portal authorization."
      />

      {!isSuperAdmin && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3 text-amber-600 dark:text-amber-400 font-mono text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Note: User and Role Management is in read-only mode. Modifying administrative access levels requires <strong>SUPER_ADMIN</strong> permissions.
          </span>
        </div>
      )}

      {/* Provisioning Notice Card */}
      <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-[#0072CE] dark:text-[#38BDF8] font-semibold text-xs tracking-wider uppercase">
          <Key className="w-4 h-4" />
          <span>Secure Admin Provisioning Architecture</span>
        </div>
        <p className="text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed">
          Admin access is tied directly to PostgreSQL Row Level Security. To grant a new administrator access, invite the user via your Supabase Authentication dashboard (or Auth API), then assign their appropriate role (<code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">SUPER_ADMIN</code>, <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">ADMIN</code>, or <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">EDITOR</code>) below.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <input
            type="text"
            placeholder="Search by email, name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-[11px]">
          {['ALL', 'SUPER_ADMIN', 'ADMIN', 'EDITOR'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                selectedRole === r
                  ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <AdminTable
        headers={['Account / Identifier', 'Assigned Role', 'Authorization Scope', 'Status', 'Enlisted Date', 'Actions']}
        isEmpty={filteredUsers.length === 0}
        emptyTitle="No administrator records found"
        emptyDescription="No authorized administrator accounts match your filter criteria."
      >
        {filteredUsers.map((targetUser) => {
          const isCurrentUser = targetUser.id === currentAuthUser?.id;
          const isActive = targetUser.is_active;

          return (
            <tr
              key={targetUser.id}
              className={`hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors group ${
                !isActive ? 'opacity-60 bg-black/[0.01] dark:bg-white/[0.01]' : ''
              }`}
            >
              {/* Account Email & Name */}
              <td className="px-5 py-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-xs text-[#111113] dark:text-[#F5F5F7]">
                      {targetUser.email}
                    </span>
                    {isCurrentUser && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#0072CE]/10 text-[#0072CE] dark:text-[#38BDF8] font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] block font-sans">
                    {targetUser.full_name || 'Standard Administrator'}
                  </span>
                </div>
              </td>

              {/* Role Badge */}
              <td className="px-5 py-4 whitespace-nowrap">
                <span
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold tracking-wider ${
                    targetUser.role === 'SUPER_ADMIN'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                      : targetUser.role === 'ADMIN'
                      ? 'bg-[#0072CE]/10 text-[#0072CE] dark:text-[#38BDF8] border border-[#0072CE]/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {targetUser.role}
                </span>
              </td>

              {/* Authorization Scope Description */}
              <td className="px-5 py-4 text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                {targetUser.role === 'SUPER_ADMIN' && 'Full Portal, User RBAC & Global Settings'}
                {targetUser.role === 'ADMIN' && 'Events, People, Positions, Archive & Notices'}
                {targetUser.role === 'EDITOR' && 'Events & Announcements Dispatch'}
              </td>

              {/* Active Toggle Button */}
              <td className="px-5 py-4 whitespace-nowrap">
                <button
                  type="button"
                  disabled={!isSuperAdmin}
                  onClick={() => handleToggleActive(targetUser)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
                  }`}
                  title={isSuperAdmin ? (isActive ? 'Click to deactivate' : 'Click to activate') : 'Read-only'}
                >
                  {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{isActive ? 'Active' : 'Deactivated'}</span>
                </button>
              </td>

              {/* Enlisted Date */}
              <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-[#6E6E73]">
                {new Date(targetUser.created_at).toLocaleDateString()}
              </td>

              {/* Actions */}
              <td className="px-5 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => {
                      setSelectedUserForEdit(targetUser);
                      setModalOpen(true);
                    }}
                    className={`p-1.5 rounded-lg border border-black/10 dark:border-white/10 transition-colors ${
                      isSuperAdmin
                        ? 'hover:bg-black/5 dark:hover:bg-white/5 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                        : 'opacity-40 cursor-not-allowed text-neutral-400'
                    }`}
                    title="Edit Role & Permissions"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={!isSuperAdmin || (isCurrentUser && targetUser.role === 'SUPER_ADMIN')}
                    onClick={() => {
                      setUserToRevoke(targetUser);
                      setRevokeModalOpen(true);
                    }}
                    className={`p-1.5 rounded-lg border border-red-500/20 transition-colors ${
                      isSuperAdmin && !(isCurrentUser && targetUser.role === 'SUPER_ADMIN')
                        ? 'hover:bg-red-500/10 text-red-500'
                        : 'opacity-30 cursor-not-allowed text-neutral-400'
                    }`}
                    title={
                      isCurrentUser && targetUser.role === 'SUPER_ADMIN'
                        ? 'Cannot revoke own SUPER_ADMIN account'
                        : 'Revoke Admin Profile'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Edit Role Modal */}
      <AdminUserModal
        isOpen={modalOpen}
        user={selectedUserForEdit}
        onClose={() => {
          setModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        onSave={handleSaveUser}
      />

      {/* Revoke Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={revokeModalOpen}
        title="Revoke Admin Access?"
        itemName={userToRevoke?.email || ''}
        isDeleting={isRevoking}
        onConfirm={confirmRevoke}
        onCancel={() => {
          setRevokeModalOpen(false);
          setUserToRevoke(null);
        }}
      />
    </div>
  );
};
