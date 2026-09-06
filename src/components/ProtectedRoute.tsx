import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminRole } from '../types';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

const ROLE_RANK: Record<AdminRole, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  EDITOR: 1,
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
  minRole?: AdminRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  minRole,
}) => {
  const { isAuthenticated, isLoading, loading, signOut, user, role } = useAuth();
  const location = useLocation();

  const checking = isLoading || loading;

  if (checking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="flex items-center gap-3 font-mono text-xs text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-[#0072CE] dark:bg-[#38BDF8] animate-ping" />
          <span>VERIFYING CREDENTIALS // ITSA SECURITY</span>
        </div>
      </div>
    );
  }

  // If unauthenticated (no active session cookie in Neon backend)
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If authenticated but account is inactive
  if (!user.is_active) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-[#111113] dark:text-[#F5F5F7]">
              Account Deactivated
            </h2>
            <p className="text-xs font-mono text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed">
              The administrator account (<strong>{user.email}</strong>) has been deactivated. Please contact a Super Administrator.
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

  // Enforce role requirement if specified
  const targetMinRole = requiredRole || minRole;
  if (targetMinRole && role) {
    const userRank = ROLE_RANK[role] || 0;
    const requiredRank = ROLE_RANK[targetMinRole] || 0;

    if (userRank < requiredRank) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
          <div className="max-w-md w-full p-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-display font-bold text-[#111113] dark:text-[#F5F5F7]">
                Insufficient Permissions
              </h2>
              <p className="text-xs font-mono text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed">
                Access to this section requires <strong>{targetMinRole}</strong> authorization. Your current role is <strong>{role}</strong>.
              </p>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row gap-3">
              <Link
                to="/admin/dashboard"
                className="flex-1 py-2.5 px-4 rounded-xl border border-black/10 dark:border-white/10 font-mono text-xs inline-flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
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
  }

  return <>{children}</>;
};
