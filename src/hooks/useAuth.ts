/**
 * ITSA Web Platform — useAuth Hook
 * Phase 5: Re-exports unified session context from AuthContext.
 * Decoupled from Supabase Auth in favor of Express HttpOnly cookie sessions.
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
