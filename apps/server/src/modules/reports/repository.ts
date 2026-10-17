import { db } from '../../db/client';
import { feedback, orderItems, orders, sessions, tables } from '../../db/schema';
import { eq, gte } from 'drizzle-orm';
import { SessionStatus } from '@/contracts';

export const reportsRepository = {
  async getTodayStats(startOfDay: Date) {
    const todaySessions = await db.select().from(sessions).where(gte(sessions.startedAt, startOfDay));
    const todayOrders = await db.select().from(orders).where(gte(orders.createdAt, startOfDay));
    const tableRows = await db.select().from(tables);
    const ratings = await db.select().from(feedback);

    return {
      sessions: todaySessions,
      orders: todayOrders,
      tables: tableRows,
      feedback: ratings
    };
  },

  async getSalesData() {
    const completedSessions = await db.select().from(sessions).where(eq(sessions.status, SessionStatus.CLOSED));
    const itemRows = await db.select().from(orderItems);
    return {
      sessions: completedSessions,
      orderItems: itemRows
    };
  }
};
