import { http, toFormData } from './client';
import { endpoints } from './endpoints';
import type { CreateOfferPayload, SpecialOffer, UpdateOfferPayload } from '../../types';

export const offerApi = {
  create:      (body: CreateOfferPayload, banner?: File | Blob, bannerName = 'offer-banner') =>
                 http.post<SpecialOffer>(
                   endpoints.offers.create(),
                   toFormData({
                     data: JSON.stringify(body),
                     banner: banner
                       ? banner instanceof File
                         ? banner
                         : new File([banner], bannerName)
                       : undefined,
                   }),
                   { headers: { 'Content-Type': 'multipart/form-data' } },
                 ),
  active:      (date?: string)                         =>
                 http.get<SpecialOffer[]>(endpoints.offers.active(), { params: date ? { date } : undefined }),
  byId:        (id: string)                            => http.get<SpecialOffer>(endpoints.offers.byId(id)),
  forProduct:  (productId: string)                     => http.get<SpecialOffer[]>(endpoints.offers.forProduct(productId)),
  update:      (id: string, body: UpdateOfferPayload)  => http.patch<SpecialOffer>(endpoints.offers.update(id), body),
  attach:      (offerId: string, productId: string)    => http.post<void>(endpoints.offers.attach(offerId, productId)),
  detach:      (offerId: string, productId: string)    => http.delete<void>(endpoints.offers.detach(offerId, productId)),
  reschedule:  (id: string, startDate: string, endDate: string) =>
                 http.patch<SpecialOffer>(endpoints.offers.schedule(id), { startDate, endDate }),
  setBanner:   (id: string, file: File | Blob, fileName = 'offer-banner') =>
                 http.post<SpecialOffer>(
                   endpoints.offers.banner(id),
                   toFormData({
                     file: file instanceof File ? file : new File([file], fileName),
                   }),
                   { headers: { 'Content-Type': 'multipart/form-data' } },
                 ),
  removeBanner:(id: string)                            => http.delete<SpecialOffer>(endpoints.offers.banner(id)),
  activate:    (id: string)                            => http.post<SpecialOffer>(endpoints.offers.activate(id)),
  deactivate:  (id: string)                            => http.delete<SpecialOffer>(endpoints.offers.deactivate(id)),
};
