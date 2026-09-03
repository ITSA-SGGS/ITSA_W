import React from 'react';
import { useArchive } from '../hooks/useArchive';
import { GalleryItem } from '../types';
import { Maximize2 } from 'lucide-react';

interface GalleryProps {
  onSelectImage: (item: GalleryItem) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onSelectImage }) => {
  const { leadAnchor, secondaryAnchor, triptych } = useArchive();

  return (
    <section id="gallery" className="relative py-32 sm:py-48 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-black/10 dark:border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
              <span className="text-[#0072CE] dark:text-[#38BDF8]">05</span>
              <span>/</span>
              <span>VISUAL ARCHIVE</span>
            </div>
            <h2 className="headline-section font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              Documentary Records.
            </h2>
          </div>
          <p className="text-sm font-mono text-[#6E6E73] dark:text-[#8E8E93] max-w-xs">
            Photographic archive records from the Department of Information Technology at SGGSIE&amp;T.
          </p>
        </div>

        {/* Curated Editorial Composition: 5 Photographic Records */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          {/* Visual Anchor: Primary Lead Photographic Record */}
          {leadAnchor && (
            <div
              onClick={() => onSelectImage(leadAnchor)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectImage(leadAnchor);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View Archive Record ${leadAnchor.index || '01'}`}
              className="group relative md:col-span-12 lg:col-span-7 h-[300px] sm:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#EBEBE6]/60 dark:bg-[#0D0D0F] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] dark:focus-visible:ring-[#38BDF8] transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/40"
            >
              <img
                src={leadAnchor.image}
                alt={leadAnchor.title}
                className="w-full h-full object-cover object-[center_35%] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-between p-5 sm:p-7 text-white pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full font-mono text-xs tracking-wider bg-black/60 backdrop-blur-md border border-white/15">
                    RECORD {leadAnchor.index || '01'} · LEAD ARCHIVE
                  </span>
                  <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 group-hover:text-white group-hover:scale-110 transition-all">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between text-xs font-mono text-white/80">
                  <span className="text-[#38BDF8] uppercase tracking-wider">ITSA · SGGSIE&amp;T</span>
                  <span className="text-white/60">RECORD 01 / 05</span>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Anchor: Complementary Editorial Record */}
          {secondaryAnchor && (
            <div
              onClick={() => onSelectImage(secondaryAnchor)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectImage(secondaryAnchor);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View Archive Record ${secondaryAnchor.index || '02'}`}
              className="group relative md:col-span-6 lg:col-span-5 h-[300px] sm:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#EBEBE6]/60 dark:bg-[#0D0D0F] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] dark:focus-visible:ring-[#38BDF8] transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/40"
            >
              <img
                src={secondaryAnchor.image}
                alt={secondaryAnchor.title}
                className="w-full h-full object-cover object-[center_30%] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-between p-5 sm:p-7 text-white pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full font-mono text-xs tracking-wider bg-black/60 backdrop-blur-md border border-white/15">
                    RECORD {secondaryAnchor.index || '02'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 group-hover:text-white group-hover:scale-110 transition-all">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between text-xs font-mono text-white/80">
                  <span className="text-[#38BDF8] uppercase tracking-wider">ITSA · SGGSIE&amp;T</span>
                  <span className="text-white/60">RECORD 02 / 05</span>
                </div>
              </div>
            </div>
          )}

          {/* Supporting Records (Triptych: Records 03, 04, 05) */}
          {triptych.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onSelectImage(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectImage(item);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View Archive Record ${item.index || `0${idx + 3}`}`}
              className="group relative md:col-span-6 lg:col-span-4 h-[260px] sm:h-[340px] lg:h-[360px] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#EBEBE6]/60 dark:bg-[#0D0D0F] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] dark:focus-visible:ring-[#38BDF8] transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/40"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover object-[center_30%] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-between p-5 text-white pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] tracking-wider bg-black/60 backdrop-blur-md border border-white/15">
                    RECORD {item.index || `0${idx + 3}`}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 group-hover:text-white group-hover:scale-105 transition-all">
                    <Maximize2 className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between text-[11px] font-mono text-white/80">
                  <span className="text-[#38BDF8] uppercase tracking-wider">ITSA · SGGSIE&amp;T</span>
                  <span className="text-white/60">RECORD {item.index || `0${idx + 3}`} / 05</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
