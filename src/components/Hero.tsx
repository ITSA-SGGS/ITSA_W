import React from 'react';
import { HeroCanvas } from './HeroCanvas';
import { useTheme } from '../hooks/useTheme';
import { ArrowDown } from 'lucide-react';
import { ItsaLogo } from './ItsaLogo';

export const Hero: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex flex-col justify-between pt-32 pb-12 px-6 sm:px-8 lg:px-12 overflow-hidden select-none"
    >
      {/* Signature Right-Concentrated Linux Data Atmosphere */}
      <HeroCanvas />

      {/* Main Editorial Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-auto flex flex-col justify-center pointer-events-none">
        <div className="max-w-3xl lg:max-w-4xl">
          {/* Eyebrow with Official Brand Tag */}
          <div className="inline-flex items-center gap-3 mb-8 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-mono tracking-wider dark:text-[#A1A1A6] text-[#48484E] pointer-events-auto">
            <div className="h-4 w-auto flex items-center">
              <ItsaLogo className="h-3.5 w-auto object-contain" alt="ITSA Emblem" />
            </div>
            <span className="text-black/30 dark:text-white/30">|</span>
            <span>~/itsa</span>
            <span className="text-[#6E6E73] dark:text-[#55555A]">$ ./initialize</span>
            <span className="text-[#0072CE] dark:text-[#38BDF8] font-bold animate-terminal-cursor">
              _
            </span>
          </div>

          {/* Monolithic Title & Identity */}
          <h1 className="headline-hero font-display font-bold tracking-tight text-[#111113] dark:text-[#F5F5F7] mb-4 pointer-events-none">
            ITSA
          </h1>

          {/* Cinematic Statement */}
          <p className="headline-section font-display font-medium tracking-tight text-[#111113]/90 dark:text-[#F5F5F7]/90 max-w-2xl mb-8 leading-[1.08] pointer-events-none">
            Where technology <br />
            <span className="dark:text-[#A1A1A6] text-[#6E6E73]">meets curiosity.</span>
          </p>

          {/* Supporting Text */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base font-sans dark:text-[#A1A1A6] text-[#48484E] mb-12 max-w-xl pointer-events-none">
            <span className="font-medium text-[#111113] dark:text-[#F5F5F7]">
              Information Technology Students Association
            </span>
            <span className="hidden sm:inline text-[#6E6E73]">•</span>
            <span className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
              SGGSIE&amp;T, Nanded
            </span>
          </div>

          {/* Restrained Hero Action */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <a
              href="#events"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-medium tracking-wide bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 transition-all duration-300 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE]"
            >
              <span>Explore Events</span>
              <ArrowDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-8 border-t border-black/5 dark:border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[11px] font-mono tracking-wider dark:text-[#6E6E73] text-[#8E8E93] pointer-events-none">
        <div className="flex flex-wrap items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0072CE] dark:bg-[#38BDF8]" />
            SYS: LINUX_KERNEL_STABLE
          </span>
          <span className="hidden sm:inline">UPTIME: 99.98%</span>
          <span className="hidden sm:inline">ACADEMIC YEAR: 2026–2027</span>
        </div>

        <div className="flex items-center gap-4">
          <span>COORDINATES: 19.1176° N, 77.2995° E</span>
          <span className="text-[#111113] dark:text-[#F5F5F7]">SGGSIE&amp;T</span>
        </div>
      </div>
    </section>
  );
};
