import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import {
  requireAuth,
  requireSuperAdmin,
  requireAdminOrHigher,
  requireEditorOrHigher,
} from '../middleware/auth.middleware.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// Defense-in-depth guard: Reject with 404 immediately if executed in production
router.use((_req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV === 'production') {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    });
    return;
  }
  next();
});

// Endpoint requiring SUPER_ADMIN role
router.get('/super-admin', requireAuth, requireSuperAdmin, (req, res) => {
  sendSuccess(res, { message: 'SUPER_ADMIN access granted', user: req.user });
});

// Endpoint requiring ADMIN or SUPER_ADMIN
router.get('/admin', requireAuth, requireAdminOrHigher, (req, res) => {
  sendSuccess(res, { message: 'ADMIN_OR_HIGHER access granted', user: req.user });
});

// Endpoint requiring EDITOR, ADMIN, or SUPER_ADMIN
router.get('/editor', requireAuth, requireEditorOrHigher, (req, res) => {
  sendSuccess(res, { message: 'EDITOR_OR_HIGHER access granted', user: req.user });
});

export default router;
