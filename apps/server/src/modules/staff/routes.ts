import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@/contracts';
import { z } from 'zod';
import { staffService } from './service';

const CreateStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.nativeEnum(Role).refine((role) => role !== Role.CUSTOMER, "Staff role required")
});

const UpdateStaffRoleSchema = z.object({
  role: z.nativeEnum(Role).refine((role) => role !== Role.CUSTOMER, "Staff role required")
});

const UpdateStaffStatusSchema = z.object({
  isActive: z.boolean()
});

export const staffRouter = Router();

staffRouter.use(authenticate, requireRole([Role.ADMIN]));

// GET /api/staff
staffRouter.get('/', async (_req, res, next) => {
  try {
    const staff = await staffService.getAllStaff();
    res.json({ staff });
  } catch (error) {
    next(error);
  }
});

// POST /api/staff
staffRouter.post('/', async (req, res, next) => {
  try {
    const data = CreateStaffSchema.parse(req.body);
    const staff = await staffService.createStaff(req.user!.userId, data);
    res.status(201).json({ staff });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/staff/:id/role
staffRouter.patch('/:id/role', async (req, res, next) => {
  try {
    const data = UpdateStaffRoleSchema.parse(req.body);
    const staff = await staffService.updateStaffRole(req.user!.userId, req.params.id, data.role);
    res.json({ staff });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/staff/:id/status
staffRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const data = UpdateStaffStatusSchema.parse(req.body);
    const staff = await staffService.updateStaffStatus(req.user!.userId, req.params.id, data.isActive);
    res.json({ staff });
  } catch (error) {
    next(error);
  }
});
