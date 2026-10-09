import { apiClient } from './client';
import { Table, Session } from '@/contracts';

export const scanApi = {
  getScanResult: async (qrToken: string): Promise<{ table: Table, relation: string }> => {
    const res = await apiClient.get(`/t/${qrToken}`);
    return res.data;
  },
  takeTable: async (qrToken: string): Promise<{ session: Session, table: Table }> => {
    const res = await apiClient.post(`/t/${qrToken}/seat`);
    return res.data;
  }
};

export const sessionsApi = {
  getMe: async (): Promise<{ session: Session | null }> => {
    const res = await apiClient.get('/sessions/me');
    return res.data;
  },
  cancel: async (sessionId: string): Promise<{ session: Session }> => {
    const res = await apiClient.post(`/sessions/${sessionId}/cancel`);
    return res.data;
  }
};
