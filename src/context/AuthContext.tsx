import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SafeAdminUser, AdminRole } from '../types';
import { api, ApiError } from '../lib/api';

export interface AuthContextType {
  user: SafeAdminUser | null;
  adminProfile: SafeAdminUser | null;
  role: AdminRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEditor: boolean;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<SafeAdminUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<SafeAdminUser | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * On initial mount, verify whether an active session cookie exists by calling GET /api/auth/me.
   */
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const data = await api.get<{ user: SafeAdminUser }>('/api/auth/me');
        if (mounted) {
          setUser(data.user);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setUser(null);
          // HTTP 401 is expected when no active session exists — do not pollute error state
          if (err instanceof ApiError && err.status === 401) {
            setError(null);
          } else {
            setError(err.message || 'Session verification failed.');
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Authenticates user with email and password via POST /api/auth/login.
   * On success, server sets the HttpOnly `itsa_session` cookie and returns the SafeAdminUser payload.
   */
  const signInWithPassword = useCallback(async (email: string, pass: string): Promise<SafeAdminUser> => {
    setError(null);
    try {
      const data = await api.post<{ user: SafeAdminUser }>('/api/auth/login', {
        email: email.trim(),
        password: pass,
      });

      setUser(data.user);
      return data.user;
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      throw err;
    }
  }, []);

  /**
   * Logs out user via POST /api/auth/logout.
   * Server invalidates the database session and clears the HttpOnly `itsa_session` cookie.
   */
  const signOut = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn('Error during API logout:', err);
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Manually refreshes the authenticated user session from GET /api/auth/me.
   */
  const refreshUser = useCallback(async (): Promise<SafeAdminUser | null> => {
    try {
      const data = await api.get<{ user: SafeAdminUser }>('/api/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  // Derived role and permission states
  const role: AdminRole | null = user?.role ?? null;
  const isAuthenticated = Boolean(user && user.is_active);
  const isAdmin = Boolean(user && user.is_active && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));
  const isSuperAdmin = Boolean(user && user.is_active && user.role === 'SUPER_ADMIN');
  const isEditor = Boolean(user && user.is_active && user.role === 'EDITOR');

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      adminProfile: user, // Alias for backward compatibility with components reading adminProfile
      role,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isEditor,
      isLoading,
      loading: isLoading, // Alias for backward compatibility with components reading loading
      error,
      isConfigured: true,
      signInWithPassword,
      signOut,
      refreshUser,
    }),
    [user, role, isAuthenticated, isAdmin, isSuperAdmin, isEditor, isLoading, error, signInWithPassword, signOut, refreshUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
