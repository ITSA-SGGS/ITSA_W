import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionTooltip?: string;
  children?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  eyebrow = 'CMS MANAGEMENT',
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  actionDisabled = false,
  actionTooltip,
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 mb-8 border-b border-black/10 dark:border-white/10 gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#0072CE] dark:text-[#38BDF8] tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0072CE] dark:bg-[#38BDF8]" />
          <span>// {eyebrow}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[#111113] dark:text-[#F5F5F7]">
          {title}
        </h1>
        {description && (
          <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {children}
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            title={actionTooltip}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] ${
              actionDisabled
                ? 'bg-black/5 dark:bg-white/5 text-neutral-400 cursor-not-allowed border border-black/5 dark:border-white/5'
                : 'bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] hover:opacity-90 active:scale-95 shadow-sm'
            }`}
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
