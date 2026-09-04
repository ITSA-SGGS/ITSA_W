import { Router } from 'express';
import { archiveController } from '../controllers/archive.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { publicArchiveQuerySchema } from '../validation/archive.schema.js';

const router = Router();

// Public archive read endpoint: strictly published records only
router.get(
  '/',
  validateRequest({ query: publicArchiveQuerySchema }),
  archiveController.getPublicArchive
);

export default router;
