import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="py-20 px-6 rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.01] dark:bg-white/[0.01] flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-[#6E6E73] dark:text-[#8E8E93]">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-display font-semibold text-[#111113] dark:text-[#F5F5F7]">
          {title}
        </h3>
        <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
