import { http } from './client';
import { endpoints } from './endpoints';
import type {
  CreateShippingMethodPayload,
  ShippingMethod,
  UpdateShippingMethodPayload,
} from '../../types';

export const shippingApi = {
  create:     (body: CreateShippingMethodPayload) => http.post<ShippingMethod>(endpoints.shipping.create(), body),
  list:       (params: { isActive?: boolean } = {}) =>
                http.get<ShippingMethod[]>(endpoints.shipping.list(), { params }),
  byId:       (id: string)                        => http.get<ShippingMethod>(endpoints.shipping.byId(id)),
  update:     (id: string, body: UpdateShippingMethodPayload) =>
                http.patch<ShippingMethod>(endpoints.shipping.update(id), body),
  activate:   (id: string) => http.post<ShippingMethod>(endpoints.shipping.activate(id)),
  deactivate: (id: string) => http.post<ShippingMethod>(endpoints.shipping.deactivate(id)),
  delete:     (id: string) => http.delete<void>(endpoints.shipping.delete(id)),
};
