import React, { useState } from 'react';
import { EVENTS } from '../data/mockData';
import { EventItem } from '../types';
import { Calendar, MapPin, Users, ArrowUpRight, Clock } from 'lucide-react';

interface EventsProps {
  onSelectEvent: (event: EventItem) => void;
}

export const Events: React.FC<EventsProps> = ({ onSelectEvent }) => {
  const [selectedYear, setSelectedYear] = useState<'ALL' | '2026' | '2025'>('ALL');
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(EVENTS[0].id);

  const filteredEvents = EVENTS.filter((e) =>
    selectedYear === 'ALL' ? true : e.year === selectedYear
  );

  return (
    <section id="events" className="relative py-32 sm:py-44 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header with Year Filter Archive */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-black/10 dark:border-white/10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
              <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">03</span>
              <span>/</span>
              <span>EVENT ARCHIVE</span>
            </div>
            <h2 className="headline-section font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              Symposiums &amp; Sessions.
            </h2>
          </div>

          {/* Year Archive Filter */}
          <div className="flex items-center gap-2 p-1 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs">
            {(['ALL', '2026', '2025'] as const).map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                  selectedYear === year
                    ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold'
                    : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                }`}
              >
                {year === 'ALL' ? 'ALL YEARS' : year}
              </button>
            ))}
          </div>
        </div>

        {/* Editorial Event Archive Rows */}
        <div className="space-y-6">
          {filteredEvents.map((evt) => {
            const isHovered = hoveredEventId === evt.id;
            return (
              <div
                key={evt.id}
                onMouseEnter={() => setHoveredEventId(evt.id)}
                onFocus={() => setHoveredEventId(evt.id)}
                onClick={() => onSelectEvent(evt)}
                tabIndex={0}
                className="group relative rounded-2xl border border-black/10 dark:border-white/10 p-6 sm:p-10 transition-all duration-400 cursor-pointer bg-black/[0.01] dark:bg-white/[0.01] hover:border-terminal-green/50 dark:hover:border-[#35FF7A]/40 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Date + Category */}
                  <div className="lg:col-span-3 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
                        {evt.monthDay}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded border border-black/10 dark:border-white/10 text-[#6E6E73]">
                        {evt.year}
                      </span>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#6E6E73] dark:text-[#8E8E93]">
                      {evt.category}
                    </span>
                  </div>

                  {/* Center: Title + Tagline + Tags */}
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold text-[#111113] dark:text-[#F5F5F7] group-hover:text-terminal-green dark:group-hover:text-[#35FF7A] transition-colors">
                        {evt.title}
                      </h3>
                      {evt.status === 'UPCOMING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] bg-terminal-green/10 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E] border border-terminal-green/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-terminal-green dark:bg-[#35FF7A] bg-[#0D7A3E] animate-pulse" />
                          UPCOMING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-black/5 dark:bg-white/5 text-[#6E6E73] border border-black/10 dark:border-white/10">
                          ARCHIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-[#48484E] dark:text-[#A1A1A6] font-normal">
                      {evt.tagline}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#6E6E73] pt-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {evt.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {evt.attendees}
                      </span>
                    </div>
                  </div>

                  {/* Right: Interactive View Action */}
                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs tracking-wider uppercase bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] group-hover:bg-terminal-green group-hover:text-black transition-colors font-medium shadow-sm"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtle Image Preview Reveal */}
                {isHovered && evt.image && (
                  <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-fade-in">
                    <div className="md:col-span-4 h-32 rounded-xl overflow-hidden">
                      <img
                        src={evt.image}
                        alt={evt.title}
                        className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="md:col-span-8 space-y-2">
                      <p className="text-xs sm:text-sm text-[#48484E] dark:text-[#8E8E93] line-clamp-2">
                        {evt.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {evt.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/5 dark:bg-white/5 text-[#6E6E73]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
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
