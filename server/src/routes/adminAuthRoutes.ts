import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  adminLoginHandler,
  adminLoginSchema,
  adminLogoutHandler,
  adminRefreshHandler,
  getAdminMeHandler,
  getSetupStatusHandler,
  setupInitialSuperAdminHandler,
  setupSuperAdminSchema,
} from '../controllers/adminAuthController.ts';
import { requireAdminAuth } from '../middleware/adminAuthMiddleware.ts';
import { validateRequest } from '../middleware/validateRequest.ts';
import { sendError } from '../utils/apiResponse.ts';

const adminAuthRoutes = Router();

const strictAdminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(_req, res) {
    sendError(
      res,
      429,
      'Too many administrator authentication attempts. Please wait 15 minutes before trying again.'
    );
  },
});

adminAuthRoutes.get('/setup-status', getSetupStatusHandler);

adminAuthRoutes.post(
  '/setup',
  strictAdminAuthLimiter,
  validateRequest({ body: setupSuperAdminSchema }),
  setupInitialSuperAdminHandler
);

adminAuthRoutes.post(
  '/login',
  strictAdminAuthLimiter,
  validateRequest({ body: adminLoginSchema }),
  adminLoginHandler
);

adminAuthRoutes.post('/refresh', adminRefreshHandler);

adminAuthRoutes.post('/logout', requireAdminAuth, adminLogoutHandler);

adminAuthRoutes.get('/me', requireAdminAuth, getAdminMeHandler);

export { adminAuthRoutes };
