import { Router } from 'express';
import { adminRoutes } from './adminRoutes.ts';
import { authRoutes } from './authRoutes.ts';
import { chatRoutes } from './chatRoutes.ts';
import { healthRoutes } from './healthRoutes.ts';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/admin', adminRoutes);

export { apiRouter };
