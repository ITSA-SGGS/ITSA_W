import { Router } from 'express';
import { siteSettingsController } from '../controllers/siteSettings.controller.js';

const router = Router();

// Public settings endpoint: returns only settings marked is_public = true
router.get('/public', siteSettingsController.getPublicSettings);

export default router;
