/**
 * Thin domain wrapper around the API hub for auth flows.
 * Encapsulates the JWT decode + /users/me round-trip and registration
 * → auto-login behavior the UI expects.
 */
import { userApi, extractErrorMessage } from './api';
import { clearAccessToken, storeAccessToken } from '../utils/storage';
import type { CreateUserPayload, LoginCredentials, RegisterCredentials, User } from '../types';

interface JwtPayload {
  id:    string;
  email: string;
  role:  'Admin' | 'User';
  iat?:  number;
  exp?:  number;
}

/** Decode a JWT payload without verifying — only for reading id/email/role. */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export const authService = {
  /**
   * Returns `{ token, user }`. The backend login only returns a token, so we
   * hydrate the user from /users/:id — which requires the token to already be
   * in localStorage so the axios interceptor can attach it. Store FIRST, then
   * fetch; on hydration failure roll the token back so we don't leave a
   * half-authenticated client behind.
   */
  login: async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
    const { token } = await userApi.login(credentials);
    const payload   = decodeJwt(token);
    if (!payload) throw new Error('Invalid token returned by server.');
    storeAccessToken(token);
    try {
      const user = await userApi.byId(payload.id);
      return { token, user };
    } catch (err) {
      // Roll back the stored token so the next attempt starts clean.
      clearAccessToken();
      throw err;
    }
  },

  /**
   * Registers a new account, then logs in to obtain a JWT.
   * The backend `POST /users` is public but doesn't return a token.
   */
  register: async (credentials: RegisterCredentials): Promise<{ token: string; user: User }> => {
    const payload: CreateUserPayload = {
      firstName: credentials.firstName,
      lastName:  credentials.lastName,
      email:     credentials.email,
      phone:     credentials.phone,
      password:  credentials.password,
      role:      'User',
    };
    await userApi.create(payload);
    return authService.login({ email: credentials.email, password: credentials.password });
  },

  /** Backend has no /logout — auth is purely token-based. Local cleanup happens in the slice. */
  logout: async (): Promise<void> => { /* noop */ },

  /** /users/me returns the JWT claims; we hydrate the full User by id. */
  getMe: async (): Promise<User> => {
    const claims = await userApi.me();
    return userApi.byId(claims.id);
  },

  /** Bubble up backend message; falls back to a friendly default. */
  errorMessage: extractErrorMessage,
};
