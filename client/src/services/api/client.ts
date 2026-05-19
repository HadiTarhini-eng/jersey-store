/**
 * Single Axios instance for the entire app.
 * Every API module under services/api/* imports from here.
 *
 * Backend: Fastify @ http://localhost:3000 (no /api prefix).
 * Auth: single JWT bearer token — no refresh-token flow.
 */
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { getAccessToken, clearAccessToken } from '../../utils/storage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request: attach JWT ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: on 401, clear token and bounce to /login ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAccessToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Backend error envelope: `{ error, message, statusCode }`. */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

/** Pull a human-readable message out of an axios error. */
export function extractErrorMessage(err: unknown, fallback = 'Request failed.'): string {
  const e = err as AxiosError<ApiError>;
  return e?.response?.data?.message ?? e?.message ?? fallback;
}

/** Generic typed helpers — every API module uses these instead of axios directly. */
export const http = {
  get:    <T>(url: string, config?: AxiosRequestConfig)             => api.get<T>(url, config).then((r) => r.data),
  post:   <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => api.post<T>(url, body, config).then((r) => r.data),
  patch:  <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => api.patch<T>(url, body, config).then((r) => r.data),
  put:    <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => api.put<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig)             => api.delete<T>(url, config).then((r) => r.data),
};

export function toFormData(fields: Record<string, string | Blob | File | undefined | null>) {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });

  return formData;
}

/**
 * Axios config preset for multipart uploads. Uses a 60 s timeout instead of the
 * 15 s default because product photography on slow connections genuinely needs
 * the extra headroom. Pair with `toFormData(...)` for the body.
 */
export const UPLOAD_CONFIG = {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 60_000,
} as const;

export default api;
