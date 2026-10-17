import { db } from '../../db/client';
import { tables } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { CreateTableInput, UpdateTableInput, TableStatus } from '@/contracts';

export const tableRepository = {
  async findAll() {
    return await db.select().from(tables);
  },

  async findById(id: string) {
    const [table] = await db.select().from(tables).where(eq(tables.id, id)).limit(1);
    return table || null;
  },

  async findByQrToken(qrToken: string) {
    const [table] = await db.select().from(tables).where(eq(tables.qrToken, qrToken)).limit(1);
    return table || null;
  },

  async create(data: CreateTableInput) {
    const [table] = await db.insert(tables).values({
      name: data.name,
      seats: data.seats
    }).returning();
    return table;
  },

  async update(id: string, data: UpdateTableInput) {
    const [table] = await db.update(tables)
      .set(data)
      .where(eq(tables.id, id))
      .returning();
    return table;
  },

  async updateStatus(id: string, status: TableStatus) {
    const [table] = await db.update(tables)
      .set({ status })
      .where(eq(tables.id, id))
      .returning();
    return table;
  },

  async delete(id: string) {
    await db.delete(tables).where(eq(tables.id, id));
  }
};
