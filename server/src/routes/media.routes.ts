/**
 * ITSA Platform — Media & Storage Routes
 * Phase 4: Storage & Media Migration
 */

import { Router } from 'express';
import { mediaController } from '../controllers/media.controller.js';
import {
  requireAuth,
  requireAdminOrHigher,
  requireEditorOrHigher,
} from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../storage/multer.js';

// 1. Public Media Router
export const publicMediaRouter = Router();
publicMediaRouter.get('/resolve', mediaController.resolveMedia);
publicMediaRouter.get('/config', mediaController.getStorageConfig);

// 2. Admin Media Router (requires authenticated session cookie)
export const adminMediaRouter = Router();

adminMediaRouter.use(requireAuth);

// Generic upload endpoint with category query/body parameter
adminMediaRouter.post(
  '/upload',
  uploadSingleImage,
  mediaController.uploadMedia
);

// Category-specific convenience endpoints
adminMediaRouter.post(
  '/upload/event',
  requireEditorOrHigher,
  uploadSingleImage,
  mediaController.uploadEventMedia
);

adminMediaRouter.post(
  '/upload/team',
  requireAdminOrHigher,
  uploadSingleImage,
  mediaController.uploadTeamMedia
);

adminMediaRouter.post(
  '/upload/archive',
  requireAdminOrHigher,
  uploadSingleImage,
  mediaController.uploadArchiveMedia
);

// Delete media endpoint
adminMediaRouter.delete(
  '/',
  requireAdminOrHigher,
  mediaController.deleteMedia
);

export default {
  public: publicMediaRouter,
  admin: adminMediaRouter,
};
