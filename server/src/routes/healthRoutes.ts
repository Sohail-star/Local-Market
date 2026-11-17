import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController.ts';

const healthRoutes = Router();

healthRoutes.get('/', getHealthStatus);

export { healthRoutes };
