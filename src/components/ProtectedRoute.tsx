import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isConfigured, loading, signOut, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="flex items-center gap-3 font-mono text-xs text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-[#0072CE] dark:bg-[#38BDF8] animate-ping" />
          <span>VERIFYING CREDENTIALS // ITSA SECURITY</span>
        </div>
      </div>
    );
  }

  // If not logged into Supabase Auth
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If logged in, but not an authorized administrator in admin_profiles
  if (isConfigured && !isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-[#111113] dark:text-[#F5F5F7]">
              Access Restricted
            </h2>
            <p className="text-xs font-mono text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed">
              The authenticated account (<strong>{user?.email}</strong>) is not registered in the ITSA Administrative Directory.
            </p>
          </div>

          <div className="pt-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 py-2.5 px-4 rounded-xl border border-black/10 dark:border-white/10 font-mono text-xs inline-flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-mono text-xs inline-flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
