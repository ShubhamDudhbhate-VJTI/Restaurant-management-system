import { db } from '../../db/client';
import { sessions, tables, payments } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { SessionStatus, TableStatus, SessionCloseReason, PaymentMethod } from '@/contracts';

export const sessionRepository = {
  async findActiveByCustomerId(customerId: string) {
    const [session] = await db.select()
      .from(sessions)
      .where(and(eq(sessions.customerId, customerId), eq(sessions.status, SessionStatus.ACTIVE)))
      .limit(1);
    if (!session) return null;
    return {
      ...session,
      startedAt: session.startedAt.getTime(),
      endedAt: session.endedAt?.getTime() || null,
    };
  },

  async createSessionTransaction(tableId: string, customerId: string, reservationId?: string) {
    return db.transaction(async (tx) => {
      // Create session
      const [session] = await tx.insert(sessions).values({
        tableId,
        customerId,
        reservationId,
        status: SessionStatus.ACTIVE
      }).returning();

      // A table is occupied only while a session is active.
      await tx.update(tables)
        .set({ status: TableStatus.OCCUPIED })
        .where(eq(tables.id, tableId));

      return {
        ...session,
        startedAt: session.startedAt.getTime(),
        endedAt: session.endedAt?.getTime() || null,
      };
    });
  },

  async findTableByQrToken(qrToken: string) {
    const [table] = await db.select().from(tables).where(eq(tables.qrToken, qrToken)).limit(1);
    return table || null;
  },

  async getById(sessionId: string) {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) return null;
    return {
      ...session,
      startedAt: session.startedAt.getTime(),
      endedAt: session.endedAt?.getTime() || null,
    };
  },

  async getActiveSessions() {
    const active = await db.select().from(sessions).where(eq(sessions.status, SessionStatus.ACTIVE));
    return active.map(s => ({
      ...s,
      startedAt: s.startedAt.getTime(),
      endedAt: s.endedAt?.getTime() || null,
    }));
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
      transactionId?: string;
    }
  ) {
    return db.transaction(async (tx) => {
      const [updatedSession] = await tx.update(sessions)
        .set({
          status: SessionStatus.CLOSED,
          endedAt: new Date(),
          closeReason: data.closeReason,
          paymentMethod: data.paymentMethod || null,
          subtotalCents: data.subtotalCents,
          cgstCents: data.cgstCents,
          sgstCents: data.sgstCents,
          totalCents: data.totalCents,
          discountCents: data.discountCents,
          discountPercent: data.discountPercent
        })
        .where(eq(sessions.id, sessionId))
        .returning();

      // Record payment if applicable
      if (data.paymentMethod && data.totalCents > 0) {
        await tx.insert(payments).values({
          sessionId: sessionId,
          amountCents: data.totalCents,
          method: data.paymentMethod,
          transactionId: data.transactionId
        });
      }

      await tx.update(tables)
        .set({ status: TableStatus.AVAILABLE })
        .where(eq(tables.id, updatedSession.tableId));

      return {
        ...updatedSession,
        startedAt: updatedSession.startedAt.getTime(),
        endedAt: updatedSession.endedAt?.getTime() || null,
      };
    });
  }
};
