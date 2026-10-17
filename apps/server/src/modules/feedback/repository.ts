import { db } from '../../db/client';
import { feedback, sessions, users } from '../../db/schema';
import { eq, avg, count, desc } from 'drizzle-orm';
import { CreateFeedbackInput } from '@/contracts';

export const feedbackRepository = {
  async create(customerId: string, data: CreateFeedbackInput) {
    const [item] = await db.insert(feedback).values({
      sessionId: data.sessionId,
      customerId,
      rating: data.rating,
      comment: data.comment
    }).returning();
    return { ...item, createdAt: item.createdAt.getTime() };
  },

  async getBySession(sessionId: string) {
    const [item] = await db.select().from(feedback).where(eq(feedback.sessionId, sessionId)).limit(1);
    if (!item) return null;
    return { ...item, createdAt: item.createdAt.getTime() };
  },

  async getAllDetailed() {
    const list = await db.select({
      id: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
      customerName: users.name,
      sessionId: feedback.sessionId
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.customerId, users.id))
    .orderBy(desc(feedback.createdAt));
    return list.map(i => ({ ...i, createdAt: i.createdAt.getTime() }));
  },

  async getStats() {
    const [stats] = await db.select({
      averageRating: avg(feedback.rating),
      totalFeedback: count(feedback.id)
    }).from(feedback);

    return {
      averageRating: Number(stats?.averageRating || 0).toFixed(1),
      totalFeedback: Number(stats?.totalFeedback || 0)
    };
  }
};
