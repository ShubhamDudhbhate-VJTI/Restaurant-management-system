import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { SignupInput, Role } from '@/contracts';

export const userRepository = {
  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  },

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  },

  async create(data: SignupInput & { passwordHash: string; role: Role }) {
    const [user] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    }).returning();
    
    return user;
  }
};
