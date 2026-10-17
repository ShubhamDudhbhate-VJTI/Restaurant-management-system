import { db } from '../../db/client';
import { orders, orderItems, sessions } from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { OrderStatus } from '@/contracts';

export class BillingRepository {
  constructor(private database: typeof db) {}

  async getOrdersBySession(sessionId: string) {
    return this.database.select().from(orders).where(eq(orders.sessionId, sessionId));
  }

  async getOrderItemsByOrderIds(orderIds: string[]) {
    if (orderIds.length === 0) return [];
    return this.database.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
  }

  async getBillById(billId: string) {
      // For now, let's treat session totalCents as the bill.
      // In a more complex system, we'd have a separate 'bills' table.
      // For RMS, we aggregate orders of an active session.
      const [session] = await this.database.select().from(sessions).where(eq(sessions.id, billId)).limit(1);
      if (!session) return null;

      // Mocking bill data since it's just a session ID for now.
      return {
          id: session.id,
          finalAmount: session.totalCents || 0,
          status: session.status === 'closed' ? 'PAID' : 'PENDING',
          sessionId: session.id
      };
  }

  async updateBillStatus(billId: string, status: 'PAID' | 'PENDING') {
      // In this simple model, updating bill status means we close the session.
      // Real implementation would update a 'bills' table.
  }
}
