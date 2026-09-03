import React, { useState, useMemo } from 'react';
import { useArchive } from '../../hooks/useArchive';
import { useAuth } from '../../hooks/useAuth';
import { GalleryItem, ArchiveFormData } from '../../types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminLoadingState } from '../../components/admin/AdminLoadingState';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { ArchiveModal } from '../../components/admin/ArchiveModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Layers,
  ArrowUpDown,
  Lock,
  Image as ImageIcon,
} from 'lucide-react';

export const ArchivePage: React.FC = () => {
  const { adminProfile, isAdmin } = useAuth();
  const canManage = Boolean(isAdmin && adminProfile?.role !== 'EDITOR');

  const {
    items,
    loading,
    createArchiveRecord,
    updateArchiveRecord,
    togglePublished,
    deleteArchiveRecord,
  } = useArchive({ adminMode: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'order' | 'newest' | 'oldest' | 'title'>('order');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<GalleryItem | null>(null);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);
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

  // Filter and sort archive records
  const filteredAndSortedItems = useMemo(() => {
    const result = items.filter((item) => {
      const title = item.title || '';
      const eventName = item.event_name || '';
      const description = item.description || item.caption || '';
      const year = String(item.year || '');

      const matchSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        year.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'PUBLISHED' && item.is_published) ||
        (selectedStatus === 'DRAFT' && !item.is_published);

      return matchSearch && matchStatus;
    });

    return result.sort((a, b) => {
      if (sortBy === 'order') {
        const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
        return orderDiff !== 0 ? orderDiff : (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'newest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === 'title') {
        return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
      }
      return 0;
    });
  }, [items, searchQuery, selectedStatus, sortBy]);

  // Handle Save
  const handleSaveArchive = async (formData: ArchiveFormData) => {
    if (!canManage) {
      addToast('error', 'EDITOR role is not authorized to modify archive records.');
      return;
    }

    if (selectedItemForEdit) {
      await updateArchiveRecord(selectedItemForEdit.id, formData);
      addToast('success', 'Archive record updated successfully.');
    } else {
      await createArchiveRecord(formData);
      addToast('success', 'Archive photograph uploaded successfully.');
    }
  };

  // Handle Publication Toggle
  const handleTogglePublish = async (item: GalleryItem) => {
    if (!canManage) {
      addToast('error', 'EDITOR role is not authorized to modify archive records.');
      return;
    }

    try {
      const nextState = !item.is_published;
      await togglePublished(item.id, Boolean(item.is_published));
      addToast(
        'info',
        nextState
          ? `Published archive photograph #${item.display_order ?? ''} to website.`
          : `Unpublished archive photograph #${item.display_order ?? ''}.`
      );
    } catch (err: any) {
      addToast('error', `Failed to update publication status: ${err.message}`);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!canManage) {
      addToast('error', 'EDITOR role is not authorized to delete archive records.');
      return;
    }
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await deleteArchiveRecord(itemToDelete.id);
      addToast('success', 'Archive photograph permanently removed.');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete archive item.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && items.length === 0) {
    return <AdminLoadingState message="FETCHING ITSA ARCHIVAL MEDIA // PHOTOGRAPHS" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Feedback */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <AdminPageHeader
        eyebrow="DOCUMENTARY ARCHIVE"
        title="Visual Archive"
        description="Curate the historical photographs, department symposiums, and milestone moments of ITSA."
        actionLabel={canManage ? '+ Upload Archive' : undefined}
        actionIcon={Plus}
        onAction={() => {
          setSelectedItemForEdit(null);
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

      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <input
            type="text"
            placeholder="Search by title, event name, year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
          />
        </div>

        {/* Filter Capsules */}
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
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Media Grid */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-black/15 dark:border-white/15 rounded-2xl space-y-3">
          <ImageIcon className="w-10 h-10 mx-auto text-[#6E6E73]" />
          <h3 className="font-display font-semibold text-lg">No archive photographs found</h3>
          <p className="font-mono text-xs text-[#6E6E73]">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedItems.map((item, idx) => {
            const isPublished = item.is_published ?? true;
            const displayTitle = item.title || 'UNTITLED ARCHIVE';

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-black/20 dark:hover:border-white/20 transition-all duration-300"
              >
                {/* Media Image Container */}
                <div className="relative w-full h-56 bg-black/5 dark:bg-white/5 overflow-hidden">
                  <img
                    src={item.image_url || item.image}
                    alt={displayTitle}
                    className="w-full h-full object-cover grayscale contrast-110 group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Order Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                    #{item.display_order ?? idx + 1}
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => handleTogglePublish(item)}
                      className={`px-2.5 py-1 rounded-md backdrop-blur-md font-mono text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${
                        isPublished
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-neutral-800/80 text-neutral-300'
                      }`}
                      title={canManage ? (isPublished ? 'Click to unpublish' : 'Click to publish') : 'Read-only'}
                    >
                      {isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{isPublished ? 'Published' : 'Draft'}</span>
                    </button>
                  </div>
                </div>

                {/* Content & Metadata */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display font-bold text-base text-[#111113] dark:text-[#F5F5F7] line-clamp-1">
                        {displayTitle}
                      </h4>
                      {item.year && (
                        <span className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] shrink-0">
                          {item.year}
                        </span>
                      )}
                    </div>

                    {item.event_name && (
                      <p className="font-mono text-[11px] text-[#0072CE] dark:text-[#38BDF8] line-clamp-1 font-semibold">
                        {item.event_name}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => {
                        setSelectedItemForEdit(item);
                        setModalOpen(true);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 font-mono text-xs transition-colors ${
                        canManage
                          ? 'hover:bg-black/5 dark:hover:bg-white/5 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                          : 'opacity-40 cursor-not-allowed text-neutral-400'
                      }`}
                      title="Edit Archive Record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => {
                        setItemToDelete(item);
                        setDeleteModalOpen(true);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 font-mono text-xs transition-colors ${
                        canManage
                          ? 'hover:bg-red-500/10 text-red-500'
                          : 'opacity-40 cursor-not-allowed text-neutral-400'
                      }`}
                      title="Delete Archive Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ArchiveModal
        isOpen={modalOpen}
        item={selectedItemForEdit}
        onClose={() => {
          setModalOpen(false);
          setSelectedItemForEdit(null);
        }}
        onSave={handleSaveArchive}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Archive Photograph?"
        itemName={itemToDelete?.title || `Photograph #${itemToDelete?.display_order || ''}`}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
};
