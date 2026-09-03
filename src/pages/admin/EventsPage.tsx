import React, { useState, useMemo } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { SampleEvent, EventFormData, DbEventCategory, EventStatus } from '../../types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminLoadingState } from '../../components/admin/AdminLoadingState';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { EventModal } from '../../components/admin/EventModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  // Use admin mode to retrieve all events including drafts
  const {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    togglePublish,
    toggleFeature,
  } = useEvents({ adminMode: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'order' | 'date' | 'title'>('order');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<SampleEvent | null>(null);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SampleEvent | null>(null);
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

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    const result = events.filter((evt) => {
      const matchSearch =
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.venue && evt.venue.toLowerCase().includes(searchQuery.toLowerCase()));

      const evtCat = (evt.category || 'TECHNICAL').toUpperCase();
      const matchCategory =
        selectedCategory === 'ALL' || evtCat.includes(selectedCategory);

      const evtStatus = (evt.status || 'UPCOMING').toUpperCase();
      const matchStatus =
        selectedStatus === 'ALL' || evtStatus === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });

    return result.sort((a, b) => {
      if (sortBy === 'order') {
        return (a.display_order ?? 0) - (b.display_order ?? 0);
      }
      if (sortBy === 'date') {
        const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
        const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [events, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Handle Create or Update save
  const handleSaveEvent = async (formData: EventFormData) => {
    if (selectedEventForEdit) {
      await updateEvent(selectedEventForEdit.id, formData);
      addToast('success', `Event "${formData.title}" updated successfully.`);
    } else {
      await createEvent(formData);
      addToast('success', `Event "${formData.title}" created successfully.`);
    }
  };

  // Handle Publication Toggle
  const handleTogglePublish = async (evt: SampleEvent) => {
    try {
      const nextState = !evt.is_published;
      await togglePublish(evt.id, Boolean(evt.is_published));
      addToast(
        'info',
        nextState ? `Published "${evt.title}" to public site.` : `Unpublished "${evt.title}".`
      );
    } catch (err: any) {
      addToast('error', `Failed to update publication: ${err.message}`);
    }
  };

  // Handle Featured Toggle
  const handleToggleFeature = async (evt: SampleEvent) => {
    try {
      const nextState = !evt.is_featured;
      await toggleFeature(evt.id, Boolean(evt.is_featured));
      addToast(
        'info',
        nextState ? `Marked "${evt.title}" as featured.` : `Removed "${evt.title}" from featured.`
      );
    } catch (err: any) {
      addToast('error', `Failed to update featured flag: ${err.message}`);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      await deleteEvent(eventToDelete.id);
      addToast('success', `Event "${eventToDelete.title}" permanently deleted.`);
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (err: any) {
      addToast('error', `Failed to delete event: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && events.length === 0) {
    return <AdminLoadingState message="FETCHING ITSA EVENTS // CATALOGUE" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Feedback */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <AdminPageHeader
        eyebrow="EVENTS CATALOGUE"
        title="Events Management"
        description="Manage the ITSA event catalogue across Technical symposiums, Sports fixtures, and Cultural evenings."
        actionLabel="+ Add Event"
        actionIcon={Plus}
        onAction={() => {
          setSelectedEventForEdit(null);
          setModalOpen(true);
        }}
      />

      {/* Filter, Search and Sorting Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <input
            type="text"
            placeholder="Search by title, description, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
          />
        </div>

        {/* Filter Capsules */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-[11px]">
            {['ALL', 'TECHNICAL', 'SPORTS', 'CULTURAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-[11px]">
            {['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED', 'DRAFT'].map((st) => (
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
              <option value="date">Date</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table (Desktop & Tablet) */}
      <AdminTable
        headers={['Order', 'Event', 'Category', 'Date / Venue', 'Status', 'Visibility', 'Featured', 'Actions']}
        isEmpty={filteredAndSortedEvents.length === 0}
        emptyTitle="No matching events found"
        emptyDescription="Try adjusting your search query, discipline filter, or status filter."
      >
        {filteredAndSortedEvents.map((evt, idx) => {
          const isPublished = Boolean(evt.is_published);
          const isFeatured = Boolean(evt.is_featured);

          return (
            <tr
              key={evt.id}
              className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors group"
            >
              {/* Display Order */}
              <td className="px-5 py-4 text-[#6E6E73] font-semibold whitespace-nowrap">
                #{evt.display_order ?? idx + 1}
              </td>

              {/* Title & Description */}
              <td className="px-5 py-4 min-w-[220px]">
                <div className="space-y-0.5">
                  <span className="font-display font-semibold text-sm text-[#111113] dark:text-[#F5F5F7] block">
                    {evt.title}
                  </span>
                  <span className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] line-clamp-1">
                    {evt.description || 'No description provided.'}
                  </span>
                </div>
              </td>

              {/* Category */}
              <td className="px-5 py-4 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#0072CE]/10 text-[#0072CE] dark:text-[#38BDF8]">
                  {evt.category || 'TECHNICAL'}
                </span>
              </td>

              {/* Date & Venue */}
              <td className="px-5 py-4 whitespace-nowrap text-[#6E6E73]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{evt.event_date || evt.year || '2026'}</span>
                  </div>
                  {evt.venue && (
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <MapPin className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[120px]">{evt.venue}</span>
                    </div>
                  )}
                </div>
              </td>

              {/* Status */}
              <td className="px-5 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                    evt.status === 'UPCOMING'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : evt.status === 'ONGOING'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : evt.status === 'COMPLETED'
                      ? 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {evt.status || 'UPCOMING'}
                </span>
              </td>

              {/* Publication Toggle */}
              <td className="px-5 py-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(evt)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono text-[10px] font-semibold transition-colors ${
                    isPublished
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
                  }`}
                  title={isPublished ? 'Click to unpublish' : 'Click to publish on website'}
                >
                  {isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{isPublished ? 'Published' : 'Draft'}</span>
                </button>
              </td>

              {/* Featured Toggle */}
              <td className="px-5 py-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleToggleFeature(evt)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFeatured
                      ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-neutral-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title={isFeatured ? 'Featured event (Click to unset)' : 'Click to mark as featured'}
                >
                  <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-500' : ''}`} />
                </button>
              </td>

              {/* Actions: Edit & Delete */}
              <td className="px-5 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEventForEdit(evt);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] transition-colors"
                    title="Edit Event"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventToDelete(evt);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors"
                    title="Delete Event"
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
      <EventModal
        isOpen={modalOpen}
        event={selectedEventForEdit}
        onClose={() => {
          setModalOpen(false);
          setSelectedEventForEdit(null);
        }}
        onSave={handleSaveEvent}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Event?"
        itemName={eventToDelete?.title || ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setEventToDelete(null);
        }}
      />
    </div>
  );
};
