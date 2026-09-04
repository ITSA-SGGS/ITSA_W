import { Router } from 'express';
import {
  requireAuth,
  requireSuperAdmin,
  requireAdminOrHigher,
  requireEditorOrHigher,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validation/common.schema.js';

// Controllers
import { eventsController } from '../controllers/events.controller.js';
import { teamController } from '../controllers/team.controller.js';
import { positionsController } from '../controllers/positions.controller.js';
import { archiveController } from '../controllers/archive.controller.js';
import { announcementsController } from '../controllers/announcements.controller.js';
import { siteSettingsController } from '../controllers/siteSettings.controller.js';
import { adminUsersController } from '../controllers/adminUsers.controller.js';
import { metricsController } from '../controllers/metrics.controller.js';

// Validation Schemas
import {
  createEventSchema,
  updateEventSchema,
  adminEventsQuerySchema,
  togglePublishSchema as toggleEventPublishSchema,
  toggleFeatureSchema,
} from '../validation/events.schema.js';
import {
  createMemberSchema,
  updateMemberSchema,
  adminTeamQuerySchema,
  toggleMemberActiveSchema,
} from '../validation/team.schema.js';
import {
  createPositionSchema,
  updatePositionSchema,
  adminPositionsQuerySchema,
  togglePositionActiveSchema,
} from '../validation/positions.schema.js';
import {
  createArchiveSchema,
  updateArchiveSchema,
  adminArchiveQuerySchema,
  toggleArchivePublishSchema,
} from '../validation/archive.schema.js';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  adminAnnouncementsQuerySchema,
  toggleAnnouncementPublishSchema,
} from '../validation/announcements.schema.js';
import { batchSettingsSchema } from '../validation/settings.schema.js';
import {
  inviteUserSchema,
  updateUserSchema,
  toggleUserActiveSchema,
} from '../validation/users.schema.js';

const router = Router();

// ============================================================================
// ALL ADMIN ENDPOINTS REQUIRE AUTHENTICATION
// ============================================================================
router.use(requireAuth);

// ============================================================================
// 1. DASHBOARD METRICS (Minimum Role: EDITOR)
// ============================================================================
router.get('/metrics', requireEditorOrHigher, metricsController.getDashboardMetrics);

// ============================================================================
// 2. EVENTS CMS (Minimum Role: EDITOR for all operations)
// ============================================================================
const eventsRouter = Router();
eventsRouter.use(requireEditorOrHigher);
eventsRouter.get(
  '/',
  validateRequest({ query: adminEventsQuerySchema }),
  eventsController.getAdminEvents
);
eventsRouter.post(
  '/',
  validateRequest({ body: createEventSchema }),
  eventsController.createEvent
);
eventsRouter.get(
  '/:id',
  validateRequest({ params: uuidParamSchema }),
  eventsController.getEventById
);
eventsRouter.put(
  '/:id',
  validateRequest({ params: uuidParamSchema, body: updateEventSchema }),
  eventsController.updateEvent
);
eventsRouter.patch(
  '/:id/publish',
  validateRequest({ params: uuidParamSchema, body: toggleEventPublishSchema }),
  eventsController.togglePublish
);
eventsRouter.patch(
  '/:id/feature',
  validateRequest({ params: uuidParamSchema, body: toggleFeatureSchema }),
  eventsController.toggleFeatured
);
eventsRouter.delete(
  '/:id',
  validateRequest({ params: uuidParamSchema }),
  eventsController.deleteEvent
);
router.use('/events', eventsRouter);

// ============================================================================
// 3. TEAM / COMMITTEE MEMBERS (Read: EDITOR | Mutations: ADMIN / SUPER_ADMIN)
// ============================================================================
const teamRouter = Router();
teamRouter.get(
  '/',
  requireEditorOrHigher,
  validateRequest({ query: adminTeamQuerySchema }),
  teamController.getAdminTeam
);
teamRouter.get(
  '/:id',
  requireEditorOrHigher,
  validateRequest({ params: uuidParamSchema }),
  teamController.getMemberById
);
teamRouter.post(
  '/',
  requireAdminOrHigher,
  validateRequest({ body: createMemberSchema }),
  teamController.createMember
);
teamRouter.put(
  '/:id',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema, body: updateMemberSchema }),
  teamController.updateMember
);
teamRouter.patch(
  '/:id/active',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema, body: toggleMemberActiveSchema }),
  teamController.toggleActive
);
teamRouter.delete(
  '/:id',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema }),
  teamController.deleteMember
);
router.use('/team', teamRouter);

// ============================================================================
// 4. POSITIONS (Read: EDITOR | Mutations: ADMIN / SUPER_ADMIN)
// ============================================================================
const positionsRouter = Router();
positionsRouter.get(
  '/',
  requireEditorOrHigher,
  validateRequest({ query: adminPositionsQuerySchema }),
  positionsController.getAdminPositions
);
positionsRouter.get(
  '/:id',
  requireEditorOrHigher,
  validateRequest({ params: uuidParamSchema }),
  positionsController.getPositionById
);
positionsRouter.post(
  '/',
  requireAdminOrHigher,
  validateRequest({ body: createPositionSchema }),
  positionsController.createPosition
);
positionsRouter.put(
  '/:id',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema, body: updatePositionSchema }),
  positionsController.updatePosition
);
positionsRouter.patch(
  '/:id/active',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema, body: togglePositionActiveSchema }),
  positionsController.toggleActive
);
positionsRouter.delete(
  '/:id',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema }),
  positionsController.deletePosition
);
router.use('/positions', positionsRouter);

// ============================================================================
// 5. ARCHIVE (Read: EDITOR | Mutations: ADMIN / SUPER_ADMIN)
// ============================================================================
const archiveRouter = Router();
archiveRouter.get(
  '/',
  requireEditorOrHigher,
  validateRequest({ query: adminArchiveQuerySchema }),
  archiveController.getAdminArchive
);
archiveRouter.get(
  '/:id',
  requireEditorOrHigher,
  validateRequest({ params: uuidParamSchema }),
  archiveController.getArchiveById
);
archiveRouter.post(
  '/',
  requireAdminOrHigher,
  validateRequest({ body: createArchiveSchema }),
  archiveController.createArchiveRecord
);
archiveRouter.put(
  '/:id',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema, body: updateArchiveSchema }),
  archiveController.updateArchiveRecord
);
archiveRouter.patch(
  '/:id/publish',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema, body: toggleArchivePublishSchema }),
  archiveController.togglePublish
);
archiveRouter.delete(
  '/:id',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema }),
  archiveController.deleteArchiveRecord
);
router.use('/archive', archiveRouter);

// ============================================================================
// 6. ANNOUNCEMENTS (Minimum Role: EDITOR for all operations)
// ============================================================================
const announcementsRouter = Router();
announcementsRouter.use(requireEditorOrHigher);
announcementsRouter.get(
  '/',
  validateRequest({ query: adminAnnouncementsQuerySchema }),
  announcementsController.getAdminAnnouncements
);
announcementsRouter.post(
  '/',
  validateRequest({ body: createAnnouncementSchema }),
  announcementsController.createAnnouncement
);
announcementsRouter.get(
  '/:id',
  validateRequest({ params: uuidParamSchema }),
  announcementsController.getAnnouncementById
);
announcementsRouter.put(
  '/:id',
  validateRequest({ params: uuidParamSchema, body: updateAnnouncementSchema }),
  announcementsController.updateAnnouncement
);
announcementsRouter.patch(
  '/:id/publish',
  validateRequest({ params: uuidParamSchema, body: toggleAnnouncementPublishSchema }),
  announcementsController.togglePublish
);
announcementsRouter.delete(
  '/:id',
  validateRequest({ params: uuidParamSchema }),
  announcementsController.deleteAnnouncement
);
router.use('/announcements', announcementsRouter);

// ============================================================================
// 7. SITE SETTINGS (Read: EDITOR / ADMIN / SUPER_ADMIN | Mutation: SUPER_ADMIN)
// ============================================================================
const settingsRouter = Router();
settingsRouter.get('/', requireEditorOrHigher, siteSettingsController.getAllSettings);
settingsRouter.put(
  '/',
  requireSuperAdmin,
  validateRequest({ body: batchSettingsSchema }),
  siteSettingsController.batchUpdateSettings
);
router.use('/settings', settingsRouter);

// ============================================================================
// 8. ADMIN USER MANAGEMENT (Read: ADMIN / SUPER_ADMIN | Mutations: SUPER_ADMIN | EDITOR: DENY)
// ============================================================================
const usersRouter = Router();
usersRouter.get('/', requireAdminOrHigher, adminUsersController.listUsers);
usersRouter.get(
  '/:id',
  requireAdminOrHigher,
  validateRequest({ params: uuidParamSchema }),
  adminUsersController.getUserById
);
usersRouter.post(
  '/invite',
  requireSuperAdmin,
  validateRequest({ body: inviteUserSchema }),
  adminUsersController.inviteUser
);
usersRouter.put(
  '/:id',
  requireSuperAdmin,
  validateRequest({ params: uuidParamSchema, body: updateUserSchema }),
  adminUsersController.updateUser
);
usersRouter.patch(
  '/:id/active',
  requireSuperAdmin,
  validateRequest({ params: uuidParamSchema, body: toggleUserActiveSchema }),
  adminUsersController.toggleActive
);
usersRouter.delete(
  '/:id',
  requireSuperAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminUsersController.deleteUser
);
router.use('/users', usersRouter);

export default router;
