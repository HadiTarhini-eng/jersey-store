import { http, toFormData } from './client';
import { endpoints } from './endpoints';
import type {
  Category, CategoryType, CreateCategoryPayload, CreateCategoryTypePayload,
  ListCategoriesQuery, UpdateCategoryPayload, UpdateCategoryTypePayload,
} from '../../types';

export const categoryApi = {
  // ── Category types ──────────────────────────────────────────────────────────
  types: {
    create: (body: CreateCategoryTypePayload) => http.post<CategoryType>(endpoints.categoryTypes.create(), body),
    list:   ()                                => http.get<CategoryType[]>(endpoints.categoryTypes.list()),
    byId:   (id: string)                      => http.get<CategoryType>(endpoints.categoryTypes.byId(id)),
    update: (id: string, body: UpdateCategoryTypePayload) =>
              http.patch<CategoryType>(endpoints.categoryTypes.update(id), body),
    delete: (id: string)                      => http.delete<void>(endpoints.categoryTypes.delete(id)),
  },

  // ── Categories ──────────────────────────────────────────────────────────────
  create:    (body: CreateCategoryPayload, image?: File | Blob, imageName = 'category-image') =>
               http.post<Category>(
                 endpoints.categories.create(),
                 toFormData({
                   data: JSON.stringify(body),
                   image: image
                     ? image instanceof File
                       ? image
                       : new File([image], imageName)
                     : undefined,
                 }),
                 { headers: { 'Content-Type': 'multipart/form-data' } },
               ),
  list:      (query: ListCategoriesQuery = {}) =>
               http.get<Category[]>(endpoints.categories.list(), { params: query }),
  byId:      (id: string)                  => http.get<Category>(endpoints.categories.byId(id)),
  children:  (id: string)                  => http.get<Category[]>(endpoints.categories.children(id)),
  update:    (id: string, body: UpdateCategoryPayload) =>
               http.patch<Category>(endpoints.categories.update(id), body),
  move:      (id: string, parentId?: string) =>
               http.patch<Category>(endpoints.categories.move(id), { parentId }),
  setImage:  (id: string, image: File | Blob, imageName = 'category-image') =>
               http.post<Category>(
                 endpoints.categories.image(id),
                 toFormData({
                   file: image instanceof File ? image : new File([image], imageName),
                 }),
                 { headers: { 'Content-Type': 'multipart/form-data' } },
               ),
  removeImage:(id: string)                  => http.delete<Category>(endpoints.categories.image(id)),
  activate:  (id: string)                  => http.post<Category>(endpoints.categories.activate(id)),
  delete:    (id: string)                  => http.delete<void>(endpoints.categories.delete(id)),
};
