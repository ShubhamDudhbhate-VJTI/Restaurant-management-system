import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq, ne } from 'drizzle-orm';
import { Role } from '@/contracts';

export const staffRepository = {
  async getAllStaff() {
    return db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .where(ne(users.role, Role.CUSTOMER));
  },

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  },

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  },

  async createStaff(data: { name: string; email: string; passwordHash: string; role: Role }) {
    const [user] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      isActive: true
    }).returning();
    return user;
  },

  async updateStaffStatus(userId: string, isActive: boolean) {
    const [user] = await db.update(users)
      .set({ isActive })
      .where(eq(users.id, userId))
      .returning();
    return user;
  },

  async updateStaffRole(userId: string, role: Role) {
    const [user] = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
};
