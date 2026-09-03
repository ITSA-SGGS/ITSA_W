import React, { useState, useMemo } from 'react';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { useAuth } from '../../hooks/useAuth';
import { Announcement, AnnouncementFormData } from '../../types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminLoadingState } from '../../components/admin/AdminLoadingState';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { AnnouncementModal } from '../../components/admin/AnnouncementModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  ExternalLink,
  ArrowUpDown,
  Bell,
} from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const canManage = Boolean(isAdmin);

  const {
    announcements,
    loading,
    createAnnouncement,
    updateAnnouncement,
    togglePublished,
    deleteAnnouncement,
  } = useAnnouncements({ adminMode: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'order' | 'newest' | 'title'>('order');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnnouncementForEdit, setSelectedAnnouncementForEdit] = useState<Announcement | null>(null);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
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

  // Filter and sort announcements
  const filteredAndSortedAnnouncements = useMemo(() => {
    const result = announcements.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.message && item.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.link_url && item.link_url.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'PUBLISHED' && item.is_published) ||
        (selectedStatus === 'DRAFT' && !item.is_published);

      return matchSearch && matchStatus;
    });

    return result.sort((a, b) => {
      if (sortBy === 'order') {
        const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
        return orderDiff !== 0 ? orderDiff : a.title.localeCompare(b.title);
      }
      if (sortBy === 'newest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [announcements, searchQuery, selectedStatus, sortBy]);

  // Handle Save
  const handleSaveAnnouncement = async (formData: AnnouncementFormData) => {
    if (!canManage) {
      addToast('error', 'You are not authorized to broadcast announcements.');
      return;
    }

    if (selectedAnnouncementForEdit) {
      await updateAnnouncement(selectedAnnouncementForEdit.id, formData);
      addToast('success', `Announcement "${formData.title}" updated successfully.`);
    } else {
      await createAnnouncement(formData);
      addToast('success', `Announcement "${formData.title}" dispatched successfully.`);
    }
  };

  // Handle Publication Toggle
  const handleTogglePublish = async (item: Announcement) => {
    if (!canManage) {
      addToast('error', 'You are not authorized to modify publication status.');
      return;
    }

    try {
      const nextState = !item.is_published;
      await togglePublished(item.id, Boolean(item.is_published));
      addToast(
        'info',
        nextState
          ? `Broadcasted announcement "${item.title}".`
          : `Unpublished announcement "${item.title}".`
      );
    } catch (err: any) {
      addToast('error', `Failed to update publication: ${err.message}`);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      setIsDeleting(true);
      await deleteAnnouncement(announcementToDelete.id);
      addToast('success', `Announcement "${announcementToDelete.title}" deleted.`);
      setDeleteModalOpen(false);
      setAnnouncementToDelete(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete announcement.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && announcements.length === 0) {
    return <AdminLoadingState message="FETCHING BROADCAST NOTICES // ITSA CMS" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Feedback */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <AdminPageHeader
        eyebrow="COMMUNICATION DISPATCH"
        title="Announcements"
        description="Broadcast departmental announcements, time-sensitive schedules, and semester notices."
        actionLabel={canManage ? '+ Broadcast Notice' : undefined}
        actionIcon={Plus}
        onAction={() => {
          setSelectedAnnouncementForEdit(null);
          setModalOpen(true);
        }}
      />

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <input
            type="text"
            placeholder="Search notices by title, message, link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
          />
        </div>

        {/* Filter and Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-[11px]">
            {['ALL', 'PUBLISHED', 'DRAFT'].map((st) => (
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
              <option value="newest">Newest</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements Table */}
      <AdminTable
        headers={['Order', 'Announcement Title', 'Message Details', 'Schedule / Expiry', 'Status', 'Actions']}
        isEmpty={filteredAndSortedAnnouncements.length === 0}
        emptyTitle="No announcements dispatched"
        emptyDescription="There are currently no active announcements matching your filter."
      >
        {filteredAndSortedAnnouncements.map((item, idx) => {
          const isPublished = item.is_published;

          return (
            <tr
              key={item.id}
              className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors group"
            >
              {/* Display Order */}
              <td className="px-5 py-3.5 text-[#6E6E73] font-semibold whitespace-nowrap">
                #{item.display_order ?? idx + 1}
              </td>

              {/* Title & Link */}
              <td className="px-5 py-3.5 min-w-[200px]">
                <div className="space-y-0.5">
                  <span className="font-display font-semibold text-sm text-[#111113] dark:text-[#F5F5F7] block">
                    {item.title}
                  </span>
                  {item.link_url && (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] hover:underline"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span className="truncate max-w-xs">{item.link_url}</span>
                    </a>
                  )}
                </div>
              </td>

              {/* Message */}
              <td className="px-5 py-3.5 text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-md">
                <span className="line-clamp-2 leading-relaxed">{item.message || '—'}</span>
              </td>

              {/* Published & Expiry dates */}
              <td className="px-5 py-3.5 whitespace-nowrap text-[#6E6E73] font-mono text-[11px]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Immediate'}</span>
                  </div>
                  {item.expires_at && (
                    <div className="text-[10px] text-neutral-400">
                      Exp: {new Date(item.expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </td>

              {/* Publication Status Toggle */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(item)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold transition-colors ${
                    isPublished
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
                  }`}
                  title={isPublished ? 'Click to unpublish' : 'Click to broadcast'}
                >
                  {isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{isPublished ? 'Published' : 'Draft'}</span>
                </button>
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnnouncementForEdit(item);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] transition-colors"
                    title="Edit Notice"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAnnouncementToDelete(item);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors"
                    title="Delete Notice"
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
      <AnnouncementModal
        isOpen={modalOpen}
        announcement={selectedAnnouncementForEdit}
        onClose={() => {
          setModalOpen(false);
          setSelectedAnnouncementForEdit(null);
        }}
        onSave={handleSaveAnnouncement}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Announcement?"
        itemName={announcementToDelete?.title || ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAnnouncementToDelete(null);
        }}
      />
    </div>
  );
};
