import React, { useEffect, useState } from 'react';
import { CommitteeMember } from '../types';
import { X } from 'lucide-react';

interface ProfileModalProps {
  member: CommitteeMember | null;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ member, onClose }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [member]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && member) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [member, onClose]);

  if (!member) return null;

  // Generate initials for clean fallback avatar
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-name"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[#F5F5F2] dark:bg-[#0A0A0C] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#6E6E73] hover:text-[#111113] dark:hover:text-[#F5F5F7] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE]"
          aria-label="Close profile"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6 pt-2">
          {/* Photograph / Portrait */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center shadow-inner">
            {!imgError ? (
              <img
                src={member.photo}
                alt={member.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover grayscale contrast-110 transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10">
                <span className="font-display font-bold text-3xl sm:text-4xl text-[#111113] dark:text-[#F5F5F7] tracking-tight">
                  {initials}
                </span>
                <span className="font-mono text-[9px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-widest mt-1">
                  ITSA · SGGSIE&amp;T
                </span>
              </div>
            )}
          </div>

          {/* Name & Official Position */}
          <div className="space-y-2 max-w-xs">
            <h3
              id="profile-name"
              className="text-2xl sm:text-3xl font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight"
            >
              {member.name}
            </h3>
            <p className="font-mono text-xs sm:text-sm font-semibold text-[#0072CE] dark:text-[#38BDF8] uppercase tracking-wider">
              {member.position}
            </p>
          </div>

          <div className="w-full pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-[#6E6E73] dark:text-[#8E8E93]">
            <span>ACADEMIC YEAR 2026–2027</span>
            <span>ITSA SGGSIE&amp;T</span>
          </div>
        </div>
      </div>
    </div>
  );
};
