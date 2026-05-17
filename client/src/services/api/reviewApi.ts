import { http } from './client';
import { endpoints } from './endpoints';
import type { CreateReviewPayload, Review, UpdateReviewPayload } from '../../types';

export const reviewApi = {
  create:       (body: CreateReviewPayload)         => http.post<Review>(endpoints.reviews.create(), body),
  byId:         (id: string)                        => http.get<Review>(endpoints.reviews.byId(id)),
  forProduct:   (productId: string)                 => http.get<Review[]>(endpoints.reviews.forProduct(productId)),
  forUser:      (userId: string)                    => http.get<Review[]>(endpoints.reviews.forUser(userId)),
  update:       (id: string, body: UpdateReviewPayload) =>
                  http.patch<Review>(endpoints.reviews.update(id), body),
  verify:       (id: string)                        => http.post<Review>(endpoints.reviews.verify(id)),
  delete:       (id: string)                        => http.delete<void>(endpoints.reviews.delete(id)),
};
