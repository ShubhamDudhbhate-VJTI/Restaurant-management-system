import { db } from '../../db/client';
import { orders, orderItems, menuItems, sessions, tables } from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { OrderStatus, type CreateOrderInput, type OrderWithItems } from '@/contracts';

export const orderRepository = {
  async getOrderById(orderId: string): Promise<OrderWithItems | null> {
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
    if (!order) return null;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();
    return { ...order, items };
  },

  async getOrdersBySession(sessionId: string): Promise<OrderWithItems[]> {
    const sessionOrders = await db.select().from(orders).where(eq(orders.sessionId, sessionId)).all();
    
    if (sessionOrders.length === 0) return [];

    const allItems = await db.select().from(orderItems).all(); // Can be optimized, but ok for now
    
    return sessionOrders.map(o => ({
      ...o,
      items: allItems.filter(i => i.orderId === o.id)
    }));
  },

  async createOrderTransaction(sessionId: string, customerId: string, input: CreateOrderInput) {
    return db.transaction((tx) => {
      // Create the order
      const newOrder = tx.insert(orders).values({
        sessionId,
        customerId
      }).returning().get();

      // Fetch all required menu items synchronously inside the transaction
      const allMenuItems = tx.select().from(menuItems).all();
      
      const itemsToInsert = [];
      for (const reqItem of input.items) {
        const menuItem = allMenuItems.find(m => m.id === reqItem.menuItemId);
        if (!menuItem) throw new Error(`ITEM_NOT_FOUND:${reqItem.menuItemId}`);
        if (!menuItem.isAvailable) throw new Error(`ITEM_UNAVAILABLE:${menuItem.name}`);

        itemsToInsert.push({
          orderId: newOrder.id,
          menuItemId: menuItem.id,
          name: menuItem.name,
          priceCents: menuItem.priceCents,
          quantity: reqItem.quantity
        });
      }

      const insertedItems = [];
      for (const item of itemsToInsert) {
        const i = tx.insert(orderItems).values(item).returning().get();
        insertedItems.push(i);
      }

      return { ...newOrder, items: insertedItems } as OrderWithItems;
    });
  },

  async cancelOrder(orderId: string) {
    return db.update(orders)
      .set({ status: OrderStatus.CANCELLED, updatedAt: Date.now() })
      .where(eq(orders.id, orderId))
      .returning()
      .get();
  },

  async getActiveOrders(): Promise<OrderWithItems[]> {
    const activeOrders = await db.select().from(orders)
      .where(inArray(orders.status, [OrderStatus.PLACED, OrderStatus.PREPARING, OrderStatus.READY]))
      .all();
    
    if (activeOrders.length === 0) return [];
    
    const activeOrderIds = activeOrders.map(o => o.id);
    const items = await db.select().from(orderItems)
      .where(inArray(orderItems.orderId, activeOrderIds))
      .all();

    const sessionIds = [...new Set(activeOrders.map(o => o.sessionId))];
    const activeSessions = await db.select().from(sessions)
      .where(inArray(sessions.id, sessionIds))
      .all();
      
    const tableIds = [...new Set(activeSessions.map(s => s.tableId))];
    const activeTables = await db.select().from(tables)
      .where(inArray(tables.id, tableIds))
      .all();
      
    return activeOrders.map(o => {
      const session = activeSessions.find(s => s.id === o.sessionId);
      const table = activeTables.find(t => t.id === session?.tableId);
      return {
        ...o,
        tableName: table?.name,
        items: items.filter(i => i.orderId === o.id)
      };
    });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return db.update(orders)
      .set({ status, updatedAt: Date.now() })
      .where(eq(orders.id, orderId))
      .returning()
      .get();
  }
};
