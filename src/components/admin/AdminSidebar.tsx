import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ItsaLogo } from '../ItsaLogo';
import {
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

export const AdminSidebar: React.FC = () => {
  const { user, adminProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const role = adminProfile?.role || 'ADMIN';
  const isEditor = role === 'EDITOR';

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, minRole: 'EDITOR' },
      ],
    },
    {
      group: 'CONTENT',
      items: [
        { label: 'Events', path: '/admin/events', icon: Calendar, minRole: 'EDITOR' },
        { label: 'People', path: '/admin/people', icon: Users, minRole: 'ADMIN' },
        { label: 'Positions', path: '/admin/positions', icon: Briefcase, minRole: 'ADMIN' },
        { label: 'Archive', path: '/admin/archive', icon: Image, minRole: 'ADMIN' },
      ],
    },
    {
      group: 'COMMUNICATION',
      items: [
        { label: 'Announcements', path: '/admin/announcements', icon: Bell, minRole: 'EDITOR' },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { label: 'Admin Users', path: '/admin/users', icon: ShieldCheck, minRole: 'SUPER_ADMIN' },
        { label: 'Settings', path: '/admin/settings', icon: Settings, minRole: 'SUPER_ADMIN' },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <aside className="w-64 border-r border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0A0A0C] p-6 hidden md:flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="space-y-8">
        {/* Brand Header */}
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          <ItsaLogo className="h-8 w-auto object-contain" alt="ITSA Logo" />
          <div className="flex flex-col border-l border-black/10 dark:border-white/10 pl-3">
            <span className="font-display font-bold text-sm tracking-tight text-[#111113] dark:text-[#F5F5F7]">
              ITSA CMS
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[9px] text-[#0072CE] dark:text-[#38BDF8] uppercase tracking-wider font-semibold">
                {role}
              </span>
            </div>
          </div>
        </Link>

        {/* Grouped Navigation */}
        <nav className="space-y-6">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-2">
              <span className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-widest px-3 block">
                {grp.group}
              </span>
              <div className="space-y-1">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isRestricted = isEditor && item.minRole !== 'EDITOR';

                  if (isRestricted) {
                    return (
                      <div
                        key={item.path}
                        title="Requires ADMIN or SUPER_ADMIN privileges"
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl font-mono text-xs text-neutral-400 dark:text-neutral-600 opacity-60 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <Lock className="w-3 h-3 text-neutral-400" />
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs transition-all ${
                          isActive
                            ? 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold shadow-sm'
                            : 'text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Admin Profile & Actions */}
      <div className="pt-6 border-t border-black/10 dark:border-white/10 space-y-4">
        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8]">
            <Shield className="w-3 h-3" />
            <span className="uppercase font-semibold">{adminProfile?.full_name || 'Admin User'}</span>
          </div>
          <p className="font-mono text-[11px] text-[#111113] dark:text-[#F5F5F7] truncate font-medium">
            {user?.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-black/10 dark:border-white/10 font-mono text-[11px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <span>View Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 text-inherit hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-mono text-xs transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
