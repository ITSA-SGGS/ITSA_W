import React, { useState } from 'react';
import { TEAM_MEMBERS } from '../data/mockData';
import { GithubIcon, LinkedinIcon } from './Icons';
import { Terminal } from 'lucide-react';

export const Team: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'TY_EXECUTIVE' | 'SY_COORDINATOR'>('TY_EXECUTIVE');
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  const members = TEAM_MEMBERS.filter((m) => m.category === activeCategory);

  return (
    <section id="team" className="relative py-32 sm:py-48 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-black/10 dark:border-white/10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
              <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">05</span>
              <span>/</span>
              <span>THE PEOPLE</span>
            </div>
            <h2 className="headline-section font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              Executive Directory.
            </h2>
          </div>

          {/* Committee Switcher */}
          <div className="flex items-center gap-2 p-1 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs">
            <button
              onClick={() => setActiveCategory('TY_EXECUTIVE')}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                activeCategory === 'TY_EXECUTIVE'
                  ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold'
                  : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
              }`}
            >
              Executive Committee (TY)
            </button>
            <button
              onClick={() => setActiveCategory('SY_COORDINATOR')}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                activeCategory === 'SY_COORDINATOR'
                  ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold'
                  : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
              }`}
            >
              Coordinators (SY)
            </button>
          </div>
        </div>

        {/* Editorial Team Directory Rows (NOT CIRCULAR CARDS) */}
        <div className="divide-y divide-black/10 dark:divide-white/10">
          {members.map((member, idx) => {
            const isHovered = hoveredMemberId === member.id;
            const indexStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;

            return (
              <div
                key={member.id}
                onMouseEnter={() => setHoveredMemberId(member.id)}
                onMouseLeave={() => setHoveredMemberId(null)}
                tabIndex={0}
                className="group relative py-7 sm:py-9 transition-all duration-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] focus:outline-none focus-visible:bg-black/[0.02] dark:focus-visible:bg-white/[0.02]"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
                  {/* Left: Index + Role */}
                  <div className="md:col-span-4 flex items-baseline gap-6">
                    <span className="font-mono text-sm sm:text-base text-[#6E6E73] dark:text-[#55555C] group-hover:text-terminal-green dark:group-hover:text-[#35FF7A] transition-colors">
                      {indexStr}
                    </span>
                    <div>
                      <span className="font-mono text-xs uppercase tracking-widest text-[#6E6E73] dark:text-[#8E8E93] block mb-1">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  {/* Center: Name */}
                  <div className="md:col-span-5">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold text-[#111113] dark:text-[#F5F5F7] group-hover:translate-x-1.5 transition-transform duration-300">
                      {member.name}
                    </h3>
                    {member.bio && (
                      <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#8E8E93] mt-1 line-clamp-1">
                        {member.bio}
                      </p>
                    )}
                  </div>

                  {/* Right: Skills & Minimal Social Links */}
                  <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-4">
                    {member.skills && member.skills.length > 0 && (
                      <div className="hidden lg:flex items-center gap-1.5">
                        {member.skills.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded font-mono text-[10px] bg-black/5 dark:bg-white/5 text-[#6E6E73]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[#6E6E73]">
                      <a
                        href={member.github || 'https://github.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded hover:text-[#111113] dark:hover:text-white transition-colors"
                        aria-label={`${member.name} GitHub`}
                      >
                        <GithubIcon className="w-4 h-4" />
                      </a>
                      <a
                        href={member.linkedin || 'https://linkedin.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded hover:text-[#111113] dark:hover:text-white transition-colors"
                        aria-label={`${member.name} LinkedIn`}
                      >
                        <LinkedinIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Subtle Hover Reveal Bar */}
                {isHovered && (
                  <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between font-mono text-xs text-[#6E6E73] animate-fade-in">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]" />
                      <span>{member.subRole || 'ITSA Executive Member'}</span>
                    </span>
                    <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
                      VERIFIED CREDENTIAL
                    </span>
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
