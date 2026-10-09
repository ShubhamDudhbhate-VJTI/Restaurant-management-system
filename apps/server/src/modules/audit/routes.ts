import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@/contracts';
import { db } from '../../db/client';
import { auditLogs, users } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';

export const auditRouter = Router();
auditRouter.use(authenticate, requireRole([Role.ADMIN]));

auditRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const rows = await db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actor: { id: users.id, name: users.name, email: users.email },
    }).from(auditLogs)
      .innerJoin(users, eq(users.id, auditLogs.actorUserId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    res.json({ auditLogs: rows });
  } catch (error) {
    next(error);
  }
});
