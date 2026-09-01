import React, { useEffect } from 'react';
import { GalleryItem } from '../types';
import { X, ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { GALLERY_ITEMS } from '../data/mockData';

interface LightboxModalProps {
  item: GalleryItem | null;
  onClose: () => void;
  onSelect: (item: GalleryItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ item, onClose, onSelect }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        const idx = GALLERY_ITEMS.findIndex((g) => g.id === item.id);
        const next = GALLERY_ITEMS[(idx + 1) % GALLERY_ITEMS.length];
        onSelect(next);
      }
      if (e.key === 'ArrowLeft') {
        const idx = GALLERY_ITEMS.findIndex((g) => g.id === item.id);
        const prev = GALLERY_ITEMS[(idx - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length];
        onSelect(prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose, onSelect]);

  if (!item) return null;

  const currentIndex = GALLERY_ITEMS.findIndex((g) => g.id === item.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg animate-fade-in p-4 sm:p-8 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* Top Bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 text-white font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[#35FF7A] font-semibold">{item.category}</span>
          <span className="text-neutral-500">/</span>
          <span className="text-neutral-400">ARCHIVE {item.year}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-neutral-400">
            {currentIndex + 1} of {GALLERY_ITEMS.length}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => {
          const prev = GALLERY_ITEMS[(currentIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length];
          onSelect(prev);
        }}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors z-20 hidden sm:block"
        aria-label="Previous image"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => {
          const next = GALLERY_ITEMS[(currentIndex + 1) % GALLERY_ITEMS.length];
          onSelect(next);
        }}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors z-20 hidden sm:block"
        aria-label="Next image"
      >
        <ArrowRight className="w-6 h-6" />
      </button>

      {/* Main Image View */}
      <div className="max-w-5xl max-h-[82vh] flex flex-col items-center justify-center z-10 space-y-4">
        <img
          src={item.image}
          alt={item.title}
          className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-2xl border border-white/10"
        />

        {/* Caption bar */}
        <div className="text-center space-y-1 max-w-2xl text-white">
          <h3 className="font-display font-semibold text-lg sm:text-xl tracking-tight">
            {item.title}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 font-light">
            {item.caption}
          </p>
          <span className="font-mono text-[11px] text-[#35FF7A]/80 block pt-1">
            {item.meta} · SGGSIE&T Records
          </span>
        </div>
      </div>
    </div>
  );
};
