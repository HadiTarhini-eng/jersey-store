/**
 * The single API hub. Every component, slice, or hook that needs to talk
 * to the backend should import from here.
 *
 *   import { userApi, productApi, cartApi, orderApi } from '@/services/api';
 */

export * from './client';
export { endpoints } from './endpoints';

export { userApi }       from './userApi';
export { productApi }    from './productApi';
export { categoryApi }   from './categoryApi';
export { cartApi }       from './cartApi';
export { orderApi }      from './orderApi';
export { reviewApi }     from './reviewApi';
export { offerApi }      from './offerApi';
export { attachmentApi } from './attachmentApi';
