import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { publicTeamQuerySchema } from '../validation/team.schema.js';

const router = Router();

// Public team read endpoint: strictly active members only, zero private data
router.get(
  '/',
  validateRequest({ query: publicTeamQuerySchema }),
  teamController.getPublicTeam
);

export default router;
