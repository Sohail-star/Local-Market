import { Router } from 'express';
import { adminRoutes } from './adminRoutes.ts';
import { healthRoutes } from './healthRoutes.ts';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/admin', adminRoutes);

export { apiRouter };
