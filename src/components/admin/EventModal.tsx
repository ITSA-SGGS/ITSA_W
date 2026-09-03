import React, { useState, useEffect, useRef } from 'react';
import { SampleEvent, EventFormData, DbEventCategory, EventStatus } from '../../types';
import { uploadEventCoverImage } from '../../services/eventsService';
import { X, Upload, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  event: SampleEvent | null; // null for create, SampleEvent for edit
  onClose: () => void;
  onSave: (data: EventFormData) => Promise<void>;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(event);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    category: 'TECHNICAL',
    year: new Date().getFullYear(),
    event_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    registration_url: '',
    cover_image_url: '',
    status: 'UPCOMING',
    is_published: true,
    is_featured: false,
    display_order: 0,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate form when event changes or modal opens
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: (event.category as DbEventCategory) || 'TECHNICAL',
        year: event.year || String(new Date().getFullYear()),
        event_date: event.event_date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        venue: event.venue || '',
        registration_url: event.registration_url || '',
        cover_image_url: event.cover_image_url || '',
        status: (event.status as EventStatus) || 'UPCOMING',
        is_published: event.is_published ?? true,
        is_featured: Boolean(event.is_featured),
        display_order: event.display_order ?? 0,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'TECHNICAL',
        year: new Date().getFullYear(),
        event_date: '',
        start_time: '',
        end_time: '',
        venue: '',
        registration_url: '',
        cover_image_url: '',
        status: 'UPCOMING',
        is_published: true,
        is_featured: false,
        display_order: 0,
      });
    }
    setErrorMessage(null);
  }, [event, isOpen]);

  // Modal body scroll lock & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMessage(null);
      const publicUrl = await uploadEventCoverImage(file);
      setFormData((prev) => ({ ...prev, cover_image_url: publicUrl }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMessage('Event Title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0D0F] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-6 sm:p-10 shadow-2xl space-y-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-6 border-b border-black/10 dark:border-white/10">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold">
              // {isEditing ? 'EDIT RECORD' : 'CREATE RECORD'}
            </span>
            <h2 id="event-modal-title" className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              {isEditing ? 'Edit Event' : 'Add New Event'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-xl text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 01: Event Identity */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              01 // EVENT IDENTITY
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. TECHNOVA 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as DbEventCategory })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                >
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="CULTURAL">CULTURAL</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Tenure Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief editorial summary of symposium objectives, challenge sets, or match format..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all resize-y"
              />
            </div>
          </div>

          {/* Section 02: Schedule & Venue */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              02 // SCHEDULE &amp; VENUE
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Event Date
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Venue / Location
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. IT Seminar Hall / Computing Lab 2"
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
              />
            </div>
          </div>

          {/* Section 03: Status, Publication & Ordering */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              03 // PUBLICATION &amp; STATUS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Event Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none font-mono text-xs">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-black/20 text-[#0072CE] focus:ring-[#0072CE]"
                />
                <span>Publish on Website (Publicly Visible)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none font-mono text-xs">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded border-black/20 text-[#0072CE] focus:ring-[#0072CE]"
                />
                <span>Featured Event Highlight</span>
              </label>
            </div>
          </div>

          {/* Section 04: Registration Link */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              04 // REGISTRATION
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Registration URL (Optional)
              </label>
              <input
                type="url"
                value={formData.registration_url}
                onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                placeholder="https://forms.google.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
              />
            </div>
          </div>

          {/* Section 05: Cover Image Upload */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              05 // MEDIA ASSETS (SUPABASE STORAGE)
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Preview Thumbnail */}
              <div className="w-28 h-28 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {formData.cover_image_url ? (
                  <img
                    src={formData.cover_image_url}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#6E6E73]" />
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 font-mono text-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading Image...' : 'Upload Cover File'}</span>
                  </button>

                  {formData.cover_image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                      className="font-mono text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <p className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93]">
                  Allowed: JPEG, PNG, WebP, AVIF · Max size 10MB · Uploads directly to 'event-media' storage bucket.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3 font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-6 py-2.5 rounded-xl bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 active:scale-95 transition-all font-semibold shadow-sm"
            >
              {submitting ? 'Saving Event...' : isEditing ? 'Update Event Record' : 'Create Event Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
