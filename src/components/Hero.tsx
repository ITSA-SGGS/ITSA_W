import React from 'react';
import { HeroCanvas } from './HeroCanvas';
import { ArrowDown, ArrowRight, Terminal } from 'lucide-react';

interface HeroProps {
  onOpenTerminal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenTerminal }) => {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex flex-col justify-between pt-32 pb-12 px-6 sm:px-8 lg:px-12 overflow-hidden select-none"
    >
      {/* Signature Right-Concentrated Linux Data Atmosphere */}
      <HeroCanvas />

      {/* Main Editorial Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-auto flex flex-col justify-center">
        <div className="max-w-3xl lg:max-w-4xl">
          {/* Eyebrow: Linux Terminal Prompt */}
          <div className="inline-flex items-center gap-2.5 mb-6 px-3 py-1 rounded-md bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-mono tracking-wider dark:text-[#A1A1A6] text-[#48484E]">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green dark:bg-[#35FF7A] bg-[#0D7A3E] animate-pulse" />
            <span>~/itsa</span>
            <span className="text-[#6E6E73] dark:text-[#55555A]">$ ./initialize</span>
            <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E] font-bold animate-terminal-cursor">
              _
            </span>
          </div>

          {/* Huge Monolithic Title */}
          <h1 className="headline-hero font-display font-bold tracking-tight text-[#111113] dark:text-[#F5F5F7] mb-4">
            ITSA
          </h1>

          {/* Cinematic Statement */}
          <p className="headline-section font-display font-medium tracking-tight text-[#111113]/90 dark:text-[#F5F5F7]/90 max-w-2xl mb-8 leading-[1.08]">
            Where technology <br />
            <span className="dark:text-[#A1A1A6] text-[#6E6E73]">meets curiosity.</span>
          </p>

          {/* Supporting Text */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base font-sans dark:text-[#A1A1A6] text-[#48484E] mb-12 max-w-xl">
            <span className="font-medium text-[#111113] dark:text-[#F5F5F7]">
              Information Technology Students Association
            </span>
            <span className="hidden sm:inline text-[#6E6E73]">•</span>
            <span className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
              SGGSIE&T, Nanded
            </span>
          </div>

          {/* Restrained Hero Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#about"
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-sm font-medium tracking-wide bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 transition-all duration-300 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
            >
              <span>Explore ITSA</span>
              <ArrowDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>

            <a
              href="#events"
              className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-full text-sm font-medium tracking-wide border border-black/15 dark:border-white/15 dark:text-[#F5F5F7] text-[#111113] dark:hover:bg-white/[0.06] hover:bg-black/[0.04] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
            >
              <span>View Events</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>

            {/* Quick Terminal Easter Egg Trigger */}
            <button
              onClick={onOpenTerminal}
              className="hidden lg:inline-flex items-center gap-2 px-4 py-3.5 rounded-full font-mono text-xs text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] border border-dashed border-black/10 dark:border-white/10 hover:border-terminal-green/50 transition-colors"
              title="Launch Interactive Terminal"
            >
              <Terminal className="w-3.5 h-3.5 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]" />
              <span>Launch CLI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-8 border-t border-black/5 dark:border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[11px] font-mono tracking-wider dark:text-[#6E6E73] text-[#8E8E93]">
        <div className="flex flex-wrap items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green dark:bg-[#35FF7A] bg-[#0D7A3E]" />
            SYS: LINUX_KERNEL_STABLE
          </span>
          <span className="hidden sm:inline">UPTIME: 99.98%</span>
          <span className="hidden sm:inline">STATUS: ACTIVE_SEMESTER_2026</span>
        </div>

        <div className="flex items-center gap-4">
          <span>COORDINATES: 19.1176° N, 77.2995° E</span>
          <span className="text-[#111113] dark:text-[#F5F5F7]">SGGSIE&T</span>
        </div>
      </div>
    </section>
  );
};
