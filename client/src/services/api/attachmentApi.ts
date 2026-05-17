import { http, toFormData } from './client';
import { endpoints } from './endpoints';
import type { Attachment } from '../../types';

export const attachmentApi = {
  create:   (file: File | Blob, fileName = 'attachment') =>
              http.post<Attachment>(
                endpoints.attachments.create(),
                toFormData({
                  file: file instanceof File ? file : new File([file], fileName),
                }),
                { headers: { 'Content-Type': 'multipart/form-data' } },
              ),
  byId:     (id: string)                                => http.get<Attachment>(endpoints.attachments.byId(id)),
  forUser:  (userId: string)                            => http.get<Attachment[]>(endpoints.attachments.forUser(userId)),
  rename:   (id: string, fileName: string)              => http.patch<Attachment>(endpoints.attachments.rename(id), { fileName }),
  replace:  (id: string, file: File | Blob, fileName = 'attachment') =>
              http.patch<Attachment>(
                endpoints.attachments.replace(id),
                toFormData({
                  file: file instanceof File ? file : new File([file], fileName),
                }),
                { headers: { 'Content-Type': 'multipart/form-data' } },
              ),
  delete:   (id: string)                                => http.delete<void>(endpoints.attachments.delete(id)),
};
