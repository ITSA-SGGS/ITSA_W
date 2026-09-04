import { Router } from 'express';
import { env } from '../config/env.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import eventsRoutes from './events.routes.js';
import teamRoutes from './team.routes.js';
import positionsRoutes from './positions.routes.js';
import archiveRoutes from './archive.routes.js';
import announcementsRoutes from './announcements.routes.js';
import settingsRoutes from './settings.routes.js';
import usersRoutes from './users.routes.js';

const router = Router();

// Health check endpoints
router.use('/health', healthRoutes);

// Phase 2 Authentication & Session endpoints
router.use('/auth', authRoutes);

// Phase 3 Foundation Endpoints
router.use('/events', eventsRoutes);
router.use('/team', teamRoutes);
router.use('/positions', positionsRoutes);
router.use('/archive', archiveRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', usersRoutes);

// Development & automated testing helper routes (NEVER mounted in production)
if (env.NODE_ENV !== 'production') {
  const { default: testRbacRoutes } = await import('./testRbac.routes.js');
  router.use('/test-rbac', testRbacRoutes);
}

export default router;
