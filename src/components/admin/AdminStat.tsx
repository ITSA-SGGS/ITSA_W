import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface AdminStatProps {
  label: string;
  value: number | string;
  subtext: string;
  icon: LucideIcon;
  to?: string;
  category?: string;
}

export const AdminStat: React.FC<AdminStatProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  to,
  category,
}) => {
  const content = (
    <div className="group relative p-6 sm:p-7 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm hover:border-[#0072CE]/40 dark:hover:border-[#38BDF8]/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-[#0072CE] dark:text-[#38BDF8]">
            <Icon className="w-4 h-4" />
          </div>
          {category && (
            <span className="font-mono text-[10px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider">
              {category}
            </span>
          )}
        </div>
        {to && (
          <div className="w-6 h-6 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-[#0072CE] group-hover:text-white dark:group-hover:bg-[#38BDF8] dark:group-hover:text-black transition-all">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <span className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider block">
          {label}
        </span>
        <div className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[#111113] dark:text-[#F5F5F7]">
          {value}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
        {subtext}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }

  return content;
};
