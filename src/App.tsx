import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { AdminLoadingState } from './components/admin/AdminLoadingState';

// Route-level code splitting for admin components
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const EventsPage = lazy(() => import('./pages/admin/EventsPage').then((m) => ({ default: m.EventsPage })));
const PeoplePage = lazy(() => import('./pages/admin/PeoplePage').then((m) => ({ default: m.PeoplePage })));
const PositionsPage = lazy(() => import('./pages/admin/PositionsPage').then((m) => ({ default: m.PositionsPage })));
const ArchivePage = lazy(() => import('./pages/admin/ArchivePage').then((m) => ({ default: m.ArchivePage })));
const AnnouncementsPage = lazy(() => import('./pages/admin/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute })));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Website */}
          <Route path="/" element={<HomePage />} />

          {/* Admin Authentication */}
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<AdminLoadingState message="INITIALIZING CMS LOGIN" />}>
                <AdminLogin />
              </Suspense>
            }
          />

          {/* Protected Admin Routing System */}
          <Route
            path="/admin"
            element={
              <Suspense fallback={<AdminLoadingState />}>
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              </Suspense>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="positions" element={<PositionsPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
