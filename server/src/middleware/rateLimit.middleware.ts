import { rateLimit } from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env.js';

/**
 * Strict rate limiter for authentication endpoints (login, credential checks).
 * Mitigates brute-force attacks and credential stuffing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Max 10 attempts per window per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
      },
    });
  },
});

/**
 * General API rate limiter for administrative and public endpoints.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 120, // 120 requests per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please slow down.',
      },
    });
  },
});
