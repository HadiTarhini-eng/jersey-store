import { http, toFormData, UPLOAD_CONFIG } from './client';
import { endpoints } from './endpoints';
import type { SiteConfig, UpdateSiteConfigPayload } from '../../types';

export const siteConfigApi = {
  get:    ()                                => http.get<SiteConfig>(endpoints.siteConfig.get()),
  update: (body: UpdateSiteConfigPayload)   => http.patch<SiteConfig>(endpoints.siteConfig.update(), body),
  setLogo: (file: File | Blob, fileName = 'site-logo') =>
             http.post<SiteConfig>(
               endpoints.siteConfig.logo(),
               toFormData({ file: file instanceof File ? file : new File([file], fileName) }),
               UPLOAD_CONFIG,
             ),
  removeLogo: () => http.delete<SiteConfig>(endpoints.siteConfig.logo()),
};
