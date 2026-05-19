import { http, toFormData, UPLOAD_CONFIG } from './client';
import { endpoints } from './endpoints';
import type {
  CreateUiContentPayload,
  UiContentItem,
  UiContentSlot,
  UpdateUiContentPayload,
} from '../../types';

type PayloadShape = Record<string, unknown>;

export const uiContentApi = {
  create: <T extends PayloadShape>(body: CreateUiContentPayload, image?: File | Blob, imageName = 'ui-content-image') =>
    http.post<UiContentItem<T>>(
      endpoints.uiContent.create(),
      toFormData({
        data: JSON.stringify(body),
        image: image
          ? image instanceof File
            ? image
            : new File([image], imageName)
          : undefined,
      }),
      UPLOAD_CONFIG,
    ),
  listBySlot: <T extends PayloadShape>(slot: UiContentSlot, params: { isActive?: boolean } = {}) =>
    http.get<UiContentItem<T>[]>(endpoints.uiContent.listBySlot(slot), { params }),
  byId:    <T extends PayloadShape>(id: string)                        => http.get<UiContentItem<T>>(endpoints.uiContent.byId(id)),
  update:  <T extends PayloadShape>(id: string, body: UpdateUiContentPayload) =>
             http.patch<UiContentItem<T>>(endpoints.uiContent.update(id), body),
  setImage:<T extends PayloadShape>(id: string, file: File | Blob, fileName = 'ui-content-image') =>
             http.post<UiContentItem<T>>(
               endpoints.uiContent.image(id),
               toFormData({ file: file instanceof File ? file : new File([file], fileName) }),
               UPLOAD_CONFIG,
             ),
  removeImage: <T extends PayloadShape>(id: string)                    => http.delete<UiContentItem<T>>(endpoints.uiContent.image(id)),
  reorder:     <T extends PayloadShape>(id: string, sortOrder: number) =>
                 http.patch<UiContentItem<T>>(endpoints.uiContent.reorder(id), { sortOrder }),
  activate:    <T extends PayloadShape>(id: string)                    => http.post<UiContentItem<T>>(endpoints.uiContent.activate(id)),
  deactivate:  <T extends PayloadShape>(id: string)                    => http.post<UiContentItem<T>>(endpoints.uiContent.deactivate(id)),
  delete:      (id: string)                                            => http.delete<void>(endpoints.uiContent.delete(id)),
};
