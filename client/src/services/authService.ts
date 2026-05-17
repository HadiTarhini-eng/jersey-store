import api from './api';
import type { ApiResponse, AuthTokens, LoginCredentials, RegisterCredentials, User } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
      '/auth/login',
      credentials,
    );
    return data.data;
  },

  register: async (credentials: RegisterCredentials) => {
    const { data } = await api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
      '/auth/register',
      credentials,
    );
    return data.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getMe: async () => {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return data.data;
  },
};
