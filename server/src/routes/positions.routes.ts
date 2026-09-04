import { Router } from 'express';
import { positionsController } from '../controllers/positions.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { publicPositionsQuerySchema } from '../validation/positions.schema.js';

const router = Router();

// Public positions read endpoint: strictly active positions only
router.get(
  '/',
  validateRequest({ query: publicPositionsQuerySchema }),
  positionsController.getPublicPositions
);

export default router;
