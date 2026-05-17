import { type RouteOptions } from 'fastify'
import { type IAttachmentService } from '../../../core/services/attachment.svc.js'
import { type ICategoryService, type ICategoryTypeService } from '../../../core/services/catalog.svc.js'
import { type ICartService, type IOrderService, type IReviewService } from '../../../core/services/commerce.svc.js'
import { type ISpecialOfferService } from '../../../core/services/offer.svc.js'
import { type IProductAttributeService, type IProductService, type IProductVariantService } from '../../../core/services/product.svc.js'
import { attachmentRoutes } from './store/attachment.routes.js'
import { cartRoutes } from './store/cart.routes.js'
import { categoryRoutes } from './store/category.routes.js'
import { offerRoutes } from './store/offer.routes.js'
import { orderRoutes } from './store/order.routes.js'
import { productRoutes } from './store/product.routes.js'
import { reviewRoutes } from './store/review.routes.js'

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
}

export const storeRoutes = (services: StoreRouteServices): RouteOptions[] => [
  ...attachmentRoutes(services.attachmentService),
  ...categoryRoutes(services.categoryTypeService, services.categoryService),
  ...productRoutes(services.productService, services.productAttributeService, services.productVariantService),
  ...cartRoutes(services.cartService),
  ...orderRoutes(services.orderService),
  ...reviewRoutes(services.reviewService),
  ...offerRoutes(services.specialOfferService),
]
