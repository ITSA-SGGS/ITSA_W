import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { SESSION_COOKIE_NAME } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { AdminRole, SafeAdminUser } from '../types/database.js';

/**
 * Extracts session token exclusively from HTTP-only session cookie.
 * Bearer tokens in Authorization headers are intentionally rejected;
 * authentication requires secure HTTP-only cookies.
 */
export function extractToken(req: Request): string | null {
  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    const cookieVal = req.cookies[SESSION_COOKIE_NAME];
    if (typeof cookieVal === 'string' && cookieVal.trim().length > 0) {
      return cookieVal.trim();
    }
  }

  return null;
}

/**
 * Authentication middleware: verifies active database-backed session.
 * Rejects with 401 Unauthorized if token is missing, expired, or user is deactivated.
 * Attaches req.user (SafeAdminUser) and req.session to the request object.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }

    const active = await authService.verifySession(token);

    if (!active) {
      // Clear invalid or expired cookie
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      throw new UnauthorizedError('Session is invalid or has expired. Please log in again.');
    }

    // Attach authenticated identity to request
    req.user = active.user;
    req.session = {
      id: active.session.id,
      expires_at: active.session.expires_at,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) middleware:
 * Requires authenticated user to hold one of the specified roles.
 * Returns 401 if unauthenticated, 403 Forbidden if role lacks permission.
 */
export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Insufficient privileges. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`
        )
      );
    }

    next();
  };
}

/**
 * Convenience authorization helpers matching ITSA role tiers
 */
export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireAdminOrHigher = requireRole('SUPER_ADMIN', 'ADMIN');
export const requireEditorOrHigher = requireRole('SUPER_ADMIN', 'ADMIN', 'EDITOR');
