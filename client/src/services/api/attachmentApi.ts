import { http } from './client';
import { endpoints } from './endpoints';
import type { Attachment, CreateAttachmentPayload, ReplaceAttachmentPayload } from '../../types';

export const attachmentApi = {
  create:   (body: CreateAttachmentPayload)             => http.post<Attachment>(endpoints.attachments.create(), body),
  byId:     (id: string)                                => http.get<Attachment>(endpoints.attachments.byId(id)),
  forUser:  (userId: string)                            => http.get<Attachment[]>(endpoints.attachments.forUser(userId)),
  rename:   (id: string, fileName: string)              => http.patch<Attachment>(endpoints.attachments.rename(id), { fileName }),
  replace:  (id: string, body: ReplaceAttachmentPayload) => http.patch<Attachment>(endpoints.attachments.replace(id), body),
  delete:   (id: string)                                => http.delete<void>(endpoints.attachments.delete(id)),
};
