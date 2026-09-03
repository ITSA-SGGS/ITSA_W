import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Lock, ArrowLeft, Sun, Moon } from 'lucide-react';
import { ItsaLogo } from '../../components/ItsaLogo';

export const AdminLogin: React.FC = () => {
  const { signInWithPassword, isConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await signInWithPassword(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 sm:p-12 transition-colors duration-300">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO PUBLIC PORTAL</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-inherit"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-12">
        <div className="p-8 sm:p-10 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-xl space-y-8">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 pb-2">
            <ItsaLogo className="h-10 w-auto object-contain" alt="ITSA Official Logo" />
            <div className="flex flex-col border-l border-black/10 dark:border-white/10 pl-3">
              <span className="font-display font-bold text-lg tracking-tight">ITSA</span>
              <span className="font-mono text-[9px] text-[#6E6E73] dark:text-[#8E8E93]">CMS PORTAL</span>
            </div>
          </div>

          {/* Eyebrow and Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>// RESTRICTED ACCESS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[#111113] dark:text-[#F5F5F7]">
              ITSA Administration
            </h1>
            <p className="text-xs font-mono text-[#6E6E73] dark:text-[#8E8E93]">
              Department of Information Technology · SGGSIE&amp;T
            </p>
          </div>

          {!isConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-xs leading-relaxed">
              <strong>Notice:</strong> Supabase environment variables are currently unconfigured. Add <code className="text-[11px] font-bold">VITE_SUPABASE_URL</code> and <code className="text-[11px] font-bold">VITE_SUPABASE_ANON_KEY</code> to your <code className="text-[11px]">.env</code> file.
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-mono text-xs leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block font-mono text-xs text-[#48484E] dark:text-[#A1A1A6] uppercase tracking-wider"
              >
                Official Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@sggs.ac.in"
                className="w-full px-4 py-3 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] dark:focus:ring-[#38BDF8] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-mono text-xs text-[#48484E] dark:text-[#A1A1A6] uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] dark:focus:ring-[#38BDF8] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full py-3.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 disabled:opacity-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE]"
            >
              {loading ? 'AUTHENTICATING...' : 'AUTHORIZE SESSION →'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
        PROTECTED BY POSTGRESQL ROW LEVEL SECURITY · SGGSIE&amp;T
      </div>
    </div>
  );
};
