import React from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';

export const Quote: React.FC = () => {
  const { settings } = useSiteSettings();
  const quote = settings?.quote_content?.quote || 'The best way to predict the future is to invent it.';
  const author = settings?.quote_content?.author || 'Alan Kay';

  return (
    <section className="relative py-32 sm:py-48 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06] overflow-hidden select-none">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center justify-center space-y-8">
        {/* Subtle Decorative Index */}
        <div className="inline-flex items-center gap-2 font-mono text-[11px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0072CE] dark:bg-[#38BDF8]" />
          <span>FIRST PRINCIPLES</span>
        </div>

        {/* Cinematic Standalone Quote */}
        <blockquote className="font-display font-medium text-3xl sm:text-5xl lg:text-6xl text-[#111113] dark:text-[#F5F5F7] tracking-tight leading-[1.15] max-w-4xl">
          &ldquo;{quote}&rdquo;
        </blockquote>

        {/* Minimal Attribution */}
        <cite className="font-mono text-xs sm:text-sm text-[#6E6E73] dark:text-[#8E8E93] not-italic tracking-wider uppercase pt-2">
          // {author} //
        </cite>
      </div>
    </section>
  );
};
