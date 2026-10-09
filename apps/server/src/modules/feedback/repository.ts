import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { feedback } from '../../db/schema';
import type { CreateFeedbackInput } from '@/contracts';

export const feedbackRepository = {
  async list() {
    return db.select().from(feedback).orderBy(desc(feedback.createdAt)).all();
  },

  async findBySession(sessionId: string) {
    const [entry] = await db.select().from(feedback).where(eq(feedback.sessionId, sessionId)).limit(1);
    return entry || null;
  },

  async create(customerId: string, data: CreateFeedbackInput) {
    const [entry] = await db.insert(feedback).values({
      sessionId: data.sessionId,
      customerId,
      rating: data.rating,
      comment: data.comment || null,
    }).returning();
    return entry;
  },
};
