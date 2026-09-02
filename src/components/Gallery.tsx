import React, { useState } from 'react';
import { GALLERY_ITEMS } from '../data/mockData';
import { GalleryItem } from '../types';
import { Maximize2, Camera } from 'lucide-react';

interface GalleryProps {
  onSelectImage: (item: GalleryItem) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onSelectImage }) => {
  const featured = GALLERY_ITEMS[0];
  const supporting = GALLERY_ITEMS.slice(1);

  return (
    <section id="gallery" className="relative py-32 sm:py-48 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-black/10 dark:border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
              <span className="text-[#0072CE] dark:text-[#38BDF8]">06</span>
              <span>/</span>
              <span>VISUAL ARCHIVE</span>
            </div>
            <h2 className="headline-section font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              Documentary Records.
            </h2>
          </div>
          <p className="text-sm font-mono text-[#6E6E73] dark:text-[#8E8E93] max-w-xs">
            Moments captured across symposiums, hackathons, and laboratory sessions.
          </p>
        </div>

        {/* Featured Cinematic Hero Shot */}
        <div
          onClick={() => onSelectImage(featured)}
          tabIndex={0}
          className="group relative w-full h-[55vh] sm:h-[65vh] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 mb-8 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE]"
        >
          <img
            src={featured.image}
            alt={featured.title}
            className="w-full h-full object-cover grayscale contrast-110 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-between p-6 sm:p-10 text-white">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full font-mono text-xs bg-black/60 backdrop-blur-md border border-white/15">
                FEATURED ARCHIVE · {featured.year}
              </span>
              <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs text-[#38BDF8] tracking-wider uppercase">
                {featured.category} · {featured.meta}
              </span>
              <h3 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
                {featured.title}
              </h3>
              <p className="text-sm sm:text-base text-neutral-300 max-w-2xl font-light">
                {featured.caption}
              </p>
            </div>
          </div>
        </div>

        {/* Asymmetrical Supporting Editorial Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {supporting.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onSelectImage(item)}
              tabIndex={0}
              className={`group relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] ${
                idx === 0 ? 'lg:col-span-2 h-80 sm:h-96' : 'h-80 sm:h-96'
              }`}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover grayscale contrast-110 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-6 text-white opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#38BDF8]">
                    {item.category}
                  </span>
                  <Maximize2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-display font-semibold text-lg sm:text-xl text-white tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-300 line-clamp-1 font-light">
                    {item.caption}
                  </p>
                  <span className="font-mono text-[10px] text-neutral-400 block pt-1">
                    {item.meta}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
