import { Router } from 'express';
import {
  requireAuth,
  requireSuperAdmin,
  requireAdminOrHigher,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validation/common.schema.js';
import { adminUsersController } from '../controllers/adminUsers.controller.js';
import {
  inviteUserSchema,
  updateUserSchema,
  toggleUserActiveSchema,
} from '../validation/users.schema.js';

const router = Router();

// Backward-compatible alias for /api/admin/users
router.use(requireAuth);

router.get('/', requireAdminOrHigher, adminUsersController.listUsers);
router.get(
  '/:id',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema }),
  adminUsersController.getUserById
);
router.post(
  '/invite',
  requireSuperAdmin,
  validateRequest({ body: inviteUserSchema }),
  adminUsersController.inviteUser
);
router.put(
  '/:id',
  requireSuperAdmin,
  validateRequest({ params: uuidParamSchema, body: updateUserSchema }),
  adminUsersController.updateUser
);
router.patch(
  '/:id/active',
  requireSuperAdmin,
  validateRequest({ params: uuidParamSchema, body: toggleUserActiveSchema }),
  adminUsersController.toggleActive
);
router.delete(
  '/:id',
  requireSuperAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminUsersController.deleteUser
);

export default router;
