import type { RouteOptions } from 'fastify'
import type { IProductAttributeService, IProductService, IProductVariantService } from '../../../../core/services/product.svc.js'
import * as ctrl from '../../controllers/product.ctrl.js'
import * as s from '../../schemas/product.schemas.js'

export const productRoutes = (
  productService: IProductService,
  productAttributeService: IProductAttributeService,
  productVariantService: IProductVariantService,
): RouteOptions[] => [
  // Products
  { method: 'POST',   url: '/products',                              roles: ['Admin'],  schema: s.createProductSchema,           handler: ctrl.createProduct(productService) },
  { method: 'GET',    url: '/products',                              protected: false,  schema: s.searchProductsSchema,          handler: ctrl.searchProducts(productService) },
  { method: 'GET',    url: '/products/:id',                          protected: false,  schema: s.getProductSchema,              handler: ctrl.getProductById(productService) },
  { method: 'GET',    url: '/products/slug/:slug',                   protected: false,  schema: s.getProductBySlugSchema,        handler: ctrl.getProductBySlug(productService) },
  { method: 'PATCH',  url: '/products/:id',                          roles: ['Admin'],  schema: s.updateProductSchema,           handler: ctrl.updateProduct(productService) },
  { method: 'POST',   url: '/products/:id/publish',                  roles: ['Admin'],  schema: s.publishProductSchema,          handler: ctrl.publishProduct(productService) },
  { method: 'POST',   url: '/products/:id/archive',                  roles: ['Admin'],  schema: s.archiveProductSchema,          handler: ctrl.archiveProduct(productService) },
  { method: 'PATCH',  url: '/products/:id/featured',                 roles: ['Admin'],  schema: s.setFeaturedSchema,             handler: ctrl.setFeatured(productService) },
  { method: 'PATCH',  url: '/products/:id/price',                    roles: ['Admin'],  schema: s.updateBasePriceSchema,         handler: ctrl.updateBasePrice(productService) },
  { method: 'DELETE', url: '/products/:id',                          roles: ['Admin'],  schema: s.deleteProductSchema,           handler: ctrl.deleteProduct(productService) },

  // Product Images (gallery management — single canonical path).
  // `GET /products/:productId/images` lists the gallery. Add / remove /
  // reorder live under `/attachments/*` so attachment-id paths stay uniform.
  { method: 'POST',   url: '/products/:productId/images',            roles: ['Admin'],  schema: s.addProductImageSchema,         handler: ctrl.addProductImage(productService) },
  { method: 'GET',    url: '/products/:productId/images',            protected: false,  schema: s.listProductImagesSchema,       handler: ctrl.listProductImages(productService) },

  // Product Attributes
  { method: 'POST',   url: '/product-attributes',                    roles: ['Admin'],  schema: s.createAttributeSchema,         handler: ctrl.createAttribute(productAttributeService) },
  { method: 'GET',    url: '/product-attributes',                    protected: false,  schema: s.listAttributesSchema,          handler: ctrl.listAttributes(productAttributeService) },
  { method: 'PATCH',  url: '/product-attributes/:id',                roles: ['Admin'],  schema: s.updateAttributeSchema,         handler: ctrl.updateAttribute(productAttributeService) },
  { method: 'POST',   url: '/products/:productId/assigned-attributes', roles: ['Admin'], schema: s.assignAttributeSchema,        handler: ctrl.assignAttribute(productAttributeService) },
  { method: 'PATCH',  url: '/product-assigned-attributes/:id',       roles: ['Admin'],  schema: s.updateAssignedAttributeSchema, handler: ctrl.updateAssignedAttribute(productAttributeService) },
  { method: 'DELETE', url: '/product-assigned-attributes/:id',       roles: ['Admin'],  schema: s.removeAssignedAttributeSchema, handler: ctrl.removeAssignedAttribute(productAttributeService) },
  { method: 'POST',   url: '/product-assigned-attributes/:id/options', roles: ['Admin'], schema: s.createAttributeOptionSchema,  handler: ctrl.createAttributeOption(productAttributeService) },
  { method: 'GET',    url: '/product-assigned-attributes/:id/options', protected: false, schema: s.listAttributeOptionsSchema,   handler: ctrl.listAttributeOptions(productAttributeService) },

  // Product Specifications
  { method: 'POST',   url: '/products/:productId/specifications',    roles: ['Admin'],  schema: s.createSpecificationSchema,     handler: ctrl.createSpecification(productAttributeService) },
  { method: 'GET',    url: '/products/:productId/specifications',    protected: false,  schema: s.listSpecificationsSchema,      handler: ctrl.listSpecifications(productAttributeService) },

  // Product Variants
  { method: 'POST',   url: '/products/:productId/variants',          roles: ['Admin'],  schema: s.createVariantSchema,           handler: ctrl.createVariant(productVariantService) },
  { method: 'GET',    url: '/products/:productId/variants',          protected: false,  schema: s.listVariantsSchema,            handler: ctrl.listVariants(productVariantService) },
  { method: 'GET',    url: '/variants/:id',                          protected: false,  schema: s.getVariantSchema,              handler: ctrl.getVariantById(productVariantService) },
  { method: 'GET',    url: '/variants/sku/:sku',                     protected: false,  schema: s.getVariantBySkuSchema,         handler: ctrl.getVariantBySku(productVariantService) },
  { method: 'PATCH',  url: '/variants/:id',                          roles: ['Admin'],  schema: s.updateVariantSchema,           handler: ctrl.updateVariant(productVariantService) },
  { method: 'POST',   url: '/variants/:id/image',                    roles: ['Admin'],  schema: s.setVariantImageSchema,         handler: ctrl.setVariantImage(productVariantService) },
  { method: 'DELETE', url: '/variants/:id/image',                    roles: ['Admin'],  schema: s.removeVariantImageSchema,      handler: ctrl.removeVariantImage(productVariantService) },
  { method: 'PATCH',  url: '/variants/:id/stock',                    roles: ['Admin'],  schema: s.updateStockSchema,             handler: ctrl.updateStock(productVariantService) },
  { method: 'POST',   url: '/variants/:id/reserve',                  roles: ['Admin'],  schema: s.reserveStockSchema,            handler: ctrl.reserveStock(productVariantService) },
  { method: 'PUT',    url: '/variants/:id/attributes',               roles: ['Admin'],  schema: s.setVariantAttributesSchema,    handler: ctrl.setVariantAttributes(productVariantService) },
  { method: 'DELETE', url: '/variants/:id',                          roles: ['Admin'],  schema: s.deactivateVariantSchema,       handler: ctrl.deactivateVariant(productVariantService) },
]
