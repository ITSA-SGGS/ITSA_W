import React, { useState } from 'react';
import { useTeam } from '../hooks/useTeam';
import { CommitteeMember } from '../types';
import { Users, GraduationCap, ArrowUpRight } from 'lucide-react';

interface TeamProps {
  onSelectMember: (member: CommitteeMember) => void;
}

export const Team: React.FC<TeamProps> = ({ onSelectMember }) => {
  const { coreMembers, tyMembers, syMembers, facultyDignitaries } = useTeam();
  const [hoveredMember, setHoveredMember] = useState<CommitteeMember | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CORE' | 'TY' | 'SY' | 'FACULTY'>('ALL');

  return (
    <section id="team" className="relative py-32 sm:py-48 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 pb-8 border-b border-black/10 dark:border-white/10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
              <span className="text-[#0072CE] dark:text-[#38BDF8]">03</span>
              <span>/</span>
              <span>THE PEOPLE</span>
            </div>
            <h2 className="headline-section font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              Committee &amp; Coordinators.
            </h2>
          </div>

          {/* Section Filter Tabs - Robust Responsive Capsule */}
          <div className="w-full lg:w-auto p-1.5 sm:p-1 rounded-2xl lg:rounded-full border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-start gap-1 sm:gap-1.5 font-mono text-xs shadow-sm">
            {[
              { key: 'ALL', label: 'All Structure' },
              { key: 'CORE', label: 'Core Committee' },
              { key: 'TY', label: 'TY Leadership' },
              { key: 'SY', label: 'SY Coordinators' },
              { key: 'FACULTY', label: 'Faculty' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-initial sm:flex-none px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-xl lg:rounded-full text-xs transition-all duration-200 text-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] ${
                  activeTab === tab.key
                    ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. CORE COMMITTEE */}
        {(activeTab === 'ALL' || activeTab === 'CORE') && (
          <div className="mb-24">
            <div className="flex items-center justify-between pb-4 mb-8 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0072CE]" />
                <h3 className="font-mono text-xs tracking-widest uppercase text-[#111113] dark:text-[#F5F5F7] font-semibold">
                  01 // CORE COMMITTEE
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#6E6E73]">ACADEMIC YEAR 2026–2027</span>
            </div>

            <div className="divide-y divide-black/10 dark:divide-white/10">
              {coreMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="group py-6 sm:py-8 transition-all duration-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
                    <div className="md:col-span-4 flex items-baseline gap-6">
                      <span className="font-mono text-sm text-[#6E6E73] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8] transition-colors">
                        0{idx + 1}
                      </span>
                      <div>
                        <span className="font-mono text-xs uppercase tracking-widest text-[#0072CE] dark:text-[#38BDF8] font-medium block mb-1">
                          {member.position}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-6">
                      <button
                        type="button"
                        onClick={() => onSelectMember(member)}
                        onMouseEnter={() => setHoveredMember(member)}
                        onMouseLeave={() => setHoveredMember(null)}
                        className="text-left font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-[#111113] dark:text-[#F5F5F7] hover:text-[#0072CE] dark:hover:text-[#38BDF8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] rounded"
                      >
                        {member.name}
                      </button>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between md:justify-end">
                      <button
                        type="button"
                        onClick={() => onSelectMember(member)}
                        className="w-8 h-8 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:border-[#0072CE]/50 transition-all"
                        aria-label={`View ${member.name} profile`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#6E6E73] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. TY LEADERSHIP */}
        {(activeTab === 'ALL' || activeTab === 'TY') && (
          <div className="mb-24">
            <div className="flex items-center justify-between pb-4 mb-8 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0072CE]" />
                <h3 className="font-mono text-xs tracking-widest uppercase text-[#111113] dark:text-[#F5F5F7] font-semibold">
                  {activeTab === 'ALL' ? '02' : '01'} // THIRD YEAR (TY) LEADERSHIP
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#6E6E73]">PORTFOLIO HEADS &amp; CO-HEADS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              {tyMembers.map((member) => (
                <div
                  key={member.id}
                  className="group py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015] px-3 rounded-xl"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#6E6E73] dark:text-[#8E8E93] block">
                      {member.position}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectMember(member)}
                      onMouseEnter={() => setHoveredMember(member)}
                      onMouseLeave={() => setHoveredMember(null)}
                      className="text-left font-display font-medium text-lg text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] rounded"
                    >
                      {member.name}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 opacity-40 group-hover:opacity-100 transition-opacity"
                    aria-label={`View ${member.name} profile`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-[#6E6E73] group-hover:text-[#0072CE]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SY COORDINATORS (MATCHING TY TWO-COLUMN EDITORIAL STRUCTURE) */}
        {(activeTab === 'ALL' || activeTab === 'SY') && (
          <div className="mb-24">
            <div className="flex items-center justify-between pb-4 mb-8 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0072CE]" />
                <h3 className="font-mono text-xs tracking-widest uppercase text-[#111113] dark:text-[#F5F5F7] font-semibold">
                  {activeTab === 'ALL' ? '03' : '01'} // SECOND YEAR (SY) COORDINATORS
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#6E6E73]">PORTFOLIO COORDINATION</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              {syMembers.map((member) => (
                <div
                  key={member.id}
                  className="group py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015] px-3 rounded-xl"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#6E6E73] dark:text-[#8E8E93] block">
                      {member.position}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectMember(member)}
                      onMouseEnter={() => setHoveredMember(member)}
                      onMouseLeave={() => setHoveredMember(null)}
                      className="text-left font-display font-medium text-lg text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] rounded"
                    >
                      {member.name}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 opacity-40 group-hover:opacity-100 transition-opacity"
                    aria-label={`View ${member.name} profile`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-[#6E6E73] group-hover:text-[#0072CE]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ITSA CLUB MEMBERSHIP (ONLY IN ALL STRUCTURE VIEW) */}
        {activeTab === 'ALL' && (
          <div className="mb-24 p-8 sm:p-12 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-[#0072CE] dark:text-[#38BDF8]">
                  <Users className="w-4 h-4" />
                  <span>04 // ITSA GENERAL BODY</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#111113] dark:text-[#F5F5F7]">
                  All IT Students
                </h3>
                <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] max-w-xl font-normal">
                  Every undergraduate enrolled in the Department of Information Technology at SGGSIE&amp;T is an active constituent and member of the ITSA ecosystem.
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <span>ACTIVE ENROLLMENT</span>
                <span className="text-[#0072CE] dark:text-[#38BDF8] font-semibold">100% INCLUSIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. FACULTY COORDINATION & ADVISORY */}
        {(activeTab === 'ALL' || activeTab === 'FACULTY') && (
          <div>
            <div className="flex items-center justify-between pb-4 mb-8 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0072CE]" />
                <h3 className="font-mono text-xs tracking-widest uppercase text-[#111113] dark:text-[#F5F5F7] font-semibold">
                  {activeTab === 'ALL' ? '05' : '01'} // FACULTY COORDINATION &amp; ADVISORY
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#6E6E73]">INSTITUTIONAL MENTORSHIP</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {facultyDignitaries.map((fac) => (
                <div
                  key={fac.name}
                  onClick={() => onSelectMember({ id: fac.name, name: fac.name, position: fac.position, photo: fac.photo, tier: 'FACULTY' })}
                  className="group p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] space-y-2 cursor-pointer transition-all hover:border-[#0072CE]/50"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#0072CE] dark:text-[#38BDF8]">
                    <GraduationCap className="w-4 h-4" />
                    <span>{fac.position}</span>
                  </div>
                  <h4 className="font-display font-semibold text-lg text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#0072CE] transition-colors">
                    {fac.name}
                  </h4>
                  <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                    {fac.department}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
