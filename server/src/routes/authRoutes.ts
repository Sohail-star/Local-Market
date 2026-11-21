import { Router } from 'express';
import {
  getUserMeHandler,
  loginDemoUserHandler,
  loginUserHandler,
  logoutUserHandler,
  refreshUserHandler,
  registerUserHandler,
} from '../controllers/userAuthController.ts';
import { requireUserAuth } from '../middleware/userAuthMiddleware.ts';

const authRoutes = Router();

authRoutes.post('/register', registerUserHandler);
authRoutes.post('/login', loginUserHandler);
authRoutes.post('/demo', loginDemoUserHandler);
authRoutes.post('/refresh', refreshUserHandler);
authRoutes.post('/logout', logoutUserHandler);
authRoutes.get('/me', requireUserAuth, getUserMeHandler);

export { authRoutes };
