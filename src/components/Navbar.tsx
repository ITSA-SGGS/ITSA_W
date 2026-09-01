import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, Terminal as TerminalIcon, Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenJoinModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenJoinModal }) => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape or resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Focus', href: '#focus' },
    { label: 'Events', href: '#events' },
    { label: 'Impact', href: '#impact' },
    { label: 'The People', href: '#team' },
    { label: 'Archive', href: '#gallery' },
    { label: 'Terminal', href: '#terminal', icon: true },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'py-3.5 bg-surface-950/75 dark:bg-[#050505]/80 bg-[#F5F5F2]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/[0.07] shadow-sm'
            : 'py-6 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Brand Logo & Linux Eyebrow */}
          <a
            href="#"
            className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green rounded-md"
            aria-label="ITSA SGGSIE&T Home"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-green dark:bg-[#35FF7A] bg-[#0D7A3E] transition-transform duration-300 group-hover:scale-125" />
            <div className="flex flex-col">
              <span className="font-display font-semibold tracking-tight text-lg leading-tight dark:text-[#F5F5F7] text-[#111113] group-hover:opacity-80 transition-opacity">
                ITSA
              </span>
              <span className="font-mono text-[10px] tracking-wider uppercase dark:text-subtle-dark text-subtle-light opacity-70">
                ~/sggs.edu.in
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative py-1 dark:text-[#A1A1A6] text-[#48484E] hover:text-[#111113] dark:hover:text-[#F5F5F7] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green rounded"
              >
                <span className="flex items-center gap-1.5">
                  {link.icon && (
                    <TerminalIcon className="w-3.5 h-3.5 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]" />
                  )}
                  {link.label}
                </span>
              </a>
            ))}
          </nav>

          {/* Actions: Theme Toggle & Join Button */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Minimal Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-black/10 dark:border-white/10 dark:hover:border-white/20 hover:border-black/20 text-[#48484E] dark:text-[#A1A1A6] hover:text-[#111113] dark:hover:text-[#F5F5F7] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Join ITSA Action */}
            <button
              onClick={onOpenJoinModal}
              className="group relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase border dark:border-white/15 border-black/15 dark:bg-white/[0.04] bg-black/[0.03] dark:hover:bg-white/[0.08] hover:bg-black/[0.06] dark:hover:border-[#35FF7A]/50 hover:border-[#0D7A3E]/40 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
            >
              <span className="dark:text-[#F5F5F7] text-[#111113] font-medium">Join ITSA</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-black/10 dark:border-white/10 text-muted focus:outline-none"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-black/10 dark:border-white/10 text-primary focus:outline-none"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#F5F5F2] dark:bg-[#050505] flex flex-col justify-between p-8 pt-28 animate-fade-in sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div className="flex flex-col space-y-6">
            <span className="font-mono text-xs text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E] tracking-widest uppercase">
              ~/itsa/navigation
            </span>
            <nav className="flex flex-col space-y-5">
              {navLinks.map((link, idx) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-baseline justify-between text-2xl font-display font-medium dark:text-[#F5F5F7] text-[#111113] hover:text-terminal-green transition-colors"
                >
                  <span>{link.label}</span>
                  <span className="font-mono text-xs text-[#6E6E73]">0{idx + 1}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="pt-8 border-t border-black/10 dark:border-white/10 flex flex-col gap-4">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenJoinModal();
              }}
              className="w-full py-3.5 rounded-xl font-mono text-xs tracking-wider uppercase bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold text-center transition-opacity hover:opacity-90"
            >
              Join ITSA 2026
            </button>
            <div className="flex items-center justify-between text-xs font-mono text-[#6E6E73]">
              <span>SGGSIE&T NANDED</span>
              <span>KERNEL 6.8 · OK</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
