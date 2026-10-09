import { db } from '../../db/client';
import { orders, orderItems } from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { config } from '../../config';
import { OrderStatus, type Bill } from '@/contracts';

export async function computeBill(sessionId: string, discountPercent = 0): Promise<Bill> {
  const sessionOrders = await db.select()
    .from(orders)
    .where(eq(orders.sessionId, sessionId))
    .all();

  const validOrders = sessionOrders.filter(o => o.status !== OrderStatus.CANCELLED);
  
  let subtotalCents = 0;

  if (validOrders.length > 0) {
    const validOrderIds = validOrders.map(o => o.id);
    const items = await db.select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, validOrderIds))
      .all();
      
    for (const item of items) {
      subtotalCents += item.priceCents * item.quantity;
    }
  }

  const discountCents = Math.round(subtotalCents * (discountPercent / 100));
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const cgstCents = Math.round(taxableCents * (config.TAX_CGST_PERCENT / 100));
  const sgstCents = Math.round(taxableCents * (config.TAX_SGST_PERCENT / 100));
  const totalCents = taxableCents + cgstCents + sgstCents;

  return {
    subtotalCents,
    cgstCents,
    sgstCents,
    discountCents,
    totalCents
  };
}
