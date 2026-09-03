import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import { useTeam } from '../../hooks/useTeam';
import { useArchive } from '../../hooks/useArchive';
import { usePositions } from '../../hooks/usePositions';
import { AdminStat } from '../../components/admin/AdminStat';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import {
  Calendar,
  Users,
  Image,
  Briefcase,
  Plus,
  ArrowRight,
  ShieldCheck,
  Server,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, adminProfile, isConfigured } = useAuth();
  const { events, loading: eventsLoading } = useEvents();
  const { members, loading: teamLoading } = useTeam();
  const { items: archiveItems, loading: archiveLoading } = useArchive();
  const { positions, loading: posLoading } = usePositions();

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const upcomingEvents = events.slice(0, 4);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Top Greeting & Header */}
      <AdminPageHeader
        eyebrow="EXECUTIVE OVERVIEW"
        title={`${getGreeting()}, ${adminProfile?.full_name?.split(' ')[0] || 'Administrator'}.`}
        description="Manage the public ITSA website, committee records, documentary archives, and live announcements."
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[#6E6E73] dark:text-[#8E8E93]">
            {isConfigured ? 'Live PostgreSQL Engine' : 'Mock Fallback Engine'}
          </span>
        </div>
      </AdminPageHeader>

      {/* Content Metrics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AdminStat
          label="Events"
          value={eventsLoading ? '—' : events.length}
          subtext="Technical, Sports &amp; Cultural"
          icon={Calendar}
          to="/admin/events"
          category="CATALOGUE"
        />
        <AdminStat
          label="People"
          value={teamLoading ? '—' : members.length}
          subtext="Core, TY, SY &amp; Faculty"
          icon={Users}
          to="/admin/people"
          category="ROSTER"
        />
        <AdminStat
          label="Archive Records"
          value={archiveLoading ? '—' : archiveItems.length}
          subtext="Documentary Photographs"
          icon={Image}
          to="/admin/archive"
          category="GALLERY"
        />
        <AdminStat
          label="Positions"
          value={posLoading ? '—' : (positions.length || 32)}
          subtext="Committee Hierarchy Roles"
          icon={Briefcase}
          to="/admin/positions"
          category="DIRECTORY"
        />
      </div>

      {/* 2-Column Section: Upcoming Events + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upcoming Events Roster */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
            <div className="space-y-0.5">
              <span className="font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold">
                // SESSIONS
              </span>
              <h2 className="text-xl font-display font-bold text-[#111113] dark:text-[#F5F5F7]">
                Upcoming Events
              </h2>
            </div>
            <Link
              to="/admin/events"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#0072CE] dark:text-[#38BDF8] hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-black/5 dark:divide-white/5 font-mono text-xs">
            {upcomingEvents.map((evt) => (
              <div key={evt.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-display font-semibold text-sm text-[#111113] dark:text-[#F5F5F7] block">
                    {evt.title}
                  </span>
                  <span className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                    {evt.category || 'TECHNICAL'} · {evt.year || '2026'}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {evt.status || 'UPCOMING'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Actions & Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions Panel */}
          <div className="p-6 sm:p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm space-y-6">
            <div className="space-y-0.5 pb-4 border-b border-black/10 dark:border-white/10">
              <span className="font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold">
                // SHORTCUTS
              </span>
              <h2 className="text-xl font-display font-bold text-[#111113] dark:text-[#F5F5F7]">
                Quick Actions
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/admin/events"
                className="p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#0072CE]/10 hover:border-[#0072CE]/30 transition-all text-left space-y-1 group"
              >
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8]">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
                </div>
                <p className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93]">
                  Create symposium or match
                </p>
              </Link>

              <Link
                to="/admin/people"
                className="p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#0072CE]/10 hover:border-[#0072CE]/30 transition-all text-left space-y-1 group"
              >
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8]">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Person</span>
                </div>
                <p className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93]">
                  Enlist committee member
                </p>
              </Link>

              <Link
                to="/admin/archive"
                className="p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#0072CE]/10 hover:border-[#0072CE]/30 transition-all text-left space-y-1 group"
              >
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8]">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Photo</span>
                </div>
                <p className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93]">
                  Upload documentary media
                </p>
              </Link>

              <Link
                to="/admin/announcements"
                className="p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#0072CE]/10 hover:border-[#0072CE]/30 transition-all text-left space-y-1 group"
              >
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#0072CE] dark:group-hover:text-[#38BDF8]">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Broadcast</span>
                </div>
                <p className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93]">
                  Post active notice
                </p>
              </Link>
            </div>
          </div>

          {/* Security & System Info Pill */}
          <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>SECURITY PROTOCOLS ENGAGED</span>
            </div>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed">
              PostgreSQL Row Level Security governs active session permissions. Client-side mutations are strictly validated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
