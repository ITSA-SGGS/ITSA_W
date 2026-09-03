import React, { useState, useMemo } from 'react';
import { usePositions } from '../../hooks/usePositions';
import { useAuth } from '../../hooks/useAuth';
import { Position, PositionFormData, CommitteeTier } from '../../types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminLoadingState } from '../../components/admin/AdminLoadingState';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { PositionModal } from '../../components/admin/PositionModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Lock,
  Layers,
} from 'lucide-react';

export const PositionsPage: React.FC = () => {
  const { adminProfile, isAdmin } = useAuth();
  const canManage = Boolean(isAdmin && adminProfile?.role !== 'EDITOR');
  const isSuperAdmin = Boolean(isAdmin && adminProfile?.role === 'SUPER_ADMIN');

  const {
    positions,
    loading,
    createPosition,
    updatePosition,
    toggleActive,
    deletePosition,
  } = usePositions({ adminMode: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'tier'>('order');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
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

  // Filter and sort positions
  const filteredAndSortedPositions = useMemo(() => {
    const result = positions.filter((pos) => {
      const matchSearch =
        pos.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pos.domain && (pos.domain as string).toLowerCase().includes(searchQuery.toLowerCase())) ||
        (pos.description && pos.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTier = selectedTier === 'ALL' || pos.tier === selectedTier;

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && pos.is_active) ||
        (selectedStatus === 'INACTIVE' && !pos.is_active);

      return matchSearch && matchTier && matchStatus;
    });

    return result.sort((a, b) => {
      if (sortBy === 'order') {
        const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
        return orderDiff !== 0 ? orderDiff : a.name.localeCompare(b.name);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'tier') {
        return a.tier.localeCompare(b.tier);
      }
      return 0;
    });
  }, [positions, searchQuery, selectedTier, selectedStatus, sortBy]);

  // Handle Save
  const handleSavePosition = async (formData: PositionFormData) => {
    if (!canManage) {
      addToast('error', 'EDITOR role is not authorized to modify positions.');
      return;
    }

    if (selectedPositionForEdit) {
      await updatePosition(selectedPositionForEdit.id, formData);
      addToast('success', `Position "${formData.name}" updated successfully.`);
    } else {
      await createPosition(formData);
      addToast('success', `Position "${formData.name}" created successfully.`);
    }
  };

  // Handle Active/Inactive Toggle
  const handleToggleActive = async (pos: Position) => {
    if (!canManage) {
      addToast('error', 'EDITOR role is not authorized to modify positions.');
      return;
    }

    try {
      const nextStatus = !pos.is_active;
      await toggleActive(pos.id, Boolean(pos.is_active));
      addToast(
        'info',
        nextStatus
          ? `Reactivated position "${pos.name}".`
          : `Deactivated position "${pos.name}".`
      );
    } catch (err: any) {
      addToast('error', `Failed to update position status: ${err.message}`);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!isSuperAdmin) {
      addToast('error', 'Permanent deletion requires SUPER_ADMIN privileges. Please deactivate instead.');
      return;
    }
    if (!positionToDelete) return;

    try {
      setIsDeleting(true);
      await deletePosition(positionToDelete.id, positionToDelete.name);
      addToast('success', `Position "${positionToDelete.name}" permanently deleted.`);
      setDeleteModalOpen(false);
      setPositionToDelete(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete position.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && positions.length === 0) {
    return <AdminLoadingState message="FETCHING ITSA ORGANIZATIONAL STRUCTURE // POSITIONS" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Feedback */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <AdminPageHeader
        eyebrow="ORGANIZATIONAL HIERARCHY"
        title="Positions &amp; Roles"
        description="Manage the official leadership positions, tier classifications, and portfolios of the ITSA committee structure."
        actionLabel={canManage ? '+ Add Position' : undefined}
        actionIcon={Plus}
        onAction={() => {
          setSelectedPositionForEdit(null);
          setModalOpen(true);
        }}
      >
        {!canManage && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-mono text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only Mode (EDITOR)</span>
          </div>
        )}
      </AdminPageHeader>

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <input
            type="text"
            placeholder="Search by title, domain, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
          />
        </div>

        {/* Filters */}
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
              <option value="name">Title</option>
              <option value="tier">Tier</option>
            </select>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <AdminTable
        headers={['Order', 'Position Title', 'Tier Level', 'Domain Portfolio', 'Description', 'Status', 'Actions']}
        isEmpty={filteredAndSortedPositions.length === 0}
        emptyTitle="No positions found"
        emptyDescription="Try adjusting your search query or tier filters."
      >
        {filteredAndSortedPositions.map((pos, idx) => {
          const isActive = pos.is_active;

          return (
            <tr
              key={pos.id}
              className={`hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors group ${
                !isActive ? 'opacity-60 bg-black/[0.01] dark:bg-white/[0.01]' : ''
              }`}
            >
              {/* Display Order */}
              <td className="px-5 py-3.5 text-[#6E6E73] font-semibold whitespace-nowrap">
                #{pos.display_order ?? idx + 1}
              </td>

              {/* Name */}
              <td className="px-5 py-3.5 font-display font-semibold text-sm text-[#111113] dark:text-[#F5F5F7] whitespace-nowrap">
                {pos.name}
              </td>

              {/* Tier */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  {pos.tier}
                </span>
              </td>

              {/* Domain */}
              <td className="px-5 py-3.5 text-[#0072CE] dark:text-[#38BDF8] font-semibold whitespace-nowrap font-mono text-xs">
                {pos.domain || 'OVERALL'}
              </td>

              {/* Description */}
              <td className="px-5 py-3.5 text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-xs">
                <span className="line-clamp-1">{pos.description || '—'}</span>
              </td>

              {/* Status Toggle Button */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => handleToggleActive(pos)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
                  }`}
                  title={canManage ? (isActive ? 'Click to deactivate' : 'Click to reactivate') : 'Read-only'}
                >
                  {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{isActive ? 'Active' : 'Inactive'}</span>
                </button>
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => {
                      setSelectedPositionForEdit(pos);
                      setModalOpen(true);
                    }}
                    className={`p-1.5 rounded-lg border border-black/10 dark:border-white/10 transition-colors ${
                      canManage
                        ? 'hover:bg-black/5 dark:hover:bg-white/5 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                        : 'opacity-40 cursor-not-allowed text-neutral-400'
                    }`}
                    title="Edit Position"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => {
                      setPositionToDelete(pos);
                      setDeleteModalOpen(true);
                    }}
                    className={`p-1.5 rounded-lg border border-red-500/20 transition-colors ${
                      isSuperAdmin
                        ? 'hover:bg-red-500/10 text-red-500'
                        : 'opacity-30 cursor-not-allowed text-neutral-400'
                    }`}
                    title={
                      isSuperAdmin
                        ? 'Permanently Delete Position (Safe deletion)'
                        : 'Permanent deletion requires SUPER_ADMIN'
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

      {/* Create / Edit Modal */}
      <PositionModal
        isOpen={modalOpen}
        position={selectedPositionForEdit}
        onClose={() => {
          setModalOpen(false);
          setSelectedPositionForEdit(null);
        }}
        onSave={handleSavePosition}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Position Record?"
        itemName={positionToDelete?.name || ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPositionToDelete(null);
        }}
      />
    </div>
  );
};
