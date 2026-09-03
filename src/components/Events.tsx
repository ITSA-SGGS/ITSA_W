import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GalleryItem } from '../types';
import { useEvents } from '../hooks/useEvents';
import {
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Layers,
  Code2,
  Trophy,
  Palette,
  Pause,
  Play,
} from 'lucide-react';

interface EventsProps {
  onSelectPhoto?: (item: GalleryItem) => void;
}

type EventCategoryKey = 'ALL' | 'TECHNICAL' | 'SPORTS' | 'CULTURAL';

interface CategoryTab {
  key: EventCategoryKey;
  code: string;
  label: string;
  categoryParam: string | null;
  icon: React.ElementType;
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    key: 'ALL',
    code: '00',
    label: 'ALL EVENTS',
    categoryParam: null,
    icon: Layers,
  },
  {
    key: 'TECHNICAL',
    code: '01',
    label: 'TECHNICAL',
    categoryParam: 'TECHNICAL',
    icon: Code2,
  },
  {
    key: 'SPORTS',
    code: '02',
    label: 'SPORTS',
    categoryParam: 'SPORTS',
    icon: Trophy,
  },
  {
    key: 'CULTURAL',
    code: '03',
    label: 'CULTURAL',
    categoryParam: 'CULTURAL',
    icon: Palette,
  },
];

const AUTOPLAY_DURATION_MS = 5500;

export const Events: React.FC<EventsProps> = ({ onSelectPhoto }) => {
  const [activeCategory, setActiveCategory] = useState<EventCategoryKey>('ALL');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPausedManually, setIsPausedManually] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Touch swipe refs
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const activeTabDef = useMemo(() => {
    return CATEGORY_TABS.find((tab) => tab.key === activeCategory) || CATEGORY_TABS[0];
  }, [activeCategory]);

  // Query events based on the active category (null for ALL)
  const { events, loading } = useEvents(activeTabDef.categoryParam);

  // Extract published photos strictly for this active category
  const publishedPhotos = useMemo(() => {
    const valid = events.filter((e) => Boolean(e.cover_image_url && e.cover_image_url.trim().length > 0));
    return valid.map((evt, idx): GalleryItem => {
      const categoryLabel = (evt.category || activeCategory).toUpperCase();
      return {
        id: evt.id,
        index: evt.index || String(idx + 1).padStart(2, '0'),
        title: evt.title,
        description: evt.description || null,
        caption: evt.venue ? `${evt.venue} · ${evt.year || '2026'}` : (evt.year ? `ITSA · ${evt.year}` : undefined),
        year: evt.year || '2026',
        category: categoryLabel,
        image: evt.cover_image_url!,
        image_url: evt.cover_image_url!,
        aspect: 'wide',
        meta: `ITSA // ${categoryLabel}`,
        event_name: evt.title,
        display_order: evt.display_order ?? idx + 1,
        is_published: evt.is_published ?? true,
      };
    });
  }, [events, activeCategory]);

  const totalPhotos = publishedPhotos.length;

  // Category switch handler: immediately resets index, progress, and restarts autoplay
  const handleCategoryChange = (newCategory: EventCategoryKey) => {
    if (newCategory === activeCategory) return;
    setActiveCategory(newCategory);
    setCurrentIndex(0);
    setProgress(0);
  };

  const goToNext = useCallback(() => {
    if (totalPhotos <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalPhotos);
    setProgress(0);
  }, [totalPhotos]);

  const goToPrev = useCallback(() => {
    if (totalPhotos <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
    setProgress(0);
  }, [totalPhotos]);

  // Keep index within bounds if photos length changes
  useEffect(() => {
    if (totalPhotos > 0 && currentIndex >= totalPhotos) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [totalPhotos, currentIndex]);

  // Autoplay and progress bar interval
  useEffect(() => {
    if (totalPhotos <= 1 || isHovered || isPausedManually || prefersReducedMotion) {
      return;
    }

    const intervalStepMs = 50;
    const progressIncrement = (intervalStepMs / AUTOPLAY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + progressIncrement >= 100) {
          goToNext();
          return 0;
        }
        return prev + progressIncrement;
      });
    }, intervalStepMs);

    return () => clearInterval(timer);
  }, [totalPhotos, isHovered, isPausedManually, prefersReducedMotion, goToNext]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    }
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const swipeThreshold = 40;

    if (diff > swipeThreshold) {
      // Swiped Left -> Next
      goToNext();
    } else if (diff < -swipeThreshold) {
      // Swiped Right -> Prev
      goToPrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const currentPhoto = totalPhotos > 0 ? publishedPhotos[currentIndex] : null;

  return (
    <section
      id="events"
      className="relative py-32 sm:py-48 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06] select-none"
    >
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-black/10 dark:border-white/10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
              <span className="text-[#0072CE] dark:text-[#38BDF8]">01</span>
              <span>/</span>
              <span>CALENDAR OF SESSIONS</span>
            </div>
            <h2 className="headline-section font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              Events.
            </h2>
          </div>

          <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-sm">
            Photographic archive and session collections across all technical disciplines, athletics, and cultural productions.
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 w-fit">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = activeCategory === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleCategoryChange(tab.key)}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-mono text-xs transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] ${
                  isSelected
                    ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-bold shadow-md shadow-black/10 dark:shadow-white/5 scale-[1.02]'
                    : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                }`}
                aria-pressed={isSelected}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0072CE] dark:text-[#38BDF8]' : ''}`} />
                <span className="tracking-wider">
                  {tab.code} // {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Large Cinematic Category Slideshow Container */}
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#EBEBE6]/60 dark:bg-[#0D0D0F] shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE]"
          role="region"
          aria-label={`${activeTabDef.label} Slideshow`}
        >
          {totalPhotos === 0 ? (
            /* Polished Minimalist Empty State */
            <div className="min-h-[380px] sm:min-h-[480px] lg:min-h-[560px] flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center text-[#0072CE] dark:text-[#38BDF8] bg-black/[0.02] dark:bg-white/[0.02]">
                <activeTabDef.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <span className="font-mono text-xs text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold block">
                  // MEDIA PENDING
                </span>
                <p className="text-sm sm:text-base font-display font-medium text-[#48484E] dark:text-[#A1A1A6] max-w-md">
                  Photographs for this category will appear here once published.
                </p>
              </div>
              <span className="font-mono text-[11px] text-[#6E6E73] dark:text-[#55555C]">
                SESSION CATEGORY: {activeTabDef.label}
              </span>
            </div>
          ) : (
            /* Photographic Slideshow View */
            <div className="relative min-h-[380px] sm:min-h-[500px] lg:min-h-[580px] h-[56vh] max-h-[660px] w-full overflow-hidden">
              {/* Image Slides with Smooth Crossfade */}
              {publishedPhotos.map((photo, idx) => {
                const isActive = idx === currentIndex;

                return (
                  <div
                    key={photo.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                    aria-hidden={!isActive}
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      className={`w-full h-full object-cover object-center ${
                        prefersReducedMotion
                          ? ''
                          : isActive
                          ? 'scale-[1.03] transition-transform duration-[6000ms] ease-out'
                          : 'scale-100'
                      }`}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />

                    {/* Gradient Atmosphere Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 pointer-events-none" />
                  </div>
                );
              })}

              {/* Top Navigation & Status Bar */}
              <div className="absolute top-4 sm:top-6 left-4 sm:left-8 right-4 sm:right-8 z-20 flex items-center justify-between text-white font-mono text-xs pointer-events-auto">
                {/* Category Pill Tag */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
                  <span className="text-[#38BDF8] font-semibold tracking-wider">
                    // {activeTabDef.label}
                  </span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/80">
                    {String(currentIndex + 1).padStart(2, '0')} / {String(totalPhotos).padStart(2, '0')}
                  </span>
                </div>

                {/* Right Quick Controls */}
                <div className="flex items-center gap-2">
                  {/* Pause / Resume Indicator */}
                  {totalPhotos > 1 && !prefersReducedMotion && (
                    <button
                      type="button"
                      onClick={() => setIsPausedManually(!isPausedManually)}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                      aria-label={isPausedManually ? 'Resume autoplay' : 'Pause autoplay'}
                      title={isPausedManually ? 'Resume autoplay' : 'Pause autoplay'}
                    >
                      {isPausedManually ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Expand / Lightbox Trigger */}
                  {currentPhoto && onSelectPhoto && (
                    <button
                      type="button"
                      onClick={() => onSelectPhoto(currentPhoto)}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                      aria-label="Expand photo in Lightbox"
                      title="View High Resolution Photo"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Left & Right Manual Navigation Arrows (Desktop / Tablet) */}
              {totalPhotos > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrev();
                    }}
                    className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                    aria-label="Previous photo"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                    aria-label="Next photo"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Bottom Editorial Caption & Metadata Overlay */}
              {currentPhoto && (
                <div
                  onClick={() => onSelectPhoto && onSelectPhoto(currentPhoto)}
                  className="absolute bottom-0 inset-x-0 z-20 p-6 sm:p-8 lg:p-10 flex flex-col justify-end text-white cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-[#38BDF8] tracking-widest uppercase">
                        <span>RECORD {currentPhoto.index}</span>
                        <span>·</span>
                        <span>{currentPhoto.category}</span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                        {currentPhoto.title}
                      </h3>

                      {currentPhoto.description && (
                        <p className="text-xs sm:text-sm text-white/80 font-normal line-clamp-2 leading-relaxed max-w-xl">
                          {currentPhoto.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata & Enlarge Prompt */}
                    <div className="flex flex-col sm:items-end font-mono text-[11px] text-white/70 space-y-1">
                      {currentPhoto.caption && (
                        <span className="text-white/90 font-medium">{currentPhoto.caption}</span>
                      )}
                      <span className="text-white/50 text-[10px]">
                        [ Click to view in Lightbox · Esc to close ]
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Automatic Progress Bar Indicator */}
              {totalPhotos > 1 && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 z-30 overflow-hidden">
                  <div
                    className="h-full bg-[#0072CE] dark:bg-[#38BDF8] transition-all ease-linear"
                    style={{
                      width: prefersReducedMotion ? '100%' : `${progress}%`,
                      transitionDuration: prefersReducedMotion ? '0ms' : '50ms',
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
