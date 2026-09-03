import React, { useState, useMemo } from 'react';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../hooks/useAuth';
import { CommitteeMember, MemberFormData, CommitteeTier } from '../../types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminLoadingState } from '../../components/admin/AdminLoadingState';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { PersonModal } from '../../components/admin/PersonModal';
import { LinkedinIcon, GithubIcon } from '../../components/Icons';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Lock,
  ExternalLink,
} from 'lucide-react';

export const PeoplePage: React.FC = () => {
  const { adminProfile, isAdmin } = useAuth();
  const canManagePeople = Boolean(isAdmin && adminProfile?.role !== 'EDITOR');

  const {
    members,
    loading,
    createMember,
    updateMember,
    toggleActive,
    deleteMember,
  } = useTeam({ adminMode: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'position'>('order');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<CommitteeMember | null>(null);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<CommitteeMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    const result = members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.domain && m.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTier = selectedTier === 'ALL' || m.tier === selectedTier;

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && m.is_active) ||
        (selectedStatus === 'INACTIVE' && !m.is_active);

      return matchSearch && matchTier && matchStatus;
    });

    return result.sort((a, b) => {
      if (sortBy === 'order') {
        return (a.display_order ?? 0) - (b.display_order ?? 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'position') {
        return a.position.localeCompare(b.position);
      }
      return 0;
    });
  }, [members, searchQuery, selectedTier, selectedStatus, sortBy]);

  // Handle Create or Update save
  const handleSaveMember = async (formData: MemberFormData) => {
    if (!canManagePeople) {
      addToast('error', 'EDITOR role is not authorized to modify committee records.');
      return;
    }

    if (selectedMemberForEdit) {
      await updateMember(selectedMemberForEdit.id, formData);
      addToast('success', `Member "${formData.name}" updated successfully.`);
    } else {
      await createMember(formData);
      addToast('success', `Member "${formData.name}" enlisted successfully.`);
    }
  };

  // Handle Active/Inactive Status Toggle
  const handleToggleActive = async (member: CommitteeMember) => {
    if (!canManagePeople) {
      addToast('error', 'EDITOR role is not authorized to modify committee records.');
      return;
    }

    try {
      const nextStatus = !member.is_active;
      await toggleActive(member.id, Boolean(member.is_active));
      addToast(
        'info',
        nextStatus
          ? `Reactivated "${member.name}" on public committee roster.`
          : `Deactivated "${member.name}" from public roster.`
      );
    } catch (err: any) {
      addToast('error', `Failed to update member status: ${err.message}`);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!canManagePeople) {
      addToast('error', 'EDITOR role is not authorized to delete committee records.');
      return;
    }
    if (!memberToDelete) return;

    try {
      setIsDeleting(true);
      await deleteMember(memberToDelete.id);
      addToast('success', `Member "${memberToDelete.name}" permanently deleted.`);
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    } catch (err: any) {
      addToast('error', `Failed to delete member: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && members.length === 0) {
    return <AdminLoadingState message="FETCHING COMMITTEE ROSTER // MEMBERS" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Feedback */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <AdminPageHeader
        eyebrow="ORGANIZATIONAL ROSTER"
        title="Committee &amp; People"
        description="Manage the ITSA committee, portfolio coordinators, and faculty advisors for the academic tenure year."
        actionLabel={canManagePeople ? '+ Add Person' : undefined}
        actionIcon={Plus}
        onAction={() => {
          setSelectedMemberForEdit(null);
          setModalOpen(true);
        }}
      >
        {!canManagePeople && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-mono text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only Mode (EDITOR)</span>
          </div>
        )}
      </AdminPageHeader>

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <input
            type="text"
            placeholder="Search by name, position or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
          />
        </div>

        {/* Filter Capsules */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tier Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-[11px]">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'CORE', label: 'Core' },
              { key: 'TY_LEADERSHIP', label: 'TY' },
              { key: 'SY_COORDINATOR', label: 'SY' },
              { key: 'FACULTY', label: 'Faculty' },
            ].map((tier) => (
              <button
                key={tier.key}
                onClick={() => setSelectedTier(tier.key)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  selectedTier === tier.key
                    ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-[11px]">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  selectedStatus === st
                    ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-[11px] text-[#6E6E73]">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent focus:outline-none text-[#111113] dark:text-[#F5F5F7] font-semibold cursor-pointer"
            >
              <option value="order">Order</option>
              <option value="name">Name</option>
              <option value="position">Position</option>
            </select>
          </div>
        </div>
      </div>

      {/* People Table */}
      <AdminTable
        headers={['Order', 'Member', 'Position', 'Tier', 'Domain / Dept', 'Social Links', 'Status', 'Actions']}
        isEmpty={filteredAndSortedMembers.length === 0}
        emptyTitle="No committee members found"
        emptyDescription="Try adjusting your search query or tier filters."
      >
        {filteredAndSortedMembers.map((member, idx) => {
          const isActive = member.is_active ?? true;
          const photoSrc = member.photo_url || member.photo;
          const initials = member.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          return (
            <tr
              key={member.id}
              className={`hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors group ${
                !isActive ? 'opacity-60 bg-black/[0.01] dark:bg-white/[0.01]' : ''
              }`}
            >
              {/* Display Order */}
              <td className="px-5 py-3.5 text-[#6E6E73] font-semibold whitespace-nowrap">
                #{member.display_order ?? idx + 1}
              </td>

              {/* Avatar + Full Name */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt={member.name}
                        className="w-full h-full object-cover grayscale"
                      />
                    ) : (
                      <span className="font-display font-semibold text-xs text-[#111113] dark:text-[#F5F5F7]">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-display font-semibold text-sm text-[#111113] dark:text-[#F5F5F7] block">
                      {member.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93]">
                      {member.tenure_year || '2026–2027'}
                    </span>
                  </div>
                </div>
              </td>

              {/* Position */}
              <td className="px-5 py-3.5 text-[#0072CE] dark:text-[#38BDF8] font-semibold whitespace-nowrap">
                {member.position}
              </td>

              {/* Tier */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  {member.tier}
                </span>
              </td>

              {/* Domain / Department */}
              <td className="px-5 py-3.5 text-[#6E6E73] whitespace-nowrap">
                {member.domain || member.department || 'OVERALL'}
              </td>

              {/* Social Links (Rendered only when present) */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View LinkedIn Profile"
                      className="p-1 rounded text-[#0072CE] dark:text-[#38BDF8] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <LinkedinIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.github_url && (
                    <a
                      href={member.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View GitHub Profile"
                      className="p-1 rounded text-[#111113] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <GithubIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {!member.linkedin_url && !member.github_url && (
                    <span className="text-[10px] text-neutral-400">—</span>
                  )}
                </div>
              </td>

              {/* Active / Inactive Status Button */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <button
                  type="button"
                  disabled={!canManagePeople}
                  onClick={() => handleToggleActive(member)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
                  }`}
                  title={canManagePeople ? (isActive ? 'Click to deactivate' : 'Click to reactivate') : 'Read-only'}
                >
                  {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{isActive ? 'Active' : 'Inactive'}</span>
                </button>
              </td>

              {/* Actions: Edit & Delete */}
              <td className="px-5 py-3.5 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    disabled={!canManagePeople}
                    onClick={() => {
                      setSelectedMemberForEdit(member);
                      setModalOpen(true);
                    }}
                    className={`p-1.5 rounded-lg border border-black/10 dark:border-white/10 transition-colors ${
                      canManagePeople
                        ? 'hover:bg-black/5 dark:hover:bg-white/5 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                        : 'opacity-40 cursor-not-allowed text-neutral-400'
                    }`}
                    title="Edit Member"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={!canManagePeople}
                    onClick={() => {
                      setMemberToDelete(member);
                      setDeleteModalOpen(true);
                    }}
                    className={`p-1.5 rounded-lg border border-red-500/20 transition-colors ${
                      canManagePeople
                        ? 'hover:bg-red-500/10 text-red-500'
                        : 'opacity-40 cursor-not-allowed text-neutral-400'
                    }`}
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Create / Edit Person Modal */}
      <PersonModal
        isOpen={modalOpen}
        member={selectedMemberForEdit}
        onClose={() => {
          setModalOpen(false);
          setSelectedMemberForEdit(null);
        }}
        onSave={handleSaveMember}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Committee Member?"
        itemName={memberToDelete?.name || ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
      />
    </div>
  );
};
