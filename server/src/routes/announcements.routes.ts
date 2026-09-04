import { Router } from 'express';
import { announcementsController } from '../controllers/announcements.controller.js';

const router = Router();

// Public active announcements endpoint: strictly published and within valid timeframe
router.get('/active', announcementsController.getActiveAnnouncements);

export default router;
