import axios from 'axios';

const getBaseURL = () => {
  const envURL = import.meta.env.VITE_PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  if (envURL.endsWith('/api')) return envURL;
  if (envURL.endsWith('/')) return `${envURL}api`;
  return `${envURL}/api`;
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error?.message) {
      return Promise.reject(new Error(error.response.data.error.message));
    }
    return Promise.reject(error);
  }
);
