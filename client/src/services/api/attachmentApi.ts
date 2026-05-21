import { http, toFormData, UPLOAD_CONFIG } from './client';
import { endpoints } from './endpoints';
import type { Attachment } from '../../types';

/**
 * Product-gallery attachment management. Creation is on the products router
 * (`POST /products/:productId/images` — see productApi.images.add) so that
 * the FK is established at upload time. Everything else is keyed by
 * attachment id.
 */
export const attachmentApi = {
  byId:    (id: string)                              => http.get<Attachment>(endpoints.attachments.byId(id)),
  rename:  (id: string, fileName: string)            => http.patch<Attachment>(endpoints.attachments.rename(id), { fileName }),
  replace: (id: string, file: File | Blob, fileName = 'attachment') =>
             http.patch<Attachment>(
               endpoints.attachments.replace(id),
               toFormData({ file: file instanceof File ? file : new File([file], fileName) }),
               UPLOAD_CONFIG,
             ),
  delete:  (id: string)                              => http.delete<void>(endpoints.attachments.delete(id)),
};
