import { Router } from 'express';
import {
  createAdminAccountSchema,
  createOrAssignAdminAccountHandler,
  listAbuseReportsHandler,
  listAdminAccountsHandler,
  listAdminAuditLogsHandler,
  listMarketplaceUsersHandler,
  updateAbuseReportHandler,
  updateAbuseReportSchema,
  updateAccountStatusHandler,
  updateAccountStatusSchema,
  updateAdminRoleAssignmentHandler,
  updateAdminRoleSchema,
  updateUserVerificationHandler,
  updateUserVerificationSchema,
} from '../controllers/adminManagementController.ts';
import {
  requireAdminAuth,
  requireAdminRoles,
} from '../middleware/adminAuthMiddleware.ts';
import { validateRequest } from '../middleware/validateRequest.ts';
import { adminAuthRoutes } from './adminAuthRoutes.ts';

const adminRoutes = Router();

// Separate admin authentication lifecycle
adminRoutes.use('/auth', adminAuthRoutes);

// All non-auth /api/admin/* endpoints require a verified server-side admin session
adminRoutes.use(requireAdminAuth);

// Admin accounts & RBAC role management
adminRoutes.get(
  '/accounts',
  requireAdminRoles('SUPER_ADMIN', 'ADMIN'),
  listAdminAccountsHandler
);

adminRoutes.post(
  '/accounts',
  requireAdminRoles('SUPER_ADMIN'),
  validateRequest({ body: createAdminAccountSchema }),
  createOrAssignAdminAccountHandler
);

adminRoutes.patch(
  '/accounts/:userId/roles',
  requireAdminRoles('SUPER_ADMIN'),
  validateRequest({ body: updateAdminRoleSchema }),
  updateAdminRoleAssignmentHandler
);

adminRoutes.patch(
  '/accounts/:userId/status',
  requireAdminRoles('SUPER_ADMIN'),
  validateRequest({ body: updateAccountStatusSchema }),
  updateAccountStatusHandler
);

// Marketplace user management (keeps ordinary capabilities separate from admin auth)
adminRoutes.get(
  '/users',
  requireAdminRoles('SUPER_ADMIN', 'ADMIN', 'SUPPORT'),
  listMarketplaceUsersHandler
);

adminRoutes.patch(
  '/users/:userId/verification',
  requireAdminRoles('SUPER_ADMIN', 'ADMIN', 'SUPPORT'),
  validateRequest({ body: updateUserVerificationSchema }),
  updateUserVerificationHandler
);

// Moderation & abuse reports
adminRoutes.get(
  '/reports',
  requireAdminRoles('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'),
  listAbuseReportsHandler
);

adminRoutes.patch(
  '/reports/:reportId',
  requireAdminRoles('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'),
  validateRequest({ body: updateAbuseReportSchema }),
  updateAbuseReportHandler
);

// Immutable AdminAuditLog inspection
adminRoutes.get(
  '/audit-logs',
  requireAdminRoles('SUPER_ADMIN', 'ADMIN'),
  listAdminAuditLogsHandler
);

export { adminRoutes };
