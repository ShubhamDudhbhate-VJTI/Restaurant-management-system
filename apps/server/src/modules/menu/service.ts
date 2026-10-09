import { menuRepository } from './repository';
import type { CategoryWithItems } from '@/contracts';

export const menuService = {
  async getMenu(): Promise<CategoryWithItems[]> {
    const allCategories = await menuRepository.getAllCategories();
    const allItems = await menuRepository.getAllMenuItems();

    return allCategories.map(cat => ({
      ...cat,
      items: allItems.filter(item => item.categoryId === cat.id)
    }));
  }
};
