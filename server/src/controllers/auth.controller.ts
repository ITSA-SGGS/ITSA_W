import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { SESSION_COOKIE_NAME, SESSION_TTL_MS, env } from '../config/env.js';
import { extractToken } from '../middleware/auth.middleware.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const authController = {
  /**
   * POST /api/auth/login
   * Authenticates user, sets HTTP-only cookie, and returns safe user profile.
   */
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as LoginInput;
      const userAgent = req.headers['user-agent'] || undefined;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || undefined;

      const { rawToken, user, expiresAt } = await authService.login(email, password, {
        userAgent,
        ipAddress,
      });

      // Set secure HTTP-only cookie
      res.cookie(SESSION_COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_MS,
        expires: expiresAt,
      });

      sendSuccess(res, { user }, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Invalidates database session and clears HTTP-only cookie.
   */
  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      if (token) {
        await authService.logout(token);
      }

      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      sendSuccess(res, { message: 'Logged out successfully' }, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   * Returns current authenticated admin user profile.
   */
  getMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      sendSuccess(res, { user: req.user }, 200);
    } catch (error) {
      next(error);
    }
  },
};
