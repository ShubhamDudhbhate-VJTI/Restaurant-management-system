import { apiClient } from './client';
import { CreateFeedbackInput } from '@/contracts';

export const feedbackApi = {
  create: async (data: CreateFeedbackInput) => {
    const res = await apiClient.post('/feedback', data);
    return res.data;
  }
};
