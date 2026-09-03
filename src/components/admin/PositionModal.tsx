import React, { useState, useEffect } from 'react';
import { Position, PositionFormData, CommitteeTier } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface PositionModalProps {
  isOpen: boolean;
  position: Position | null; // null for create, Position for edit
  onClose: () => void;
  onSave: (data: PositionFormData) => Promise<void>;
}

export const PositionModal: React.FC<PositionModalProps> = ({
  isOpen,
  position,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(position);

  const [formData, setFormData] = useState<PositionFormData>({
    name: '',
    tier: 'CORE',
    domain: 'OVERALL',
    description: '',
    display_order: 0,
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name || '',
        tier: position.tier || 'CORE',
        domain: (position.domain as string) || 'OVERALL',
        description: position.description || '',
        display_order: position.display_order ?? 0,
        is_active: position.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        tier: 'CORE',
        domain: 'OVERALL',
        description: '',
        display_order: 0,
        is_active: true,
      });
    }
    setErrorMessage(null);
  }, [position, isOpen]);

  // Modal body scroll lock & Escape key
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Position Title cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save position.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="position-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0D0F] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-6 sm:p-10 shadow-2xl space-y-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-black/10 dark:border-white/10">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold">
              // {isEditing ? 'EDIT POSITION' : 'CREATE POSITION'}
            </span>
            <h2 id="position-modal-title" className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              {isEditing ? 'Edit Position' : 'Add New Position'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-xl text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 01: Position Identity */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              01 // POSITION SPECIFICATION
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Position Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. AI Research Coordinator / Technical Co-Head"
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Tier Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as CommitteeTier })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                >
                  <option value="CORE">CORE COMMITTEE</option>
                  <option value="TY_LEADERSHIP">THIRD YEAR (TY) LEADERSHIP</option>
                  <option value="SY_COORDINATOR">SECOND YEAR (SY) COORDINATOR</option>
                  <option value="FACULTY">FACULTY ADVISORY</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Domain Portfolio
                </label>
                <select
                  value={formData.domain || 'OVERALL'}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-[#FFFFFF] dark:bg-[#0D0D0F] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                >
                  <option value="OVERALL">OVERALL</option>
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="ANCHORING">ANCHORING</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="ALUMNI">ALUMNI & RELATIONS</option>
                  <option value="OPERATIONS">OPERATIONS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Role Description (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of duties and committee remit..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all resize-y"
              />
            </div>
          </div>

          {/* Section 02: Ordering & Status */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              02 // HIERARCHY &amp; STATUS
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none font-mono text-xs">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-black/20 text-[#0072CE] focus:ring-[#0072CE]"
                />
                <span>Active Position (Available for assigning committee members)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3 font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 active:scale-95 transition-all font-semibold shadow-sm"
            >
              {submitting ? 'Saving Position...' : isEditing ? 'Update Position' : 'Create Position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
