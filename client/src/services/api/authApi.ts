import { http } from './client';
import { endpoints } from './endpoints';
import type { User } from '../../types';

/** Display fields used only when the backend creates a brand-new profile. */
export interface SyncProfilePayload {
  firstName?: string;
  lastName?:  string;
  phone?:     string | null;
}

export const authApi = {
  /**
   * Links the signed-in Supabase identity to its application profile and
   * returns it. The backend derives id, email and role from the verified
   * access token and the `users` row — never from this payload.
   */
  sync: (payload: SyncProfilePayload = {}) => http.post<User>(endpoints.auth.sync(), payload),
};
