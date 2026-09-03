import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

export default router;
