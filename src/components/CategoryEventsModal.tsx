import React, { useEffect } from 'react';
import { EventCategoryType } from '../types';
import { SAMPLE_TECHNICAL_EVENTS, SAMPLE_SPORTS_EVENTS, SAMPLE_CULTURAL_EVENTS } from '../data/mockData';
import { X } from 'lucide-react';

interface CategoryEventsModalProps {
  category: EventCategoryType | null;
  onClose: () => void;
}

export const CategoryEventsModal: React.FC<CategoryEventsModalProps> = ({ category, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && category) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [category, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (category) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [category]);

  if (!category) return null;

  let events = SAMPLE_TECHNICAL_EVENTS;
  let categoryTag = 'SYSTEMS & SPRINT LABS';

  if (category === 'TECHNICAL EVENTS') {
    events = SAMPLE_TECHNICAL_EVENTS;
    categoryTag = 'SYSTEMS & SPRINT LABS';
  } else if (category === 'SPORTS EVENTS') {
    events = SAMPLE_SPORTS_EVENTS;
    categoryTag = 'ATHLETICS & FIXTURES';
  } else if (category === 'CULTURAL EVENTS') {
    events = SAMPLE_CULTURAL_EVENTS;
    categoryTag = 'CREATIVE & COMMUNITY SESSIONS';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[#F5F5F2] dark:bg-[#0A0A0C] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-6 sm:p-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Close Button */}
        <div className="flex items-start justify-between pb-6 border-b border-black/10 dark:border-white/10 mb-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase mb-1.5">
              <span>// EVENT DIRECTORY</span>
              <span>·</span>
              <span>{categoryTag}</span>
            </div>
            <h2 id="category-title" className="text-2xl sm:text-4xl font-display font-bold tracking-tight">
              {category}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event List Rows */}
        <div className="divide-y divide-black/10 dark:divide-white/10">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="py-6 sm:py-8 group transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015] px-2 rounded-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-baseline">
                {/* Index + Year */}
                <div className="md:col-span-2 flex items-baseline gap-4 font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                  <span className="text-sm font-semibold text-[#0072CE] dark:text-[#38BDF8]">
                    {evt.index}
                  </span>
                  <span>{evt.year}</span>
                </div>

                {/* Title + Subtitle */}
                <div className="md:col-span-4 space-y-0.5">
                  <h3 className="text-lg sm:text-xl font-display font-semibold text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8] transition-colors">
                    {evt.title}
                  </h3>
                  <span className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider block">
                    {evt.subtitle}
                  </span>
                </div>

                {/* Description */}
                <div className="md:col-span-6">
                  <p className="text-xs sm:text-sm text-[#48484E] dark:text-[#A1A1A6] font-normal leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info bar */}
        <div className="pt-8 mt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#6E6E73] dark:text-[#8E8E93]">
          <span>SAMPLE ACTIVITIES · SCHEDULE SUBJECT TO SEMESTER NOTIFICATIONS</span>
          <button
            onClick={onClose}
            className="hover:text-[#111113] dark:hover:text-[#F5F5F7] font-semibold uppercase tracking-wider transition-colors"
          >
            CLOSE ×
          </button>
        </div>
      </div>
    </div>
  );
};
