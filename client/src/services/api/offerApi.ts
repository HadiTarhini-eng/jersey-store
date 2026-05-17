import { http } from './client';
import { endpoints } from './endpoints';
import type { CreateOfferPayload, SpecialOffer, UpdateOfferPayload } from '../../types';

export const offerApi = {
  create:      (body: CreateOfferPayload)              => http.post<SpecialOffer>(endpoints.offers.create(), body),
  active:      (date?: string)                         =>
                 http.get<SpecialOffer[]>(endpoints.offers.active(), { params: date ? { date } : undefined }),
  byId:        (id: string)                            => http.get<SpecialOffer>(endpoints.offers.byId(id)),
  forProduct:  (productId: string)                     => http.get<SpecialOffer[]>(endpoints.offers.forProduct(productId)),
  update:      (id: string, body: UpdateOfferPayload)  => http.patch<SpecialOffer>(endpoints.offers.update(id), body),
  attach:      (offerId: string, productId: string)    => http.post<void>(endpoints.offers.attach(offerId, productId)),
  detach:      (offerId: string, productId: string)    => http.delete<void>(endpoints.offers.detach(offerId, productId)),
  reschedule:  (id: string, startDate: string, endDate: string) =>
                 http.patch<SpecialOffer>(endpoints.offers.schedule(id), { startDate, endDate }),
  activate:    (id: string)                            => http.post<SpecialOffer>(endpoints.offers.activate(id)),
  deactivate:  (id: string)                            => http.delete<SpecialOffer>(endpoints.offers.deactivate(id)),
};
