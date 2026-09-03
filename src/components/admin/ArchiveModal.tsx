import React, { useState, useEffect, useRef } from 'react';
import { GalleryItem, ArchiveFormData } from '../../types';
import { uploadArchiveImage } from '../../services/archiveService';
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ArchiveModalProps {
  isOpen: boolean;
  item: GalleryItem | null; // null for create, GalleryItem for edit
  onClose: () => void;
  onSave: (data: ArchiveFormData) => Promise<void>;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(item);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ArchiveFormData>({
    title: '',
    description: '',
    image_url: '',
    year: '2025–2026',
    event_name: '',
    display_order: 0,
    is_published: true,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || item.caption || '',
        image_url: item.image_url || item.image || '',
        year: item.year || '2025–2026',
        event_name: item.event_name || '',
        display_order: item.display_order ?? 0,
        is_published: item.is_published ?? true,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        image_url: '',
        year: '2025–2026',
        event_name: '',
        display_order: 0,
        is_published: true,
      });
    }
    setErrorMessage(null);
  }, [item, isOpen]);

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
      const publicUrl = await uploadArchiveImage(file);
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      setErrorMessage('Archive photograph is required. Please upload an image.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save archive record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0D0F] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-6 sm:p-10 shadow-2xl space-y-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-black/10 dark:border-white/10">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold">
              // {isEditing ? 'EDIT ARCHIVE' : 'ADD PHOTOGRAPH'}
            </span>
            <h2 id="archive-modal-title" className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              {isEditing ? 'Edit Archive Record' : 'Upload Archive Photograph'}
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 01: Media Assets */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              01 // MEDIA ASSETS (SUPABASE STORAGE)
            </div>

            <div className="space-y-4">
              {/* Image Preview Container */}
              <div className="relative w-full h-56 sm:h-64 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden flex items-center justify-center">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Archive preview"
                    className="w-full h-full object-cover grayscale contrast-110"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#6E6E73] space-y-2">
                    <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                    <span className="font-mono text-xs">No photograph selected</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 font-mono text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? 'Uploading Image...' : formData.image_url ? 'Replace Photograph' : 'Upload Photograph'}</span>
                  </button>

                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="font-mono text-xs text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <p className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93]">
                  JPEG, PNG, WebP, AVIF · Max 10MB · Bucket: 'archive-media'
                </p>
              </div>
            </div>
          </div>

          {/* Section 02: Archive Information */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              02 // ARCHIVAL METADATA (OPTIONAL)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Archival Title
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. ITSA Annual Symposium 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Event / Milestone
                </label>
                <input
                  type="text"
                  value={formData.event_name || ''}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  placeholder="e.g. Techno-Cultural Inauguration"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Tenure / Year
                </label>
                <input
                  type="text"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2025–2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
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

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Archival Description / Caption
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Editorial context or historical significance note..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all resize-y"
              />
            </div>
          </div>

          {/* Section 03: Publication */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              03 // PUBLICATION SETTINGS
            </div>

            <div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none font-mono text-xs">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-black/20 text-[#0072CE] focus:ring-[#0072CE]"
                />
                <span>Publish to Public Documentary Gallery (Publicly Visible)</span>
              </label>
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
              {submitting ? 'Saving Archive...' : isEditing ? 'Update Archive Record' : 'Upload to Archive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
