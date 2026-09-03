import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

router.get('/', healthController.getHealth);
router.get('/db', healthController.getDatabaseHealth);

export default router;
