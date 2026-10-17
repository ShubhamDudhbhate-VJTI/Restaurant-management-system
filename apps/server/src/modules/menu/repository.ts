import { db } from '../../db/client';
import { categories, menuItems } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';
import type { CreateCategoryInput, UpdateCategoryInput, CreateMenuItemInput, UpdateMenuItemInput } from '@/contracts';

export const menuRepository = {
  // Categories
  async getAllCategories() {
    return db.select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));
  },

  async createCategory(data: CreateCategoryInput) {
    const [row] = await db.insert(categories)
      .values(data)
      .returning();
    return row;
  },

  async updateCategory(id: string, data: UpdateCategoryInput) {
    const [row] = await db.update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return row;
  },

  async deleteCategory(id: string) {
    const [row] = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return row;
  },

  // Menu Items
  async getAllMenuItems() {
    return db.select()
      .from(menuItems)
      .orderBy(asc(menuItems.categoryId), asc(menuItems.sortOrder));
  },

  async getMenuItemsByCategory(categoryId: string) {
    return db.select()
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(asc(menuItems.sortOrder));
  },

  async createMenuItem(data: CreateMenuItemInput) {
    const [row] = await db.insert(menuItems)
      .values(data)
      .returning();
    return row;
  },

  async updateMenuItem(id: string, data: UpdateMenuItemInput) {
    const [row] = await db.update(menuItems)
      .set(data)
      .where(eq(menuItems.id, id))
      .returning();
    return row;
  },

  async deleteMenuItem(id: string) {
    const [row] = await db.delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning();
    return row;
  }
};
