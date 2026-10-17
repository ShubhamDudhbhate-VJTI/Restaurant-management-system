import { db } from '../../db/client';
import { orders, orderItems, menuItems, sessions, tables } from '../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { OrderStatus, SessionStatus, type CreateOrderInput, type OrderWithItems } from '@/contracts';

export const orderRepository = {
  async getOrderById(orderId: string): Promise<OrderWithItems | null> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return null;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return {
      ...order,
      createdAt: order.createdAt.getTime(),
      updatedAt: order.updatedAt.getTime(),
      items
    } as OrderWithItems;
  },

  async getOrdersBySession(sessionId: string): Promise<OrderWithItems[]> {
    const sessionOrders = await db.select().from(orders).where(eq(orders.sessionId, sessionId));
    
    if (sessionOrders.length === 0) return [];

    const orderIds = sessionOrders.map(o => o.id);
    const allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
    
    return sessionOrders.map(o => ({
      ...o,
      createdAt: o.createdAt.getTime(),
      updatedAt: o.updatedAt.getTime(),
      items: allItems.filter(i => i.orderId === o.id)
    })) as OrderWithItems[];
  },

  async getOrdersByCustomerId(customerId: string): Promise<OrderWithItems[]> {
    const customerOrders = await db.select({
      order: orders,
      table: tables,
      session: sessions
    })
    .from(orders)
    .innerJoin(sessions, eq(orders.sessionId, sessions.id))
    .innerJoin(tables, eq(sessions.tableId, tables.id))
    .where(eq(orders.customerId, customerId))
    .orderBy(orders.createdAt);

    if (customerOrders.length === 0) return [];

    const orderIds = customerOrders.map(row => row.order.id);
    const allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));

    return customerOrders.map(row => ({
      ...row.order,
      createdAt: row.order.createdAt.getTime(),
      updatedAt: row.order.updatedAt.getTime(),
      tableName: row.table.name,
      items: allItems.filter(i => i.orderId === row.order.id)
    })) as OrderWithItems[];
  },

  async createOrderTransaction(sessionId: string, customerId: string, input: CreateOrderInput) {
    return db.transaction(async (tx) => {
      // Create the order
      const [newOrder] = await tx.insert(orders).values({
        sessionId,
        customerId,
        notes: input.notes
      }).returning();

      // Fetch required menu items
      const menuItemIds = input.items.map(i => i.menuItemId);
      const itemsInDb = await tx.select().from(menuItems).where(inArray(menuItems.id, menuItemIds));
      
      const itemsToInsert = input.items.map(reqItem => {
        const menuItem = itemsInDb.find(m => m.id === reqItem.menuItemId);
        if (!menuItem) throw new Error(`ITEM_NOT_FOUND:${reqItem.menuItemId}`);
        if (!menuItem.isAvailable) throw new Error(`ITEM_UNAVAILABLE:${menuItem.name}`);

        return {
          orderId: newOrder.id,
          menuItemId: menuItem.id,
          name: menuItem.name,
          priceCents: menuItem.priceCents,
          quantity: reqItem.quantity
        };
      });

      const insertedItems = await tx.insert(orderItems).values(itemsToInsert).returning();

      return {
        ...newOrder,
        createdAt: newOrder.createdAt.getTime(),
        updatedAt: newOrder.updatedAt.getTime(),
        items: insertedItems
      } as OrderWithItems;
    });
  },

  async cancelOrder(orderId: string) {
    const [order] = await db.update(orders)
      .set({ status: OrderStatus.CANCELLED, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  },

  async getActiveOrders(): Promise<OrderWithItems[]> {
    const activeOrders = await db.select({
      order: orders,
      table: tables,
      session: sessions
    })
    .from(orders)
    .innerJoin(sessions, eq(orders.sessionId, sessions.id))
    .innerJoin(tables, eq(sessions.tableId, tables.id))
    .where(
      and(
        inArray(orders.status, [OrderStatus.PLACED, OrderStatus.PREPARING, OrderStatus.READY]),
        eq(sessions.status, SessionStatus.ACTIVE)
      )
    );
    
    if (activeOrders.length === 0) return [];
    
    const activeOrderIds = activeOrders.map(row => row.order.id);
    const items = await db.select().from(orderItems)
      .where(inArray(orderItems.orderId, activeOrderIds));

    return activeOrders.map(row => {
      return {
        ...row.order,
        createdAt: row.order.createdAt.getTime(),
        updatedAt: row.order.updatedAt.getTime(),
        tableName: row.table.name,
        items: items.filter(i => i.orderId === row.order.id)
      };
    }) as OrderWithItems[];
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const [order] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }
};
