import { db } from '../../db/client';
import { categories, menuItems } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';
import type { CreateCategoryInput, UpdateCategoryInput, CreateMenuItemInput, UpdateMenuItemInput } from '@/contracts';

export const menuRepository = {
  // Categories
  async getAllCategories() {
    return db.select()
      .from(categories)
      .orderBy(asc(categories.sortOrder))
      .all();
  },

  async createCategory(data: CreateCategoryInput) {
    return db.insert(categories)
      .values(data)
      .returning()
      .get();
  },

  async updateCategory(id: string, data: UpdateCategoryInput) {
    return db.update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning()
      .get();
  },

  async deleteCategory(id: string) {
    return db.delete(categories)
      .where(eq(categories.id, id))
      .returning()
      .get();
  },

  // Menu Items
  async getAllMenuItems() {
    return db.select()
      .from(menuItems)
      .orderBy(asc(menuItems.categoryId), asc(menuItems.sortOrder))
      .all();
  },

  async getMenuItemsByCategory(categoryId: string) {
    return db.select()
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(asc(menuItems.sortOrder))
      .all();
  },

  async createMenuItem(data: CreateMenuItemInput) {
    return db.insert(menuItems)
      .values(data)
      .returning()
      .get();
  },

  async updateMenuItem(id: string, data: UpdateMenuItemInput) {
    return db.update(menuItems)
      .set(data)
      .where(eq(menuItems.id, id))
      .returning()
      .get();
  },

  async deleteMenuItem(id: string) {
    return db.delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning()
      .get();
  }
};
