import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ItsaLogo } from '../ItsaLogo';
import {
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  Image,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  Shield,
  Lock,
} from 'lucide-react';

export const AdminMobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, adminProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const role = adminProfile?.role || 'ADMIN';
  const isEditor = role === 'EDITOR';

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, minRole: 'EDITOR' },
    { label: 'Events', path: '/admin/events', icon: Calendar, minRole: 'EDITOR' },
    { label: 'People', path: '/admin/people', icon: Users, minRole: 'ADMIN' },
    { label: 'Positions', path: '/admin/positions', icon: Briefcase, minRole: 'ADMIN' },
    { label: 'Archive', path: '/admin/archive', icon: Image, minRole: 'ADMIN' },
    { label: 'Announcements', path: '/admin/announcements', icon: Bell, minRole: 'EDITOR' },
    { label: 'Admin Users', path: '/admin/users', icon: ShieldCheck, minRole: 'SUPER_ADMIN' },
    { label: 'Settings', path: '/admin/settings', icon: Settings, minRole: 'SUPER_ADMIN' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="md:hidden border-b border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0A0A0C] sticky top-0 z-40">
      {/* Top Mobile Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <ItsaLogo className="h-7 w-auto object-contain" alt="ITSA Logo" />
          <div className="flex flex-col border-l border-black/10 dark:border-white/10 pl-2">
            <span className="font-display font-bold text-xs tracking-tight">ITSA CMS</span>
            <span className="font-mono text-[8px] text-[#0072CE] dark:text-[#38BDF8] uppercase font-semibold">
              {role}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 text-inherit"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 text-inherit focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[65px] bg-black/80 backdrop-blur-md z-50 flex flex-col justify-between p-6 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0D0F] border border-black/10 dark:border-white/10 space-y-6 shadow-2xl max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Details */}
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8]">
                  <Shield className="w-3 h-3" />
                  <span className="uppercase font-semibold">{adminProfile?.full_name || 'Admin User'}</span>
                </div>
                <p className="font-mono text-xs text-[#111113] dark:text-[#F5F5F7] truncate">
                  {user?.email}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full font-mono text-[9px] bg-[#0072CE]/10 text-[#0072CE] dark:text-[#38BDF8] font-bold">
                {role}
              </span>
            </div>

            {/* Navigation items */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isRestricted = isEditor && item.minRole !== 'EDITOR';

                if (isRestricted) {
                  return (
                    <div
                      key={item.path}
                      className="flex items-center justify-between px-4 py-3 rounded-xl font-mono text-xs text-neutral-400 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs transition-all ${
                        isActive
                          ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold'
                          : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-black/10 dark:border-white/10 font-mono text-xs"
              >
                <span>View Public Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 font-mono text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
