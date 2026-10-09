import { apiClient } from './client';
import { CreateTableInput, UpdateTableInput, Table } from '@/contracts';

export const tablesApi = {
  getAll: async (): Promise<{ tables: Table[] }> => {
    const res = await apiClient.get('/tables');
    return res.data;
  },
  create: async (data: CreateTableInput): Promise<{ table: Table }> => {
    const res = await apiClient.post('/tables', data);
    return res.data;
  },
  update: async (id: string, data: UpdateTableInput): Promise<{ table: Table }> => {
    const res = await apiClient.patch(`/tables/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete(`/tables/${id}`);
    return res.data;
  }
};
