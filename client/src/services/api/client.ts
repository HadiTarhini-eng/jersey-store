/**
 * Single Axios instance for the entire app.
 * Every API module under services/api/* imports from here.
 *
 * Backend: Fastify served same-origin under /api.
 * In dev, Vite proxies /api -> http://localhost:3000 (see vite.config.ts).
 * Auth: Supabase access token, attached per request and refreshed by the
 * Supabase client itself.
 */
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { supabase } from '../supabase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request: attach the Supabase access token ────────────────────────────────
// getSession() reads the cached session and transparently refreshes it when
// it has expired, so no request goes out with a stale token.
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: on 401, clear token and bounce to /login ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 means the session is gone or invalid — drop it and bounce to login.
    // 403/409 are handled by the caller (unverified email, missing profile) so
    // the user isn't logged out mid-flow.
    if (error.response?.status === 401) {
      void supabase.auth.signOut();
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

/** HTTP status code from an axios error, or undefined for network failures. */
export function extractErrorStatus(err: unknown): number | undefined {
  return (err as AxiosError)?.response?.status;
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
