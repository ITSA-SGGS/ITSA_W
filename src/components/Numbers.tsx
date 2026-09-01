import React from 'react';
import { STATS } from '../data/mockData';

export const Numbers: React.FC = () => {
  return (
    <section id="impact" className="relative py-36 sm:py-52 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-20 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
          <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">04</span>
          <span>/</span>
          <span>SYSTEM SCALE</span>
        </div>

        {/* Dramatic Typographic Composition (NOT DASHBOARD CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8 mb-24">
          {STATS.map((stat, idx) => (
            <div
              key={stat.label}
              className="group flex flex-col justify-between border-l border-black/10 dark:border-white/10 pl-6 sm:pl-8 py-2 transition-all duration-300 hover:border-terminal-green dark:hover:border-[#35FF7A]"
            >
              <div className="font-mono text-xs text-[#6E6E73] dark:text-[#55555C] mb-4">
                METRIC_0{idx + 1}
              </div>

              {/* Massive Typographic Number */}
              <div className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold tracking-tighter text-[#111113] dark:text-[#F5F5F7] group-hover:text-terminal-green dark:group-hover:text-[#35FF7A] transition-colors duration-300">
                {stat.value}
              </div>

              {/* Editorial Label & Meta */}
              <div className="mt-4 space-y-1">
                <div className="font-display font-semibold text-lg tracking-tight text-[#111113] dark:text-[#F5F5F7]">
                  {stat.label}
                </div>
                <div className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                  {stat.meta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quiet Editorial Quote / Philosophy Note */}
        <div className="p-8 sm:p-12 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="font-display text-xl sm:text-2xl font-medium text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              &ldquo;The best way to predict the future is to invent it.&rdquo;
            </p>
            <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
              // Alan Kay — Systems Architecture Foundation //
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
            <span className="w-2 h-2 rounded-full bg-terminal-green dark:bg-[#35FF7A] bg-[#0D7A3E] animate-pulse" />
            <span>CONTINUOUS CYCLE: 2026-2027</span>
          </div>
        </div>
      </div>
    </section>
  );
};
