import React, { useState, useEffect } from 'react';
import { AdminProfile, AdminRole } from '../../types';
import { X, Shield, AlertCircle } from 'lucide-react';

interface AdminUserModalProps {
  isOpen: boolean;
  user: AdminProfile | null;
  onClose: () => void;
  onSave: (id: string, data: { role?: AdminRole; is_active?: boolean; full_name?: string }) => Promise<void>;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AdminRole>('EDITOR');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setRole(user.role || 'EDITOR');
      setIsActive(user.is_active ?? true);
    }
    setErrorMessage(null);
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onSave(user.id, {
        full_name: fullName.trim() || undefined,
        role,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update admin permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0D0F] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold">
              // ROLE &amp; AUTHORIZATION
            </span>
            <h2 id="user-modal-title" className="text-xl sm:text-2xl font-display font-bold tracking-tight">
              Edit Admin Account
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-xl text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 font-mono text-xs">
          {/* User Email (Verified Identity) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-[#6E6E73] uppercase font-semibold">
              Account Email
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] text-[#6E6E73] cursor-not-allowed select-all"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-[#48484E] dark:text-[#A1A1A6] uppercase font-semibold">
              Display Name / Identifier
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Faculty Advisor / Council Lead"
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-[#48484E] dark:text-[#A1A1A6] uppercase font-semibold">
              Assigned Authorization Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-[#FFFFFF] dark:bg-[#0D0D0F] text-[#111113] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (Full CMS + User Management + Site Settings)</option>
              <option value="ADMIN">ADMIN (Events, People, Positions, Archive, Announcements)</option>
              <option value="EDITOR">EDITOR (Events &amp; Announcements Only)</option>
            </select>
          </div>

          {/* Active Status */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-black/20 text-[#0072CE] focus:ring-[#0072CE]"
              />
              <span>Account Active (Allowed to sign into ITSA CMS Portal)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 active:scale-95 transition-all font-semibold shadow-sm"
            >
              {submitting ? 'Saving Permissions...' : 'Update Permissions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
