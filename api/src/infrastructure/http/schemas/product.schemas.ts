import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })
const ProductIdParams = Type.Object({ productId: Type.String() })
const SlugParams = Type.Object({ slug: Type.String() })
const SkuParams = Type.Object({ sku: Type.String() })

// ── Products ────────────────────────────────────────────────────────────────

const ProductBody = Type.Object({
  id: Type.Optional(Type.String()),
  categoryId: Type.String(),
  title: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1 }),
  shortDescription: Type.Optional(Type.String()),
  fullDescription: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
  brand: Type.Optional(Type.String()),
  basePrice: Type.Number({ minimum: 0 }),
  compareAtPrice: Type.Optional(Type.Union([Type.Number({ minimum: 0 }), Type.Null()])),
  printable: Type.Optional(Type.Boolean()),
  status: Type.Union([Type.Literal('draft'), Type.Literal('active'), Type.Literal('archived')]),
  featured: Type.Optional(Type.Boolean()),
  createdBy: Type.String(),
  isActive: Type.Optional(Type.Boolean()),
  searchVector: Type.Optional(Type.String()),
})
export type ProductBodyType = Static<typeof ProductBody>

const UpdateProductBody = Type.Partial(ProductBody)
export type UpdateProductBodyType = Static<typeof UpdateProductBody>

// Bulk pricing: one transactional payload that updates basePrice (and optionally
// compareAtPrice) across many products at once. Used by the admin discount
// workbench so an N-product apply is a single round-trip + atomic.
const BulkPricingBody = Type.Object({
  items: Type.Array(
    Type.Object({
      productId: Type.String(),
      basePrice: Type.Number({ minimum: 0 }),
      compareAtPrice: Type.Optional(Type.Union([Type.Number({ minimum: 0 }), Type.Null()])),
    }),
    { minItems: 1 },
  ),
})
export type BulkPricingBodyType = Static<typeof BulkPricingBody>

const ProductMultipartBody = Type.Object({
  data: Type.Unsafe<unknown>({ type: 'string', description: 'JSON string of product fields (categoryId, title, slug, basePrice, status, ...)' }),
  gallery: Type.Optional(Type.Unsafe<unknown>({ type: 'string', format: 'binary', description: 'Gallery image file(s). The first becomes the primary/cover image (sortOrder=0). Repeat this field to upload multiple. Max 5 MB each.' })),
})

const ImageUploadBody = Type.Object({
  file: Type.Unsafe<unknown>({ type: 'string', format: 'binary', description: 'Gallery image file. Max 5 MB. image/*.' }),
  sortOrder: Type.Optional(Type.Unsafe<unknown>({ type: 'string', description: 'Integer sort order (defaults to 0)' })),
})

const SingleImageUploadBody = Type.Object({
  file: Type.Unsafe<unknown>({ type: 'string', format: 'binary', description: 'Image file. Max 5 MB. image/*.' }),
})

const VariantMultipartBody = Type.Object({
  data: Type.Unsafe<unknown>({ type: 'string', description: 'JSON string of variant fields (sku, priceOverride?, stockQuantity?)' }),
  image: Type.Optional(Type.Unsafe<unknown>({ type: 'string', format: 'binary', description: 'Variant image file. Max 5 MB. image/*.' })),
})

const ProductSearchQuery = Type.Object({
  query: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  featured: Type.Optional(Type.Boolean()),
  brand: Type.Optional(Type.String()),
  minPrice: Type.Optional(Type.Number()),
  maxPrice: Type.Optional(Type.Number()),
})
export type ProductSearchQueryType = Static<typeof ProductSearchQuery>

const SetFeaturedBody = Type.Object({ featured: Type.Boolean() })
export type SetFeaturedBodyType = Static<typeof SetFeaturedBody>

const SetPriceBody = Type.Object({ basePrice: Type.Number({ minimum: 0 }) })
export type SetPriceBodyType = Static<typeof SetPriceBody>

// ── Product Attributes ───────────────────────────────────────────────────────

const AttributeTypeEnum = Type.Union([
  Type.Literal('text'), Type.Literal('number'), Type.Literal('boolean'),
  Type.Literal('select'), Type.Literal('multiselect'), Type.Literal('color'), Type.Literal('date'),
])

const ProductAttributeBody = Type.Object({
  id: Type.Optional(Type.String()),
  name: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1 }),
  type: AttributeTypeEnum,
  isVariantable: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
})
export type ProductAttributeBodyType = Static<typeof ProductAttributeBody>

const UpdateProductAttributeBody = Type.Partial(ProductAttributeBody)
export type UpdateProductAttributeBodyType = Static<typeof UpdateProductAttributeBody>

const AssignAttributeBody = Type.Object({
  id: Type.Optional(Type.String()),
  attributeId: Type.String(),
  isRequired: Type.Optional(Type.Boolean()),
  isFilterable: Type.Optional(Type.Boolean()),
  sortOrder: Type.Optional(Type.Integer({ minimum: 0 })),
  isActive: Type.Optional(Type.Boolean()),
})
export type AssignAttributeBodyType = Static<typeof AssignAttributeBody>

const UpdateAssignedAttributeBody = Type.Partial(AssignAttributeBody)
export type UpdateAssignedAttributeBodyType = Static<typeof UpdateAssignedAttributeBody>

const CreateAttributeOptionBody = Type.Object({
  id: Type.Optional(Type.String()),
  value: Type.String({ minLength: 1 }),
  label: Type.Optional(Type.String()),
  metaData: Type.Optional(Type.Record(Type.String(), Type.Any())),
  sortOrder: Type.Optional(Type.Integer({ minimum: 0 })),
  isActive: Type.Optional(Type.Boolean()),
})
export type CreateAttributeOptionBodyType = Static<typeof CreateAttributeOptionBody>

// ── Product Specifications ───────────────────────────────────────────────────

const CreateSpecificationBody = Type.Object({
  id: Type.Optional(Type.String()),
  attributeId: Type.String(),
  value: Type.String({ minLength: 1, maxLength: 1000 }),
  isActive: Type.Optional(Type.Boolean()),
})
export type CreateSpecificationBodyType = Static<typeof CreateSpecificationBody>

// ── Product Variants ─────────────────────────────────────────────────────────

const CreateVariantBody = Type.Object({
  id: Type.Optional(Type.String()),
  sku: Type.String({ minLength: 1, maxLength: 100 }),
  priceOverride: Type.Optional(Type.Union([Type.Number({ minimum: 0 }), Type.Null()])),
  stockQuantity: Type.Optional(Type.Integer({ minimum: 0 })),
  imageId: Type.Optional(Type.String()),
  isVisible: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
})
export type CreateVariantBodyType = Static<typeof CreateVariantBody>

const UpdateVariantBody = Type.Partial(CreateVariantBody)
export type UpdateVariantBodyType = Static<typeof UpdateVariantBody>

const StockBody = Type.Object({ stockQuantity: Type.Integer({ minimum: 0 }) })
export type StockBodyType = Static<typeof StockBody>

const ReserveBody = Type.Object({ quantity: Type.Integer({ minimum: 1 }) })
export type ReserveBodyType = Static<typeof ReserveBody>

const SetVariantAttributesBody = Type.Array(Type.Object({
  id: Type.Optional(Type.String()),
  attributeId: Type.String(),
  attributeOptionId: Type.String(),
  isActive: Type.Optional(Type.Boolean()),
}))
export type SetVariantAttributesBodyType = Static<typeof SetVariantAttributesBody>

// ── Schemas ──────────────────────────────────────────────────────────────────

// Multipart routes: schema documents `consumes` for Swagger but skips body
// validation — @fastify/multipart leaves request.body undefined and the
// handler parses parts manually via request.parts().
export const createProductSchema: FastifySchema = { tags: ['Products'], consumes: ['multipart/form-data'], description: 'Multipart: `data` (JSON) + optional `gallery` (image files).' }
export const searchProductsSchema: FastifySchema = { tags: ['Products'], querystring: ProductSearchQuery }
export const getProductSchema: FastifySchema = { tags: ['Products'], params: IdParams }
export const getProductBySlugSchema: FastifySchema = { tags: ['Products'], params: SlugParams }
export const updateProductSchema: FastifySchema = { tags: ['Products'], params: IdParams, body: UpdateProductBody }
export const publishProductSchema: FastifySchema = { tags: ['Products'], params: IdParams }
export const archiveProductSchema: FastifySchema = { tags: ['Products'], params: IdParams }
export const setFeaturedSchema: FastifySchema = { tags: ['Products'], params: IdParams, body: SetFeaturedBody }
export const updateBasePriceSchema: FastifySchema = { tags: ['Products'], params: IdParams, body: SetPriceBody }
export const bulkPricingSchema: FastifySchema = { tags: ['Products'], body: BulkPricingBody, description: 'Bulk update basePrice (and optionally compareAtPrice) across many products in a single transaction.' }
export const deleteProductSchema: FastifySchema = { tags: ['Products'], params: IdParams }

export const addProductImageSchema: FastifySchema = { tags: ['Products'], consumes: ['multipart/form-data'], params: ProductIdParams, description: 'Multipart: `file` (image) + optional `sortOrder` (string integer).' }
export const listProductImagesSchema: FastifySchema = { tags: ['Products'], params: ProductIdParams }
export const removeProductImageSchema: FastifySchema = { tags: ['Products'], params: IdParams }

export const createAttributeSchema: FastifySchema = { tags: ['ProductAttributes'], body: ProductAttributeBody }
export const listAttributesSchema: FastifySchema = { tags: ['ProductAttributes'] }
export const updateAttributeSchema: FastifySchema = { tags: ['ProductAttributes'], params: IdParams, body: UpdateProductAttributeBody }
export const assignAttributeSchema: FastifySchema = { tags: ['ProductAttributes'], params: ProductIdParams, body: AssignAttributeBody }
export const updateAssignedAttributeSchema: FastifySchema = { tags: ['ProductAttributes'], params: IdParams, body: UpdateAssignedAttributeBody }
export const removeAssignedAttributeSchema: FastifySchema = { tags: ['ProductAttributes'], params: IdParams }
export const createAttributeOptionSchema: FastifySchema = { tags: ['ProductAttributes'], params: IdParams, body: CreateAttributeOptionBody }
export const listAttributeOptionsSchema: FastifySchema = { tags: ['ProductAttributes'], params: IdParams }

export const createSpecificationSchema: FastifySchema = { tags: ['ProductSpecifications'], params: ProductIdParams, body: CreateSpecificationBody }
export const listSpecificationsSchema: FastifySchema = { tags: ['ProductSpecifications'], params: ProductIdParams }

export const createVariantSchema: FastifySchema = { tags: ['ProductVariants'], consumes: ['multipart/form-data'], params: ProductIdParams, description: 'Multipart: `data` (JSON) + optional `image` (file).' }
export const setVariantImageSchema: FastifySchema = { tags: ['ProductVariants'], consumes: ['multipart/form-data'], params: IdParams, description: 'Multipart: `file` (image).' }
export const removeVariantImageSchema: FastifySchema = { tags: ['ProductVariants'], params: IdParams }
export const listVariantsSchema: FastifySchema = { tags: ['ProductVariants'], params: ProductIdParams }
export const getVariantSchema: FastifySchema = { tags: ['ProductVariants'], params: IdParams }
export const getVariantBySkuSchema: FastifySchema = { tags: ['ProductVariants'], params: SkuParams }
export const updateVariantSchema: FastifySchema = { tags: ['ProductVariants'], params: IdParams, body: UpdateVariantBody }
export const updateStockSchema: FastifySchema = { tags: ['ProductVariants'], params: IdParams, body: StockBody }
export const reserveStockSchema: FastifySchema = { tags: ['ProductVariants'], params: IdParams, body: ReserveBody }
export const setVariantAttributesSchema: FastifySchema = { tags: ['ProductVariants'], params: IdParams, body: SetVariantAttributesBody }
export const deactivateVariantSchema: FastifySchema = { tags: ['ProductVariants'], params: IdParams }
