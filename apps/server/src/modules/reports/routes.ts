import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role, SessionStatus } from '@/contracts';
import { db } from '../../db/client';
import { feedback, orderItems, orders, sessions, tables } from '../../db/schema';
import { eq, gte } from 'drizzle-orm';

export const reportsRouter = Router();
reportsRouter.use(authenticate, requireRole([Role.ADMIN]));

reportsRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const todaySessions = await db.select().from(sessions).where(gte(sessions.startedAt, start.getTime())).all();
    const todayOrders = await db.select().from(orders).where(gte(orders.createdAt, start.getTime())).all();
    const tableRows = await db.select().from(tables).all();
    const ratings = await db.select().from(feedback).all();
    const averageRating = ratings.length ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length : 0;
    res.json({
      orders: todayOrders.length,
      revenueCents: todaySessions.reduce((sum, item) => sum + (item.totalCents || 0), 0),
      occupiedTables: tableRows.filter((table) => table.status === 'occupied' || table.status === 'billing').length,
      totalTables: tableRows.length,
      averageRating: Number(averageRating.toFixed(1))
    });
  } catch (error) { next(error); }
});

reportsRouter.get('/sales', async (_req, res, next) => {
  try {
    const completed = await db.select().from(sessions).where(eq(sessions.status, SessionStatus.CLOSED)).all();
    const itemRows = await db.select().from(orderItems).all();
    const counts = new Map<string, number>();
    for (const item of itemRows) counts.set(item.name, (counts.get(item.name) || 0) + item.quantity);
    res.json({
      daily: completed.filter((item) => item.endedAt && item.endedAt >= Date.now() - 86400000).length,
      weekly: completed.filter((item) => item.endedAt && item.endedAt >= Date.now() - 7 * 86400000).length,
      monthly: completed.filter((item) => item.endedAt && item.endedAt >= Date.now() - 30 * 86400000).length,
      popularItems: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, quantity]) => ({ name, quantity }))
    });
  } catch (error) { next(error); }
});
