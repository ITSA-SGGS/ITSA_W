import { Router } from 'express';
import { eventsController } from '../controllers/events.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { publicEventsQuerySchema } from '../validation/events.schema.js';

const router = Router();

// Public events read endpoint: strictly returns published events
router.get(
  '/',
  validateRequest({ query: publicEventsQuerySchema }),
  eventsController.getPublicEvents
);

export default router;
