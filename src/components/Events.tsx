import React, { useState } from 'react';
import { EventCategoryType } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface EventsProps {
  onSelectCategory: (category: EventCategoryType) => void;
}

export const Events: React.FC<EventsProps> = ({ onSelectCategory }) => {
  const [hoveredCategory, setHoveredCategory] = useState<EventCategoryType | null>(null);

  const categories: {
    id: EventCategoryType;
    index: string;
    title: string;
    tagline: string;
    subtext: string;
    disciplines: string[];
  }[] = [
    {
      id: 'TECHNICAL EVENTS',
      index: '01',
      title: 'TECHNICAL EVENTS',
      tagline: 'Build · Compete · Explore',
      subtext: 'Deep-tech symposiums, competitive programming sprints, open-source projects, and systems engineering bootcamps.',
      disciplines: ['Symposiums', 'Hackathons', 'Coding Sprints', 'Workshops'],
    },
    {
      id: 'SPORTS EVENTS',
      index: '02',
      title: 'SPORTS EVENTS',
      tagline: 'Compete · Connect · Play',
      subtext: 'Departmental cricket league, knockout football championships, indoor racquet tournaments, and strategic chess sprints.',
      disciplines: ['Cricket League', 'Football Cup', 'Badminton Open', 'Chess Sprint'],
    },
    {
      id: 'CULTURAL EVENTS',
      index: '03',
      title: 'CULTURAL EVENTS',
      tagline: 'Create · Celebrate · Connect',
      subtext: 'Departmental cultural evenings, acoustic open-mic sessions, digital media exhibits, and creative student productions.',
      disciplines: ['Cultural Fest', 'Open Mic', 'Festive Night', 'Creative Arts'],
    },
  ];

  return (
    <section id="events" className="relative py-36 sm:py-52 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 pb-8 border-b border-black/10 dark:border-white/10 gap-6">
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

          <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-xs">
            Explore active technical disciplines and annual departmental athletic fixtures.
          </p>
        </div>

        {/* Large Editorial Interactive Category Selector Rows */}
        <div className="divide-y divide-black/10 dark:divide-white/10 border-b border-black/10 dark:border-white/10">
          {categories.map((cat) => {
            const isHovered = hoveredCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCategory(cat.id);
                  }
                }}
                className="group relative py-12 sm:py-16 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:bg-black/[0.02] dark:focus-visible:bg-white/[0.02] px-2 rounded-2xl"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Index + Big Title */}
                  <div className="lg:col-span-6 flex items-baseline gap-6 sm:gap-10">
                    <span className="font-mono text-base sm:text-lg text-[#6E6E73] dark:text-[#55555C] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8] transition-colors">
                      {cat.index}
                    </span>

                    <div className="space-y-2">
                      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#111113] dark:text-[#F5F5F7] group-hover:translate-x-2 transition-transform duration-300">
                        {cat.title}
                      </h3>
                      <p className="font-mono text-xs sm:text-sm text-[#0072CE] dark:text-[#38BDF8] tracking-wider">
                        {cat.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Center: Description & Tags */}
                  <div className="lg:col-span-4 space-y-3">
                    <p className="text-xs sm:text-sm text-[#48484E] dark:text-[#8E8E93] leading-relaxed">
                      {cat.subtext}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.disciplines.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-0.5 rounded font-mono text-[10px] bg-black/[0.03] dark:bg-white/[0.03] text-[#6E6E73] border border-black/5 dark:border-white/5"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Arrow Action */}
                  <div className="lg:col-span-2 flex items-center justify-end">
                    <div className="w-12 h-12 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:border-[#0072CE] dark:group-hover:border-[#38BDF8] group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-all">
                      <ArrowUpRight className="w-5 h-5 text-[#6E6E73] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
