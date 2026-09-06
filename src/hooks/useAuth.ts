/**
 * ITSA Web Platform — useAuth Hook
 * Provides Express HttpOnly cookie sessions.
 */

import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useAuthContext();

  return {
    ...context,
    // Provide session: null for backward compatibility with any component referencing session
    session: null,
  };
}

export type { AuthContextType } from '../context/AuthContext';
