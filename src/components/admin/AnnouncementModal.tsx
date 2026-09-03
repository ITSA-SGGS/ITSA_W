import React, { useState, useEffect } from 'react';
import { Announcement, AnnouncementFormData } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  announcement: Announcement | null; // null for create, Announcement for edit
  onClose: () => void;
  onSave: (data: AnnouncementFormData) => Promise<void>;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  announcement,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(announcement);

  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    message: '',
    link_url: '',
    is_published: true,
    published_at: '',
    expires_at: '',
    display_order: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        message: announcement.message || '',
        link_url: announcement.link_url || '',
        is_published: announcement.is_published ?? true,
        published_at: announcement.published_at ? announcement.published_at.substring(0, 10) : '',
        expires_at: announcement.expires_at ? announcement.expires_at.substring(0, 10) : '',
        display_order: announcement.display_order ?? 0,
      });
    } else {
      setFormData({
        title: '',
        message: '',
        link_url: '',
        is_published: true,
        published_at: new Date().toISOString().substring(0, 10),
        expires_at: '',
        display_order: 0,
      });
    }
    setErrorMessage(null);
  }, [announcement, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMessage('Announcement Title cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0D0F] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-6 sm:p-10 shadow-2xl space-y-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-black/10 dark:border-white/10">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold">
              // {isEditing ? 'EDIT NOTICE' : 'BROADCAST NOTICE'}
            </span>
            <h2 id="announcement-modal-title" className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              {isEditing ? 'Edit Announcement' : 'New Announcement'}
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
          {/* Section 01: Specification */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              01 // BROADCAST SPECIFICATION
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Announcement Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Technical Symposium Registration Deadline Extended"
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Message / Details
              </label>
              <textarea
                rows={3}
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Official broadcast message, guidelines, or schedule note..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Action Link URL (Optional)
              </label>
              <input
                type="url"
                value={formData.link_url || ''}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://forms.google.com/... or https://itsa.sggs.ac.in/..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
              />
            </div>
          </div>

          {/* Section 02: Timeframe & Publication */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              02 // TIMEFRAME &amp; PUBLICATION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Publication Date
                </label>
                <input
                  type="date"
                  value={formData.published_at || ''}
                  onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expires_at || ''}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>
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

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none font-mono text-xs">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-black/20 text-[#0072CE] focus:ring-[#0072CE]"
                />
                <span>Publish to Public Notice Broadcast (Publicly Visible)</span>
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
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 active:scale-95 transition-all font-semibold shadow-sm"
            >
              {submitting ? 'Saving Notice...' : isEditing ? 'Update Notice' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
