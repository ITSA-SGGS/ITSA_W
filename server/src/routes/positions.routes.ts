import { Router } from 'express';

const router = Router();

// Foundation placeholder for Phase 3 CMS endpoints
router.get('/', (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Positions API endpoints will be implemented in Phase 3.',
    },
  });
});

export default router;
