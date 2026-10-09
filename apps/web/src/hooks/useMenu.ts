import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { CategoryWithItems, CreateCategoryInput, UpdateCategoryInput, CreateMenuItemInput, UpdateMenuItemInput } from '@/contracts';
import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { SocketEvents } from '@/contracts';

export function useMenu() {
  const queryClient = useQueryClient();

  const query = useQuery<CategoryWithItems[]>({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await apiClient.get<{ menu: CategoryWithItems[] }>('/menu');
      return res.data.menu;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    };

    socket.on(SocketEvents.MENU_UPDATED, handleUpdate);
    return () => {
      socket.off(SocketEvents.MENU_UPDATED, handleUpdate);
    };
  }, [queryClient]);

  // Categories
  const createCategory = useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      await apiClient.post('/menu/categories', data);
    }
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      await apiClient.put(`/menu/categories/${id}`, data);
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/menu/categories/${id}`);
    }
  });

  // Menu Items
  const createItem = useMutation({
    mutationFn: async (data: CreateMenuItemInput) => {
      await apiClient.post('/menu/items', data);
    }
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMenuItemInput }) => {
      await apiClient.put(`/menu/items/${id}`, data);
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/menu/items/${id}`);
    }
  });

  return {
    ...query,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem
  };
}
