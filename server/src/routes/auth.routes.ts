import { Router } from 'express';
import { authController, loginSchema } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin user and establish session
 * @access  Public (Rate limited)
 */
router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate current session and clear session cookie
 * @access  Authenticated / Public fallback
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve currently authenticated admin user profile
 * @access  Private (Requires active session)
 */
router.get('/me', requireAuth, authController.getMe);

export default router;
