import { db } from '../../db/client';
import { sessions, tables } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { SessionStatus, TableStatus, SessionCloseReason, PaymentMethod } from '@/contracts';

export const sessionRepository = {
  async findActiveByCustomerId(customerId: string) {
    const [session] = await db.select()
      .from(sessions)
      .where(and(eq(sessions.customerId, customerId), eq(sessions.status, SessionStatus.ACTIVE)))
      .limit(1);
    return session || null;
  },

  async createSessionTransaction(tableId: string, customerId: string) {
    return db.transaction((tx) => {
      // Create session
      const session = tx.insert(sessions).values({
        tableId,
        customerId,
        status: SessionStatus.ACTIVE
      }).returning().get();

      // A table is occupied only while a session is active.
      tx.update(tables)
        .set({ status: TableStatus.OCCUPIED })
        .where(eq(tables.id, tableId))
        .run();

      return session;
    });
  },

  async findTableByQrToken(qrToken: string) {
    const [table] = await db.select().from(tables).where(eq(tables.qrToken, qrToken)).limit(1);
    return table || null;
  },

  async getById(sessionId: string) {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    return session || null;
  },

  async getActiveSessions() {
    return db.select().from(sessions).where(eq(sessions.status, SessionStatus.ACTIVE)).all();
  },

  async closeSessionTransaction(
    sessionId: string,
    data: {
      closeReason: SessionCloseReason;
      paymentMethod?: PaymentMethod | null;
      subtotalCents: number;
      cgstCents: number;
      sgstCents: number;
      totalCents: number;
      discountCents: number;
      discountPercent: number;
    }
  ) {
    return db.transaction((tx) => {
      const updatedSession = tx.update(sessions)
        .set({
          status: SessionStatus.CLOSED,
          endedAt: Date.now(),
          closeReason: data.closeReason,
          paymentMethod: data.paymentMethod || null,
          subtotalCents: data.subtotalCents,
          cgstCents: data.cgstCents,
          sgstCents: data.sgstCents,
          totalCents: data.totalCents
          ,discountCents: data.discountCents
          ,discountPercent: data.discountPercent
        })
        .where(eq(sessions.id, sessionId))
        .returning().get();
      tx.update(tables)
        .set({ status: TableStatus.AVAILABLE })
        .where(eq(tables.id, updatedSession.tableId))
        .run();
      return updatedSession;
    });
  }
};
