import React, { useState } from 'react';
import { FOCUS_AREAS } from '../data/mockData';
import { ArrowUpRight } from 'lucide-react';

export const Focus: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);

  return (
    <section id="focus" className="relative py-32 sm:py-44 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 pb-8 border-b border-black/10 dark:border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
              <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">02</span>
              <span>/</span>
              <span>CORE DISCIPLINES</span>
            </div>
            <h2 className="headline-section font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              What ITSA does.
            </h2>
          </div>
          <p className="text-sm font-mono text-[#6E6E73] dark:text-[#8E8E93] max-w-xs">
            Disciplines designed for hands-on engineering and collaborative craft.
          </p>
        </div>

        {/* Full-Width Interactive Editorial List */}
        <div className="divide-y divide-black/10 dark:divide-white/10">
          {FOCUS_AREAS.map((area, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={area.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onFocus={() => setHoveredIndex(idx)}
                tabIndex={0}
                className="group relative py-10 sm:py-14 transition-all duration-500 cursor-pointer focus:outline-none focus-visible:bg-black/[0.02] dark:focus-visible:bg-white/[0.02]"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Index + Title */}
                  <div className="lg:col-span-6 flex items-baseline gap-6 sm:gap-10">
                    <span className="font-mono text-base sm:text-lg text-[#6E6E73] dark:text-[#55555C] group-hover:text-terminal-green dark:group-hover:text-[#35FF7A] transition-colors">
                      {area.index}
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-[#111113] dark:text-[#F5F5F7] group-hover:translate-x-2 transition-transform duration-300">
                        {area.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[#6E6E73] dark:text-[#A1A1A6] font-normal">
                        {area.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Description & Tags */}
                  <div className="lg:col-span-4 space-y-4">
                    <p className="text-sm sm:text-base leading-relaxed text-[#48484E] dark:text-[#8E8E93]">
                      {area.description}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {area.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-md font-mono text-[11px] bg-black/[0.04] dark:bg-white/[0.04] text-[#6E6E73] dark:text-[#A1A1A6] border border-black/5 dark:border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metric Stat + Visual Arrow */}
                  <div className="lg:col-span-2 flex lg:flex-col items-center lg:items-end justify-between h-full pt-2">
                    <span className="font-mono text-xs text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
                      {area.metrics}
                    </span>
                    <div className="w-10 h-10 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:border-terminal-green/50 dark:group-hover:border-[#35FF7A]/50 group-hover:bg-terminal-green/10 transition-all">
                      <ArrowUpRight className="w-4 h-4 text-[#6E6E73] group-hover:text-terminal-green dark:group-hover:text-[#35FF7A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Subtle Image Reveal Banner on Row */}
                {isHovered && (
                  <div className="mt-8 overflow-hidden rounded-xl h-44 sm:h-52 w-full relative transition-all duration-500 animate-fade-in">
                    <img
                      src={area.image}
                      alt={area.title}
                      className="w-full h-full object-cover grayscale contrast-125 opacity-70 hover:opacity-90 hover:grayscale-0 transition-all duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                      <span className="font-mono text-xs text-white/90">
                        // DISCIPLINE // {area.title} · SGGSIE&T
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
