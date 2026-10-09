import { apiClient } from './client';
import { SignupInput, LoginInput, User } from '@/contracts';

export const authApi = {
  signup: async (data: SignupInput) => {
    const res = await apiClient.post('/auth/signup', data);
    return res.data;
  },
  
  login: async (data: LoginInput) => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
  
  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
  
  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  }
};
