import React from 'react';
import { Mail, ArrowUp } from 'lucide-react';
import { GithubIcon, LinkedinIcon, InstagramIcon } from './Icons';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative py-20 px-6 sm:px-8 lg:px-12 w-full border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-[#030303] text-[#111113] dark:text-[#F5F5F7]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 items-start">
          {/* Brand & Address */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-terminal-green dark:bg-[#35FF7A] bg-[#0D7A3E]" />
              <span className="font-display font-bold text-xl tracking-tight">ITSA</span>
              <span className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">~/itsa</span>
            </div>
            <p className="text-sm font-normal text-[#48484E] dark:text-[#A1A1A6] max-w-sm">
              Information Technology Students Association
              <br />
              Shri Guru Gobind Singhji Institute of Engineering &amp; Technology (SGGSIE&T), Vishnupuri, Nanded — 431606, Maharashtra, India.
            </p>
          </div>

          {/* Social Links */}
          <div className="md:col-span-4 flex flex-col space-y-3 font-mono text-xs">
            <span className="text-[#6E6E73] dark:text-[#55555C] tracking-widest uppercase">
              // CHANNELS
            </span>
            <div className="flex flex-col space-y-2.5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-terminal-green dark:hover:text-[#35FF7A] transition-colors inline-flex items-center gap-2"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub · /itsa-sggs</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-terminal-green dark:hover:text-[#35FF7A] transition-colors inline-flex items-center gap-2"
              >
                <LinkedinIcon className="w-4 h-4" />
                <span>LinkedIn · ITSA SGGSIE&T</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-terminal-green dark:hover:text-[#35FF7A] transition-colors inline-flex items-center gap-2"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Instagram · @itsa_sggsiet</span>
              </a>
              <a
                href="mailto:itsa@sggs.ac.in"
                className="hover:text-terminal-green dark:hover:text-[#35FF7A] transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Email · itsa@sggs.ac.in</span>
              </a>
            </div>
          </div>

          {/* Back to Top */}
          <div className="md:col-span-2 flex md:justify-end">
            <button
              onClick={scrollToTop}
              className="p-3 rounded-full border border-black/10 dark:border-white/10 hover:border-terminal-green/50 dark:hover:border-[#35FF7A]/50 transition-colors group"
              aria-label="Scroll back to top"
              title="Return to top"
            >
              <ArrowUp className="w-4 h-4 text-[#6E6E73] group-hover:text-terminal-green dark:group-hover:text-[#35FF7A] group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
          <div>
            &copy; 2026 ITSA SGGSIE&T. All systems operational.
          </div>
          <div className="flex items-center gap-2 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green dark:bg-[#35FF7A] bg-[#0D7A3E]" />
            <span>KERNEL 6.8.0-GENERIC · x86_64</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
