import React, { useEffect } from 'react';
import { GalleryItem } from '../types';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useArchive } from '../hooks/useArchive';
import { resolveArchiveImageUrl } from '../services/archiveService';

interface LightboxModalProps {
  item: GalleryItem | null;
  items?: GalleryItem[];
  onClose: () => void;
  onSelect: (item: GalleryItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ item, items: propItems, onClose, onSelect }) => {
  const { items: hookItems } = useArchive();
  const galleryItems = propItems && propItems.length > 0 ? propItems : hookItems;

  useEffect(() => {
    if (!item) return;

    // Lock background scrolling while lightbox is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (galleryItems.length > 0) {
        if (e.key === 'ArrowRight') {
          const idx = galleryItems.findIndex((g) => g.id === item.id);
          const nextIndex = idx >= 0 ? (idx + 1) % galleryItems.length : 0;
          const next = galleryItems[nextIndex];
          if (next) onSelect(next);
        }
        if (e.key === 'ArrowLeft') {
          const idx = galleryItems.findIndex((g) => g.id === item.id);
          const prevIndex = idx >= 0 ? (idx - 1 + galleryItems.length) % galleryItems.length : 0;
          const prev = galleryItems[prevIndex];
          if (prev) onSelect(prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [item, onClose, onSelect, galleryItems]);

  if (!item) return null;

  const currentIndex = galleryItems.findIndex((g) => g.id === item.id);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-4 sm:p-8 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* Top Bar */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between z-20 text-white font-mono text-xs pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="text-[#38BDF8] font-semibold tracking-wider">ITSA ARCHIVE</span>
          <span className="text-neutral-500">/</span>
          <span className="text-neutral-300">RECORD {item.index || `0${safeIndex + 1}`}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-neutral-400 font-mono text-[11px] hidden sm:inline-block">
            {safeIndex + 1} of {galleryItems.length}
          </span>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const prev = galleryItems[(safeIndex - 1 + galleryItems.length) % galleryItems.length];
          if (prev) onSelect(prev);
        }}
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white transition-all z-20 hidden sm:flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
        aria-label="Previous image"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          const next = galleryItems[(safeIndex + 1) % galleryItems.length];
          if (next) onSelect(next);
        }}
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white transition-all z-20 hidden sm:flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
        aria-label="Next image"
      >
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Main Image View */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-6xl max-h-[84vh] flex flex-col items-center justify-center z-10 space-y-3"
      >
        <img
          src={resolveArchiveImageUrl(item.image_url || item.image)}
          alt={item.title || 'ITSA Documentary Archive Photo'}
          className="max-w-full max-h-[70vh] sm:max-h-[74vh] object-contain rounded-xl shadow-2xl border border-white/10"
        />

        {/* Caption bar */}
        <div className="text-center space-y-1 max-w-xl text-white">
          <div className="flex items-center justify-center gap-3 font-mono text-[11px] text-[#38BDF8]/90 tracking-wider">
            <span>RECORD 0{safeIndex + 1} OF 0{galleryItems.length}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-400">SGGSIE&amp;T RECORDS</span>
          </div>
          <span className="font-mono text-[10px] text-neutral-500 hidden sm:block pt-0.5">
            [ Esc to close · ← → to navigate ]
          </span>
        </div>
      </div>
    </div>
  );
};
