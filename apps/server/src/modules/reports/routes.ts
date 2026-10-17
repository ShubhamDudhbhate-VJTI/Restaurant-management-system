import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@/contracts';
import { reportsService } from './service';

export const reportsRouter = Router();
reportsRouter.use(authenticate, requireRole([Role.ADMIN]));

reportsRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const stats = await reportsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

reportsRouter.get('/sales', async (_req, res, next) => {
  try {
    const report = await reportsService.getSalesReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
});
