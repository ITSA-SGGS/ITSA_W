import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface CTAProps {
  onOpenJoinModal: () => void;
}

export const CTA: React.FC<CTAProps> = ({ onOpenJoinModal }) => {
  return (
    <section className="relative py-44 sm:py-64 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-start justify-center">
        {/* Linux Eyebrow */}
        <div className="flex items-center gap-3 mb-12 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
          <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">08</span>
          <span>/</span>
          <span>THE CALL TO CRAFT</span>
        </div>

        {/* Huge Typographic Final Statement */}
        <div className="space-y-1 sm:space-y-2 mb-12 max-w-5xl">
          <h2 className="headline-hero font-display font-bold tracking-tight text-[#111113] dark:text-[#F5F5F7]">
            READY
          </h2>
          <h2 className="headline-hero font-display font-bold tracking-tight text-[#6E6E73] dark:text-[#8E8E93]">
            TO BUILD
          </h2>
          <h2 className="headline-hero font-display font-bold tracking-tight text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
            SOMETHING?
          </h2>
        </div>

        {/* Supporting Line & Restrained Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pt-4 gap-8">
          <p className="text-lg sm:text-2xl font-light text-[#48484E] dark:text-[#A1A1A6] max-w-lg">
            Join the students, developers, and architects building what comes next.
          </p>

          <button
            onClick={onOpenJoinModal}
            className="group inline-flex items-center gap-4 px-10 py-5 rounded-full text-base font-mono tracking-wider uppercase bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:bg-terminal-green hover:text-black dark:hover:bg-[#35FF7A] dark:hover:text-black transition-all duration-300 font-semibold shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
          >
            <span>Join ITSA</span>
            <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </section>
  );
};
