import React from 'react';
import { AdminEmptyState } from './AdminEmptyState';

interface AdminTableProps {
  headers: string[];
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const AdminTable: React.FC<AdminTableProps> = ({
  headers,
  children,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no records matching this query.',
}) => {
  if (isEmpty) {
    return <AdminEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0D0D0F] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-5 py-3.5 font-mono text-[10px] sm:text-[11px] text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-wider font-semibold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono text-xs">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};
