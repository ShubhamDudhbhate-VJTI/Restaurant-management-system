import { Router } from 'express';
import argon2 from 'argon2';
import { authenticate, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import { Role } from '@/contracts';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { recordAudit } from '../audit/service';

const StaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role).refine((role) => role !== Role.CUSTOMER)
});

export const staffRouter = Router();
staffRouter.use(authenticate, requireRole([Role.ADMIN]));

staffRouter.get('/', async (_req, res, next) => {
  try {
    const all = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, createdAt: users.createdAt
    }).from(users).all();
    res.json({ staff: all.filter((user) => user.role !== Role.CUSTOMER) });
  } catch (error) { next(error); }
});

staffRouter.post('/', async (req, res, next) => {
  try {
    const data = StaffSchema.parse(req.body);
    if (await db.select().from(users).where(eq(users.email, data.email)).get()) {
      throw new AppError('CONFLICT', 409, 'Email already in use');
    }
    const [user] = await db.insert(users).values({
      id: nanoid(), name: data.name, email: data.email,
      passwordHash: await argon2.hash(data.password), role: data.role
    }).returning();
    await recordAudit({ actorUserId: req.user!.userId, action: 'STAFF_CREATED', entityType: 'USER', entityId: user.id, metadata: { role: user.role } });
    res.status(201).json({ staff: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt } });
  } catch (error) { next(error); }
});

staffRouter.patch('/:id/role', async (req, res, next) => {
  try {
    const role = z.object({ role: z.nativeEnum(Role) }).parse(req.body).role;
    if (role === Role.CUSTOMER) throw new AppError('VALIDATION_ERROR', 400, 'Staff role required');
    const [user] = await db.update(users).set({ role }).where(eq(users.id, req.params.id)).returning();
    if (!user) throw new AppError('NOT_FOUND', 404, 'Staff member not found');
    await recordAudit({ actorUserId: req.user!.userId, action: 'STAFF_ROLE_CHANGED', entityType: 'USER', entityId: user.id, metadata: { role } });
    res.json({ staff: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt } });
  } catch (error) { next(error); }
});

staffRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const isActive = z.object({ isActive: z.boolean() }).parse(req.body).isActive;
    if (req.params.id === req.user!.userId && !isActive) {
      throw new AppError('VALIDATION_ERROR', 400, 'You cannot deactivate your own account');
    }
    const [user] = await db.update(users).set({ isActive }).where(eq(users.id, req.params.id)).returning();
    if (!user) throw new AppError('NOT_FOUND', 404, 'Staff member not found');
    await recordAudit({ actorUserId: req.user!.userId, action: isActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED', entityType: 'USER', entityId: user.id });
    res.json({ staff: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt } });
  } catch (error) { next(error); }
});
