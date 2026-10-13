import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminMobileNav } from './AdminMobileNav';

export const AdminLayout: React.FC = () => {
  useEffect(() => {
    document.title = 'Admin Workspace | ITSA SGGSIE&T';
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 antialiased selection:bg-[#0072CE] selection:text-white">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Mobile Top Navigation & Drawer */}
      <AdminMobileNav />

      {/* Main Scrollable Admin Workspace */}
      <main className="flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};
