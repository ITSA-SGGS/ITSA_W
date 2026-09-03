import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { ItsaLogo } from './ItsaLogo';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape
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

  // Refined 3-item navigation links
  const navLinks = [
    { label: 'Events', href: '#events' },
    { label: 'The People', href: '#team' },
    { label: 'Archive', href: '#gallery' },
  ];

  const isDark = theme === 'dark';

  const navbarContainerClasses = scrolled
    ? isDark
      ? 'py-3.5 bg-[#050505]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/20'
      : 'py-3.5 bg-[#F5F5F2]/90 backdrop-blur-xl border-b border-black/[0.08] shadow-sm shadow-black/5'
    : 'py-6 bg-transparent border-b border-transparent';

  const navTextClasses = isDark
    ? 'text-[#A1A1A6] hover:text-[#F5F5F7]'
    : 'text-[#48484E] hover:text-[#111113]';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarContainerClasses}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Brand Mark with Official ITSA Logo */}
          <a
            href="#"
            className="group flex items-center gap-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] rounded-lg"
            aria-label="ITSA SGGSIE&T Home"
          >
            <div className="relative h-9 w-auto flex items-center">
              <ItsaLogo className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
            </div>

            <div className="flex flex-col border-l border-black/10 dark:border-white/10 pl-3">
              <span className={`font-display font-bold tracking-tight text-base leading-none ${isDark ? 'text-[#F5F5F7]' : 'text-[#111113]'}`}>
                ITSA
              </span>
              <span className="font-mono text-[10px] tracking-wider uppercase opacity-60 text-inherit pt-0.5">
                SGGSIE&amp;T
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-10 text-[13px] font-medium tracking-wide">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`relative py-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] rounded ${navTextClasses}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions: Theme Toggle */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] ${
                isDark
                  ? 'border-white/10 hover:border-white/20 text-[#A1A1A6] hover:text-[#F5F5F7] bg-white/[0.02]'
                  : 'border-black/10 hover:border-black/20 text-[#48484E] hover:text-[#111113] bg-black/[0.02]'
              }`}
              aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border ${isDark ? 'border-white/10 text-neutral-400' : 'border-black/10 text-neutral-600'} focus:outline-none`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg border ${isDark ? 'border-white/10 text-white' : 'border-black/10 text-black'} focus:outline-none`}
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
          className={`fixed inset-0 z-40 flex flex-col justify-between p-8 pt-28 animate-fade-in sm:hidden ${
            isDark ? 'bg-[#050505] text-[#F5F5F7]' : 'bg-[#F5F5F2] text-[#111113]'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-2 font-mono text-xs text-[#0072CE] tracking-widest uppercase">
              <span>~/itsa/navigation</span>
            </div>
            <nav className="flex flex-col space-y-6">
              {navLinks.map((link, idx) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-baseline justify-between text-2xl font-display font-medium hover:text-[#0072CE] transition-colors ${
                    isDark ? 'text-[#F5F5F7]' : 'text-[#111113]'
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="font-mono text-xs opacity-50">0{idx + 1}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="pt-8 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-mono opacity-60">
            <span>SGGSIE&amp;T NANDED</span>
            <span>EST. 1981</span>
          </div>
        </div>
      )}
    </>
  );
};
