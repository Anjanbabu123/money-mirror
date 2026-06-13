import axios from 'axios';
import type { AuthResponse, User, Transaction, MonthlySummary } from '../types';

// In production (Vercel), VITE_API_URL points to the Render backend.
// Locally, falls back to /api which Vite's dev proxy forwards to localhost:8000.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  signup: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/signup', { email, password, name }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
};

export const userApi = {
  getProfile: () => api.get<User>('/users/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),
};

export const transactionApi = {
  seedDemo: () => api.post('/transactions/seed-demo'),
  list: (params?: { skip?: number; limit?: number; category?: string; month?: number; year?: number }) =>
    api.get<Transaction[]>('/transactions', { params }),
  getSummary: (year: number, month?: number) =>
    api.get<MonthlySummary>('/transactions/summary', { params: { year, month } }),
  update: (id: number, data: { category?: string; merchant?: string }) =>
    api.patch<Transaction>(`/transactions/${id}`, data),
};

export const uploadApi = {
  uploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export default api;
