import React from 'react';

export const AdminLoadingState: React.FC<{ message?: string }> = ({
  message = 'FETCHING CMS DATA // ITSA REPOSITORY',
}) => {
  return (
    <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
      <div className="flex items-center gap-2 font-mono text-xs text-[#0072CE] dark:text-[#38BDF8] uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-[#0072CE] dark:bg-[#38BDF8] animate-ping" />
        <span>{message}</span>
      </div>
      <div className="w-48 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <div className="w-full h-full bg-[#0072CE] dark:bg-[#38BDF8] animate-pulse" />
      </div>
    </div>
  );
};
