import React, { useState, useEffect } from 'react';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useAuth } from '../../hooks/useAuth';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminLoadingState } from '../../components/admin/AdminLoadingState';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { ShieldAlert, Save, Globe, Terminal, Quote, Mail, Share2, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, loading, saving, saveAllSettings } = useSiteSettings();
  const { isSuperAdmin, isAdmin } = useAuth();

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Controlled form state
  const [academicYear, setAcademicYear] = useState('2026–2027');
  const [telemetryStatus, setTelemetryStatus] = useState('SYS: LINUX_KERNEL_STABLE');
  const [quoteText, setQuoteText] = useState('The best way to predict the future is to invent it.');
  const [quoteAuthor, setQuoteAuthor] = useState('Alan Kay');
  const [contactEmail, setContactEmail] = useState('itsa@sggs.ac.in');
  const [institutionName, setInstitutionName] = useState('SGGSIE&T, Nanded');
  const [departmentAddress, setDepartmentAddress] = useState(
    'Department of Information Technology, SGGSIE&T, Vishnupuri, Nanded - 431606'
  );
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/company/itsa-sggsiet');
  const [githubUrl, setGithubUrl] = useState('https://github.com/itsa-sggsiet');
  const [instagramUrl, setInstagramUrl] = useState('https://instagram.com/itsa_sggsiet');

  useEffect(() => {
    if (settings) {
      if (settings.academic_year) setAcademicYear(settings.academic_year);
      if (settings.telemetry_status) setTelemetryStatus(settings.telemetry_status);
      if (settings.quote_content) {
        setQuoteText(settings.quote_content.quote || '');
        setQuoteAuthor(settings.quote_content.author || '');
      }
      if (settings.contact_info) {
        setContactEmail(settings.contact_info.email || '');
        setInstitutionName(settings.contact_info.institution || '');
        setDepartmentAddress(settings.contact_info.address || '');
      }
      if (settings.social_links) {
        setLinkedinUrl(settings.social_links.linkedin || '');
        setGithubUrl(settings.social_links.github || '');
        setInstagramUrl(settings.social_links.instagram || '');
      }
    }
  }, [settings]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isSuperAdmin) {
      addToast('error', 'Only SUPER_ADMIN accounts can modify global site settings.');
      return;
    }

    try {
      const payload = {
        academic_year: academicYear.trim(),
        telemetry_status: telemetryStatus.trim(),
        quote_content: {
          quote: quoteText.trim(),
          author: quoteAuthor.trim(),
        },
        contact_info: {
          email: contactEmail.trim(),
          institution: institutionName.trim(),
          address: departmentAddress.trim(),
        },
        social_links: {
          linkedin: linkedinUrl.trim(),
          github: githubUrl.trim(),
          instagram: instagramUrl.trim(),
        },
      };

      await saveAllSettings(payload);
      addToast('success', 'Global site settings updated successfully.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save site settings.');
    }
  };

  if (loading && !settings) {
    return <AdminLoadingState message="FETCHING SITE SETTINGS // ITSA REPOSITORY" />;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Toast Feedback */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <AdminPageHeader
        eyebrow="GLOBAL CONFIGURATION"
        title="Site Settings"
        description="Configure active academic tenure, hero telemetry strings, cinematic quotes, and official departmental coordinates."
        actionLabel={isSuperAdmin ? (saving ? 'Saving...' : 'Save Settings') : undefined}
        actionIcon={Save}
        onAction={isSuperAdmin ? () => { handleSave(); } : undefined}
      />

      {!isSuperAdmin && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3 text-amber-600 dark:text-amber-400 font-mono text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Note: Global site settings are in read-only mode. Modifying these values requires <strong>SUPER_ADMIN</strong> privileges.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Academic Tenure */}
        <div className="p-6 sm:p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
            <Globe className="w-4 h-4 text-[#0072CE] dark:text-[#38BDF8]" />
            <div>
              <h2 className="text-base font-display font-semibold text-[#111113] dark:text-[#F5F5F7]">
                Site &amp; Academic Tenure
              </h2>
              <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                Active academic year displayed across committee rosters, headers, and footers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
                Academic Year
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin || saving}
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026–2027"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 2. Hero Telemetry */}
        <div className="p-6 sm:p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
            <Terminal className="w-4 h-4 text-[#0072CE] dark:text-[#38BDF8]" />
            <div>
              <h2 className="text-base font-display font-semibold text-[#111113] dark:text-[#F5F5F7]">
                Hero Telemetry Indicator
              </h2>
              <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                System status label shown in the hero terminal interface.
              </p>
            </div>
          </div>

          <div className="font-mono text-xs space-y-1.5">
            <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
              Kernel Telemetry String
            </label>
            <input
              type="text"
              disabled={!isSuperAdmin || saving}
              value={telemetryStatus}
              onChange={(e) => setTelemetryStatus(e.target.value)}
              placeholder="SYS: LINUX_KERNEL_STABLE"
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* 3. Cinematic Quote */}
        <div className="p-6 sm:p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
            <Quote className="w-4 h-4 text-[#0072CE] dark:text-[#38BDF8]" />
            <div>
              <h2 className="text-base font-display font-semibold text-[#111113] dark:text-[#F5F5F7]">
                Cinematic Quote Section
              </h2>
              <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                Featured quote displayed between Events and People sections.
              </p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
                Quote Text
              </label>
              <textarea
                rows={2}
                disabled={!isSuperAdmin || saving}
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="The best way to predict the future is to invent it."
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
                Attribution / Author
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin || saving}
                value={quoteAuthor}
                onChange={(e) => setQuoteAuthor(e.target.value)}
                placeholder="Alan Kay"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 4. Contact Coordinates */}
        <div className="p-6 sm:p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
            <Mail className="w-4 h-4 text-[#0072CE] dark:text-[#38BDF8]" />
            <div>
              <h2 className="text-base font-display font-semibold text-[#111113] dark:text-[#F5F5F7]">
                Official Contact Coordinates
              </h2>
              <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                Official email address and campus coordinates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
                Official Email
              </label>
              <input
                type="email"
                disabled={!isSuperAdmin || saving}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="itsa@sggs.ac.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
                Institution
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin || saving}
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="SGGSIE&T, Nanded"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 5. Official Social Links */}
        <div className="p-6 sm:p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
            <Share2 className="w-4 h-4 text-[#0072CE] dark:text-[#38BDF8]" />
            <div>
              <h2 className="text-base font-display font-semibold text-[#111113] dark:text-[#F5F5F7]">
                Official Social Profiles
              </h2>
              <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                Social coordinates for footer and public links.
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin || saving}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/company/itsa-sggsiet"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
                GitHub Organization URL
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin || saving}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/itsa-sggsiet"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
                Instagram URL
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin || saving}
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/itsa_sggsiet"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        {isSuperAdmin && (
          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 active:scale-95 transition-all font-mono text-xs font-semibold shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
