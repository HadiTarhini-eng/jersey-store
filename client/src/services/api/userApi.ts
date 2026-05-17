import { http, toFormData } from './client';
import { endpoints } from './endpoints';
import type {
  CreateUserPayload, LoginCredentials, LoginResponse, UpdateUserPayload, User, UserRole,
} from '../../types';

export const userApi = {
  /** Public — registration. */
  create:        (payload: CreateUserPayload) => http.post<User>(endpoints.users.create(), payload),

  /** Public — returns `{ token }` (single JWT, no refresh). */
  login:         (credentials: LoginCredentials) => http.post<LoginResponse>(endpoints.users.login(), credentials),

  /** Returns the JWT payload `{ id, email, role }` for the current user. */
  me:            () => http.get<{ id: string; email: string; role: UserRole }>(endpoints.users.me()),

  list:          ()                              => http.get<User[]>(endpoints.users.list()),
  byId:          (id: string)                    => http.get<User>(endpoints.users.byId(id)),
  update:        (id: string, body: UpdateUserPayload) => http.patch<User>(endpoints.users.update(id), body),
  changePassword:(id: string, password: string)  => http.patch<User>(endpoints.users.changePassword(id), { password }),
  changeRole:    (id: string, role: UserRole)    => http.patch<User>(endpoints.users.changeRole(id), { role }),
  setProfileImage:(id: string, file: File | Blob, fileName = 'profile-image') =>
    http.post<User>(
      endpoints.users.profileImage(id),
      toFormData({
        file: file instanceof File ? file : new File([file], fileName),
      }),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),
  removeProfileImage:(id: string)                     => http.delete<User>(endpoints.users.profileImage(id)),
  activate:      (id: string)                    => http.post<User>(endpoints.users.activate(id)),
  deactivate:    (id: string)                    => http.delete<User>(endpoints.users.deactivate(id)),
};
