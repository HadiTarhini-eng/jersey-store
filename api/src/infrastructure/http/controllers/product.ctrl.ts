import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  Product, ProductAssignedAttribute, ProductAttribute,
  ProductAttributeOption, ProductSpecification, ProductVariant, VariantAttributeValue,
} from '../../../core/entities/product.js'
import type { IProductAttributeService, IProductService, IProductVariantService } from '../../../core/services/product.svc.js'
import { sendCreated, sendDeleted, sendOk } from '../routes/route-utils.js'
import type {
  AssignAttributeBodyType, CreateAttributeOptionBodyType, CreateSpecificationBodyType,
  CreateVariantBodyType, ProductAttributeBodyType, ProductBodyType, ProductSearchQueryType,
  ReserveBodyType, SetFeaturedBodyType, SetPriceBodyType, SetVariantAttributesBodyType,
  StockBodyType, UpdateAssignedAttributeBodyType, UpdateProductAttributeBodyType,
  UpdateProductBodyType, UpdateVariantBodyType,
} from '../schemas/product.schemas.js'

type IdParams = { id: string }
type ProductIdParams = { productId: string }
type SlugParams = { slug: string }
type SkuParams = { sku: string }

// ── Products ─────────────────────────────────────────────────────────────────

export const createProduct = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendCreated(reply, await service.createProduct(new Product(request.body as ProductBodyType)))
  }

export const searchProducts = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.searchProducts(request.query as any))
  }

export const getProductById = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getProductById((request.params as IdParams).id))
  }

export const getProductBySlug = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getProductBySlug((request.params as SlugParams).slug))
  }

export const updateProduct = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.updateProduct((request.params as IdParams).id, request.body as UpdateProductBodyType))
  }

export const publishProduct = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.publishProduct((request.params as IdParams).id))
  }

export const archiveProduct = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.archiveProduct((request.params as IdParams).id))
  }

export const setFeatured = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { featured } = request.body as SetFeaturedBodyType
    sendOk(reply, await service.setFeatured(id, featured))
  }

export const updateBasePrice = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { basePrice } = request.body as SetPriceBodyType
    sendOk(reply, await service.updateBasePrice(id, basePrice))
  }

export const deleteProduct = (service: IProductService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await service.deleteProduct((request.params as IdParams).id)
    sendDeleted(reply)
  }

// ── Product Attributes ────────────────────────────────────────────────────────

export const createAttribute = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendCreated(reply, await service.createAttribute(new ProductAttribute(request.body as any)))
  }

export const listAttributes = (service: IProductAttributeService) =>
  async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listAttributes())
  }

export const updateAttribute = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.updateAttribute((request.params as IdParams).id, request.body as UpdateProductAttributeBodyType))
  }

export const assignAttribute = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { productId } = request.params as ProductIdParams
    const body = request.body as AssignAttributeBodyType
    sendCreated(reply, await service.assignAttributeToProduct(new ProductAssignedAttribute({ ...body, productId } as any)))
  }

export const updateAssignedAttribute = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.updateAssignedAttribute((request.params as IdParams).id, request.body as UpdateAssignedAttributeBodyType))
  }

export const removeAssignedAttribute = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await service.removeAssignedAttribute((request.params as IdParams).id)
    sendDeleted(reply)
  }

export const createAttributeOption = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id: productAssignedAttributeId } = request.params as IdParams
    const body = request.body as CreateAttributeOptionBodyType
    sendCreated(reply, await service.createAttributeOption(new ProductAttributeOption({ ...body, productAssignedAttributeId } as any)))
  }

export const listAttributeOptions = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listAttributeOptions((request.params as IdParams).id))
  }

// ── Product Specifications ────────────────────────────────────────────────────

export const createSpecification = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { productId } = request.params as ProductIdParams
    const body = request.body as CreateSpecificationBodyType
    sendCreated(reply, await service.saveProductSpecification(new ProductSpecification({ ...body, productId } as any)))
  }

export const listSpecifications = (service: IProductAttributeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listProductSpecifications((request.params as ProductIdParams).productId))
  }

// ── Product Variants ──────────────────────────────────────────────────────────

export const createVariant = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { productId } = request.params as ProductIdParams
    const body = request.body as CreateVariantBodyType
    sendCreated(reply, await service.createVariant(new ProductVariant({ ...body, productId } as any)))
  }

export const listVariants = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listProductVariants((request.params as ProductIdParams).productId))
  }

export const getVariantById = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getVariantById((request.params as IdParams).id))
  }

export const getVariantBySku = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getVariantBySku((request.params as SkuParams).sku))
  }

export const updateVariant = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.updateVariant((request.params as IdParams).id, request.body as UpdateVariantBodyType))
  }

export const updateStock = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { stockQuantity } = request.body as StockBodyType
    sendOk(reply, await service.updateStock(id, stockQuantity))
  }

export const reserveStock = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { quantity } = request.body as ReserveBodyType
    sendOk(reply, await service.reserveStock(id, quantity))
  }

export const setVariantAttributes = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id: variantId } = request.params as IdParams
    const items = request.body as SetVariantAttributesBodyType
    const values = items.map((item) => new VariantAttributeValue({ ...item, variantId } as any))
    sendOk(reply, await service.setVariantAttributes(variantId, values))
  }

export const deactivateVariant = (service: IProductVariantService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.deactivateVariant((request.params as IdParams).id))
  }
