import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CommitteeMember, MemberFormData, CommitteeTier } from '../../types';
import { usePositions } from '../../hooks/usePositions';
import { uploadMemberPhoto } from '../../services/teamService';
import { X, Upload, AlertCircle } from 'lucide-react';

interface PersonModalProps {
  isOpen: boolean;
  member: CommitteeMember | null; // null for create, CommitteeMember for edit
  onClose: () => void;
  onSave: (data: MemberFormData) => Promise<void>;
}

const COMMON_POSITIONS: Record<CommitteeTier, string[]> = {
  CORE: ['President', 'Vice President', 'Treasurer', 'Vice Treasurer'],
  TY_LEADERSHIP: [
    'Technical Head',
    'Technical Co-Head',
    'Event Operations Head',
    'Event Operations Co-Head',
    'Media Head',
    'Media Co-Head',
    'Anchoring Head',
    'Anchoring Co-Head',
    'Sports Head',
    'Sports Co-Head',
    'Alumni & Relations Head',
    'Alumni & Relations Co-Head',
  ],
  SY_COORDINATOR: [
    'Main Coordinator',
    'Joint Coordinator',
    'Technical Main Coordinator',
    'Technical Joint Coordinator',
    'Media Main Coordinator',
    'Media Joint Coordinator',
    'Anchoring Main Coordinator',
    'Anchoring Joint Coordinator',
    'Finance Main Coordinator',
    'Finance Joint Coordinator',
    'Sports Main Coordinator',
    'Sports Joint Coordinator',
    'Alumni & Relations Main Coordinator',
  ],
  FACULTY: ['ITSA Faculty Coordinator', 'Head of the Department', 'Dean Student Activities'],
};

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  member,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(member);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic positions from database
  const { positions } = usePositions();

  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    position: '',
    tier: 'CORE',
    domain: 'OVERALL',
    department: '',
    photo_url: '',
    linkedin_url: '',
    github_url: '',
    tenure_year: '2026–2027',
    display_order: 0,
    is_active: true,
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derive available active positions for the currently selected tier
  const availablePositions = useMemo(() => {
    const fromDb = positions
      .filter((p) => p.is_active && p.tier === formData.tier)
      .map((p) => p.name);
    if (fromDb.length > 0) return fromDb;
    return COMMON_POSITIONS[formData.tier] || [];
  }, [positions, formData.tier]);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        position: member.position || '',
        tier: member.tier || 'CORE',
        domain: member.domain || 'OVERALL',
        department: member.department || '',
        photo_url: member.photo_url || member.photo || '',
        linkedin_url: member.linkedin_url || '',
        github_url: member.github_url || '',
        tenure_year: member.tenure_year || '2026–2027',
        display_order: member.display_order ?? 0,
        is_active: member.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        position: availablePositions[0] || 'President',
        tier: 'CORE',
        domain: 'OVERALL',
        department: '',
        photo_url: '',
        linkedin_url: '',
        github_url: '',
        tenure_year: '2026–2027',
        display_order: 0,
        is_active: true,
      });
    }
    setErrorMessage(null);
  }, [member, isOpen]);

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

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setErrorMessage(null);
      const publicUrl = await uploadMemberPhoto(file);
      setFormData((prev) => ({ ...prev, photo_url: publicUrl }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Photo upload failed.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleTierChange = (newTier: CommitteeTier) => {
    const dbTierPositions = positions
      .filter((p) => p.is_active && p.tier === newTier)
      .map((p) => p.name);
    const defaultPos = dbTierPositions[0] || COMMON_POSITIONS[newTier]?.[0] || '';

    setFormData((prev) => ({
      ...prev,
      tier: newTier,
      position: isEditing && prev.tier === newTier ? prev.position : defaultPos,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Member Name is required.');
      return;
    }
    if (!formData.position.trim()) {
      setErrorMessage('Official Position is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save committee member.');
    } finally {
      setSubmitting(false);
    }
  };

  // Initials for fallback preview
  const initials = formData.name
    ? formData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'IT';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0D0F] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-6 sm:p-10 shadow-2xl space-y-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-black/10 dark:border-white/10">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase font-semibold">
              // {isEditing ? 'EDIT MEMBER' : 'ADD NEW MEMBER'}
            </span>
            <h2 id="person-modal-title" className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              {isEditing ? 'Edit Committee Member' : 'Enlist Committee Member'}
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
          {/* Section 01: Identity */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              01 // IDENTITY &amp; POSITION
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Tanishq Raut / Dr. Ankush Sawarkar"
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
                  onChange={(e) => handleTierChange(e.target.value as CommitteeTier)}
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
                  Official Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="position-suggestions"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g. Technical Head"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
                <datalist id="position-suggestions">
                  {availablePositions.map((pos) => (
                    <option key={pos} value={pos} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Department of Information Technology"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 02: Committee & Tenure */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              02 // COMMITTEE &amp; TENURE
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#48484E] dark:text-[#A1A1A6]">
                  Tenure Year
                </label>
                <input
                  type="text"
                  value={formData.tenure_year || '2026–2027'}
                  onChange={(e) => setFormData({ ...formData, tenure_year: e.target.value })}
                  placeholder="2026–2027"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
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
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none font-mono text-xs">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-black/20 text-[#0072CE] focus:ring-[#0072CE]"
                />
                <span>Active Member (Displayed in Public Committee Roster)</span>
              </label>
            </div>
          </div>

          {/* Section 03: Social Coordinates */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              03 // SOCIAL COORDINATES (OPTIONAL)
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="block text-[#48484E] dark:text-[#A1A1A6] uppercase">
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  value={formData.linkedin_url || ''}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[#48484E] dark:text-[#A1A1A6] uppercase">
                  GitHub Profile URL
                </label>
                <input
                  type="text"
                  value={formData.github_url || ''}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] focus:outline-none focus:ring-2 focus:ring-[#0072CE] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 04: Portrait Photo Upload */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold border-b border-black/5 dark:border-white/5 pb-2">
              04 // PROFILE PORTRAIT (SUPABASE STORAGE)
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Photo Preview */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {formData.photo_url ? (
                  <img
                    src={formData.photo_url}
                    alt="Member portrait"
                    className="w-full h-full object-cover grayscale"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="font-display font-bold text-2xl text-[#111113] dark:text-[#F5F5F7]">
                      {initials}
                    </span>
                    <span className="font-mono text-[8px] text-[#6E6E73] uppercase mt-0.5">
                      No Photo
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 font-mono text-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Uploading Photo...' : 'Upload Portrait'}</span>
                  </button>

                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo_url: '' })}
                      className="font-mono text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <p className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93]">
                  Portrait-friendly aspect ratio recommended · Max 5MB · Stored in 'team-photos' bucket.
                </p>
              </div>
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
              disabled={submitting || uploadingPhoto}
              className="px-6 py-2.5 rounded-xl bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 active:scale-95 transition-all font-semibold shadow-sm"
            >
              {submitting ? 'Saving Member...' : isEditing ? 'Update Member Record' : 'Enlist Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
