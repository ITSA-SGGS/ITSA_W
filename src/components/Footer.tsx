import React from 'react';
import { Mail, ArrowUp } from 'lucide-react';
import { GithubIcon, LinkedinIcon, InstagramIcon } from './Icons';
import { useTheme } from '../hooks/useTheme';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
              <img
                src={isDark ? '/itsa-logo-dark.png' : '/itsa-logo-light.png'}
                alt="ITSA Official Logo"
                className="h-8 w-auto object-contain"
              />
              <div className="flex flex-col border-l border-black/10 dark:border-white/10 pl-3">
                <span className="font-display font-bold text-lg tracking-tight">ITSA</span>
                <span className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93]">~/itsa</span>
              </div>
            </div>
            <p className="text-sm font-normal text-[#48484E] dark:text-[#A1A1A6] max-w-md">
              Information Technology Students Association
              <br />
              Department of Information Technology, Shri Guru Gobind Singhji Institute of Engineering &amp; Technology (SGGSIE&amp;T), Vishnupuri, Nanded — 431606, Maharashtra, India.
            </p>
          </div>

          {/* Official Communication Channels */}
          <div className="md:col-span-4 flex flex-col space-y-3 font-mono text-xs">
            <span className="text-[#6E6E73] dark:text-[#55555C] tracking-widest uppercase">
              // OFFICIAL CHANNELS
            </span>
            <div className="flex flex-col space-y-2.5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#0072CE] dark:hover:text-[#38BDF8] transition-colors inline-flex items-center gap-2"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub · /itsa-sggs</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#0072CE] dark:hover:text-[#38BDF8] transition-colors inline-flex items-center gap-2"
              >
                <LinkedinIcon className="w-4 h-4" />
                <span>LinkedIn · ITSA SGGSIE&amp;T</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#0072CE] dark:hover:text-[#38BDF8] transition-colors inline-flex items-center gap-2"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Instagram · @itsa_sggsiet</span>
              </a>
              <a
                href="mailto:itsa@sggs.ac.in"
                className="hover:text-[#0072CE] dark:hover:text-[#38BDF8] transition-colors inline-flex items-center gap-2"
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
              className="p-3 rounded-full border border-black/10 dark:border-white/10 hover:border-[#0072CE]/50 dark:hover:border-[#38BDF8]/50 transition-colors group"
              aria-label="Scroll back to top"
              title="Return to top"
            >
              <ArrowUp className="w-4 h-4 text-[#6E6E73] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8] group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
          <div>
            &copy; 2026–2027 ITSA SGGSIE&amp;T. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[#0072CE] dark:text-[#38BDF8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0072CE] dark:bg-[#38BDF8]" />
            <span>DEPARTMENT OF INFORMATION TECHNOLOGY · SGGSIE&amp;T</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
