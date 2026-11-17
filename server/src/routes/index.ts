import { Router } from 'express';
import { healthRoutes } from './healthRoutes.ts';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);

export { apiRouter };
