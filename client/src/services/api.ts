/**
 * Single Axios instance for the entire app.
 * All API calls go through here — swap BASE_URL to point at a real backend.
 */
import axios from 'axios';
import { getStoredTokens, storeTokens, clearStoredTokens } from '../utils/storage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor — attach access token ────────────────────────────────
api.interceptors.request.use((config) => {
  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// ── Response interceptor — refresh on 401 ────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error);
    }

    original._retried = true;

    if (isRefreshing) {
      // Queue requests that arrive while we're already refreshing
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    const tokens = getStoredTokens();

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: tokens?.refreshToken,
      });
      const newTokens = data.data;
      storeTokens(newTokens);

      refreshQueue.forEach((cb) => cb(newTokens.accessToken));
      refreshQueue = [];

      original.headers.Authorization = `Bearer ${newTokens.accessToken}`;
      return api(original);
    } catch {
      clearStoredTokens();
      // Redirect to login — avoids circular import with router
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
