import { http, toFormData, UPLOAD_CONFIG } from './client';
import { endpoints } from './endpoints';
import type { UpdateUserPayload, User, UserRole } from '../../types';

// Accounts are created only through Supabase Auth signup + POST /auth/sync.
export const userApi = {
  /** Returns the resolved identity `{ id, email, role }` for the current user. */
  me:            () => http.get<{ id: string; email: string; role: UserRole }>(endpoints.users.me()),

  list:          ()                              => http.get<User[]>(endpoints.users.list()),
  byId:          (id: string)                    => http.get<User>(endpoints.users.byId(id)),
  update:        (id: string, body: UpdateUserPayload) => http.patch<User>(endpoints.users.update(id), body),
  changeRole:    (id: string, role: UserRole)    => http.patch<User>(endpoints.users.changeRole(id), { role }),
  setProfileImage:(id: string, file: File | Blob, fileName = 'profile-image') =>
    http.post<User>(
      endpoints.users.profileImage(id),
      toFormData({
        file: file instanceof File ? file : new File([file], fileName),
      }),
      UPLOAD_CONFIG,
    ),
  removeProfileImage:(id: string)                     => http.delete<User>(endpoints.users.profileImage(id)),
  activate:      (id: string)                    => http.post<User>(endpoints.users.activate(id)),
  deactivate:    (id: string)                    => http.delete<User>(endpoints.users.deactivate(id)),
};
