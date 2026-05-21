import { type RouteOptions } from 'fastify'
import { type IAdminService } from '../../../core/services/admin.svc.js'
import { type IAnalyticsService } from '../../../core/services/analytics.svc.js'
import { type IAttachmentService } from '../../../core/services/attachment.svc.js'
import { type ICategoryService, type ICategoryTypeService } from '../../../core/services/catalog.svc.js'
import { type ICartService, type IOrderService, type IReviewService } from '../../../core/services/commerce.svc.js'
import { type IShippingMethodService, type ISiteConfigService } from '../../../core/services/config.svc.js'
import { type ISpecialOfferService } from '../../../core/services/offer.svc.js'
import { type IProductAttributeService, type IProductService, type IProductVariantService } from '../../../core/services/product.svc.js'
import { type IUiContentService } from '../../../core/services/ui-content.svc.js'
import { adminRoutes } from './store/admin.routes.js'
import { analyticsRoutes } from './store/analytics.routes.js'
import { attachmentRoutes } from './store/attachment.routes.js'
import { cartRoutes } from './store/cart.routes.js'
import { categoryRoutes } from './store/category.routes.js'
import { configRoutes } from './store/config.routes.js'
import { offerRoutes } from './store/offer.routes.js'
import { orderRoutes } from './store/order.routes.js'
import { productRoutes } from './store/product.routes.js'
import { reviewRoutes } from './store/review.routes.js'
import { uiContentRoutes } from './store/ui-content.routes.js'

export interface StoreRouteServices {
  attachmentService: IAttachmentService
  categoryTypeService: ICategoryTypeService
  categoryService: ICategoryService
  productService: IProductService
  productAttributeService: IProductAttributeService
  productVariantService: IProductVariantService
  cartService: ICartService
  orderService: IOrderService
  reviewService: IReviewService
  specialOfferService: ISpecialOfferService
  siteConfigService: ISiteConfigService
  shippingMethodService: IShippingMethodService
  uiContentService: IUiContentService
  analyticsService: IAnalyticsService
  adminService: IAdminService
}

export const storeRoutes = (services: StoreRouteServices): RouteOptions[] => [
  ...attachmentRoutes(services.attachmentService),
  ...categoryRoutes(services.categoryTypeService, services.categoryService),
  ...productRoutes(services.productService, services.productAttributeService, services.productVariantService),
  ...cartRoutes(services.cartService),
  ...orderRoutes(services.orderService),
  ...reviewRoutes(services.reviewService),
  ...offerRoutes(services.specialOfferService),
  ...configRoutes(services.siteConfigService, services.shippingMethodService),
  ...uiContentRoutes(services.uiContentService),
  ...analyticsRoutes(services.analyticsService),
  ...adminRoutes(services.adminService),
]
