import { type Guid } from '../../core/entities/base.js'
import {
  Product,
  ProductImage,
  ProductVariant,
  type ProductAssignedAttribute,
  type ProductAttribute,
  type ProductAttributeOption,
  type ProductSpecification,
  type VariantAttributeValue,
} from '../../core/entities/product.js'
import { type IAttachmentService } from '../../core/services/attachment.svc.js'
import {
  type CreateProductInput,
  type CreateVariantInput,
  type IProductAttributeService,
  type IProductService,
  type IProductVariantService,
  type ProductImageFile,
  type ProductSearchFilters,
} from '../../core/services/product.svc.js'
import { type ImageFile } from '../../core/services/storage.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ConflictError, ValidationError } from './errors.js'
import { assertAllowed, assertGuid, assertInteger, assertNonNegativeNumber, assertRequiredString, assertSlug } from './validators.js'

const productStatuses = ['draft', 'active', 'archived'] as const
const attributeTypes = ['text', 'number', 'boolean', 'select', 'multiselect', 'color', 'date'] as const

export class ProductService implements IProductService {
  constructor(
    private readonly productRepository: EntityRepository<Product>,
    private readonly productImageRepository: EntityRepository<ProductImage>,
    private readonly attachmentService: IAttachmentService,
  ) {}

  async createProduct(input: CreateProductInput): Promise<Product> {
    assertGuid(input.createdBy, 'createdBy')
    assertGuid(input.data.categoryId, 'categoryId')
    assertRequiredString(input.data.title, 'title')
    assertSlug(input.data.slug)
    assertNonNegativeNumber(input.data.basePrice, 'basePrice')
    if (input.data.status !== undefined) assertAllowed(input.data.status, productStatuses, 'status')
    await this.assertUniqueSlug(input.data.slug)

    let imageId: Guid | null = null
    if (input.primary) {
      const attachment = await this.attachmentService.uploadAttachment({
        data: input.primary.data,
        fileName: input.primary.fileName,
        mimeType: input.primary.mimeType,
        uploadedBy: input.createdBy,
      })
      imageId = attachment.id
    }

    const product = new Product({ ...input.data, createdBy: input.createdBy, imageId })
    await this.productRepository.create(product)

    if (input.gallery && input.gallery.length > 0) {
      for (let i = 0; i < input.gallery.length; i++) {
        await this.addProductImage(product.id, input.gallery[i]!, i)
      }
    }

    return product
  }

  async addProductImage(productId: Guid, file: ProductImageFile, sortOrder = 0): Promise<ProductImage> {
    assertGuid(productId, 'productId')
    const product = await this.productRepository.require(productId, 'Product')
    const attachment = await this.attachmentService.uploadAttachment({
      data: file.data,
      fileName: file.fileName,
      mimeType: file.mimeType,
      uploadedBy: product.createdBy,
    })
    const image = new ProductImage({ productId, attachmentId: attachment.id, sortOrder })
    return this.productImageRepository.create(image)
  }

  async listProductImages(productId: Guid): Promise<ProductImage[]> {
    assertGuid(productId, 'productId')
    return this.productImageRepository.listBy('productId', productId)
  }

  async removeProductImage(productImageId: Guid): Promise<void> {
    assertGuid(productImageId, 'productImageId')
    const image = await this.productImageRepository.require(productImageId, 'Product image')
    await this.productImageRepository.delete(productImageId)
    await this.attachmentService.deleteAttachment(image.attachmentId)
  }

  async updateProduct(id: Guid, data: Partial<Product>): Promise<Product> {
    assertGuid(id)
    if (data.slug) {
      assertSlug(data.slug)
      await this.assertUniqueSlug(data.slug, id)
    }
    if (data.categoryId) assertGuid(data.categoryId, 'categoryId')
    if (data.title !== undefined) assertRequiredString(data.title, 'title')
    if (data.basePrice !== undefined) assertNonNegativeNumber(data.basePrice, 'basePrice')
    if (data.status !== undefined) assertAllowed(data.status, productStatuses, 'status')
    return this.productRepository.update(id, data)
  }

  async getProductById(id: Guid): Promise<Product | null> {
    assertGuid(id)
    return this.productRepository.get(id)
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    assertSlug(slug)
    return this.productRepository.findBy('slug', slug)
  }

  async searchProducts(filters: ProductSearchFilters = {}): Promise<Product[]> {
    if (filters.categoryId) assertGuid(filters.categoryId, 'categoryId')
    if (filters.minPrice !== undefined) assertNonNegativeNumber(filters.minPrice, 'minPrice')
    if (filters.maxPrice !== undefined) assertNonNegativeNumber(filters.maxPrice, 'maxPrice')
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
      throw new ValidationError('minPrice cannot be greater than maxPrice')
    }
    const products = await this.productRepository.list()
    const query = filters.query?.trim().toLowerCase()
    return products.filter((product) => {
      if (filters.categoryId !== undefined && product.categoryId !== filters.categoryId) return false
      if (filters.status !== undefined && product.status !== filters.status) return false
      if (filters.featured !== undefined && product.featured !== filters.featured) return false
      if (filters.brand !== undefined && product.brand !== filters.brand) return false
      if (filters.minPrice !== undefined && product.basePrice < filters.minPrice) return false
      if (filters.maxPrice !== undefined && product.basePrice > filters.maxPrice) return false
      if (!query) return true
      return [product.title, product.shortDescription, product.fullDescription, product.brand, product.searchVector, ...product.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }

  async publishProduct(id: Guid): Promise<Product> {
    assertGuid(id)
    const product = await this.productRepository.require(id, 'Product')
    if (!product.isActive) throw new ValidationError('Inactive product cannot be published')
    return this.productRepository.update(id, { status: 'active' } as Partial<Product>)
  }

  async archiveProduct(id: Guid): Promise<Product> {
    assertGuid(id)
    return this.productRepository.update(id, { status: 'archived', isActive: false } as Partial<Product>)
  }

  async setFeatured(id: Guid, featured: boolean): Promise<Product> {
    assertGuid(id)
    const product = await this.productRepository.require(id, 'Product')
    if (featured && product.status !== 'active') throw new ValidationError('Only active products can be featured')
    return this.productRepository.update(id, { featured } as Partial<Product>)
  }

  async updateBasePrice(id: Guid, basePrice: number): Promise<Product> {
    assertGuid(id)
    assertNonNegativeNumber(basePrice, 'basePrice')
    return this.productRepository.update(id, { basePrice } as Partial<Product>)
  }

  async deleteProduct(id: Guid): Promise<void> {
    assertGuid(id)
    await this.productRepository.require(id, 'Product')
    await this.productRepository.delete(id)
  }

  private async assertUniqueSlug(slug: string, exceptId?: Guid): Promise<void> {
    const existing = await this.productRepository.findBy('slug', slug)
    if (existing && existing.id !== exceptId) throw new ConflictError('Product slug already exists')
  }
}

export class ProductAttributeService implements IProductAttributeService {
  constructor(
    private readonly attributeRepository: EntityRepository<ProductAttribute>,
    private readonly assignedAttributeRepository: EntityRepository<ProductAssignedAttribute>,
    private readonly optionRepository: EntityRepository<ProductAttributeOption>,
    private readonly specificationRepository: EntityRepository<ProductSpecification>,
  ) {}

  async createAttribute(attribute: ProductAttribute): Promise<ProductAttribute> {
    this.validateAttribute(attribute)
    const existing = await this.attributeRepository.findBy('slug', attribute.slug)
    if (existing) throw new ConflictError('Attribute slug already exists')
    return this.attributeRepository.create(attribute)
  }

  async updateAttribute(id: Guid, data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    assertGuid(id)
    if (data.name !== undefined) assertRequiredString(data.name, 'name')
    if (data.slug !== undefined) assertSlug(data.slug)
    if (data.type !== undefined) assertAllowed(data.type, attributeTypes, 'type')
    return this.attributeRepository.update(id, data)
  }

  async listAttributes(): Promise<ProductAttribute[]> {
    return this.attributeRepository.list()
  }

  async assignAttributeToProduct(assignedAttribute: ProductAssignedAttribute): Promise<ProductAssignedAttribute> {
    this.validateAssignedAttribute(assignedAttribute)
    const existing = (await this.assignedAttributeRepository.list()).find((item) => item.productId === assignedAttribute.productId && item.attributeId === assignedAttribute.attributeId)
    if (existing) throw new ConflictError('Attribute is already assigned to this product')
    return this.assignedAttributeRepository.create(assignedAttribute)
  }

  async updateAssignedAttribute(id: Guid, data: Partial<ProductAssignedAttribute>): Promise<ProductAssignedAttribute> {
    assertGuid(id)
    if (data.sortOrder !== undefined) {
      assertInteger(data.sortOrder, 'sortOrder')
      assertNonNegativeNumber(data.sortOrder, 'sortOrder')
    }
    return this.assignedAttributeRepository.update(id, data)
  }

  async removeAssignedAttribute(id: Guid): Promise<void> {
    assertGuid(id)
    await this.assignedAttributeRepository.require(id, 'Product assigned attribute')
    await this.assignedAttributeRepository.delete(id)
  }

  async createAttributeOption(option: ProductAttributeOption): Promise<ProductAttributeOption> {
    this.validateOption(option)
    await this.assignedAttributeRepository.require(option.productAssignedAttributeId, 'Product assigned attribute')
    return this.optionRepository.create(option)
  }

  async listAttributeOptions(productAssignedAttributeId: Guid): Promise<ProductAttributeOption[]> {
    assertGuid(productAssignedAttributeId, 'productAssignedAttributeId')
    return this.optionRepository.listBy('productAssignedAttributeId', productAssignedAttributeId)
  }

  async saveProductSpecification(specification: ProductSpecification): Promise<ProductSpecification> {
    this.validateSpecification(specification)
    const existing = (await this.specificationRepository.list()).find((item) => item.productId === specification.productId && item.attributeId === specification.attributeId)
    if (existing) return this.specificationRepository.update(existing.id, { value: specification.value } as Partial<ProductSpecification>)
    return this.specificationRepository.create(specification)
  }

  async listProductSpecifications(productId: Guid): Promise<ProductSpecification[]> {
    assertGuid(productId, 'productId')
    return this.specificationRepository.listBy('productId', productId)
  }

  private validateAttribute(attribute: ProductAttribute): void {
    assertGuid(attribute.id)
    assertRequiredString(attribute.name, 'name')
    assertSlug(attribute.slug)
    assertAllowed(attribute.type, attributeTypes, 'type')
  }

  private validateAssignedAttribute(assignedAttribute: ProductAssignedAttribute): void {
    assertGuid(assignedAttribute.id)
    assertGuid(assignedAttribute.productId, 'productId')
    assertGuid(assignedAttribute.attributeId, 'attributeId')
    assertInteger(assignedAttribute.sortOrder, 'sortOrder')
    assertNonNegativeNumber(assignedAttribute.sortOrder, 'sortOrder')
  }

  private validateOption(option: ProductAttributeOption): void {
    assertGuid(option.id)
    assertGuid(option.productAssignedAttributeId, 'productAssignedAttributeId')
    assertRequiredString(option.value, 'value')
    assertInteger(option.sortOrder, 'sortOrder')
    assertNonNegativeNumber(option.sortOrder, 'sortOrder')
  }

  private validateSpecification(specification: ProductSpecification): void {
    assertGuid(specification.id)
    assertGuid(specification.productId, 'productId')
    assertGuid(specification.attributeId, 'attributeId')
    assertRequiredString(specification.value, 'value', 1000)
  }
}

export class ProductVariantService implements IProductVariantService {
  constructor(
    private readonly variantRepository: EntityRepository<ProductVariant>,
    private readonly valueRepository: EntityRepository<VariantAttributeValue>,
    private readonly attachmentService: IAttachmentService,
  ) {}

  async createVariant(input: CreateVariantInput): Promise<ProductVariant> {
    assertGuid(input.productId, 'productId')
    assertGuid(input.uploadedBy, 'uploadedBy')
    assertRequiredString(input.data.sku, 'sku', 100)
    if (input.data.priceOverride !== undefined && input.data.priceOverride !== null) assertNonNegativeNumber(input.data.priceOverride, 'priceOverride')
    if (input.data.stockQuantity !== undefined) {
      assertInteger(input.data.stockQuantity, 'stockQuantity')
      assertNonNegativeNumber(input.data.stockQuantity, 'stockQuantity')
    }
    await this.assertUniqueSku(input.data.sku)

    let imageId: Guid | null = null
    if (input.image) {
      const attachment = await this.attachmentService.uploadAttachment({
        data: input.image.data,
        fileName: input.image.fileName,
        mimeType: input.image.mimeType,
        uploadedBy: input.uploadedBy,
      })
      imageId = attachment.id
    }

    const variant = new ProductVariant({
      ...input.data,
      productId: input.productId,
      imageId,
      stockQuantity: input.data.stockQuantity ?? 0,
    })
    return this.variantRepository.create(variant)
  }

  async setVariantImage(id: Guid, file: ImageFile, uploadedBy: Guid): Promise<ProductVariant> {
    assertGuid(id)
    assertGuid(uploadedBy, 'uploadedBy')
    const variant = await this.variantRepository.require(id, 'Product variant')
    if (variant.imageId) {
      await this.attachmentService.deleteAttachment(variant.imageId).catch(() => undefined)
    }
    const attachment = await this.attachmentService.uploadAttachment({
      data: file.data,
      fileName: file.fileName,
      mimeType: file.mimeType,
      uploadedBy,
    })
    return this.variantRepository.update(id, { imageId: attachment.id } as Partial<ProductVariant>)
  }

  async removeVariantImage(id: Guid): Promise<ProductVariant> {
    assertGuid(id)
    const variant = await this.variantRepository.require(id, 'Product variant')
    if (variant.imageId) {
      await this.attachmentService.deleteAttachment(variant.imageId).catch(() => undefined)
    }
    return this.variantRepository.update(id, { imageId: null } as Partial<ProductVariant>)
  }

  async updateVariant(id: Guid, data: Partial<ProductVariant>): Promise<ProductVariant> {
    assertGuid(id)
    if (data.sku) await this.assertUniqueSku(data.sku, id)
    if (data.priceOverride !== undefined && data.priceOverride !== null) assertNonNegativeNumber(data.priceOverride, 'priceOverride')
    if (data.stockQuantity !== undefined) {
      assertInteger(data.stockQuantity, 'stockQuantity')
      assertNonNegativeNumber(data.stockQuantity, 'stockQuantity')
    }
    return this.variantRepository.update(id, data)
  }

  async getVariantById(id: Guid): Promise<ProductVariant | null> {
    assertGuid(id)
    return this.variantRepository.get(id)
  }

  async getVariantBySku(sku: string): Promise<ProductVariant | null> {
    assertRequiredString(sku, 'sku', 100)
    return this.variantRepository.findBy('sku', sku)
  }

  async listProductVariants(productId: Guid): Promise<ProductVariant[]> {
    assertGuid(productId, 'productId')
    return this.variantRepository.listBy('productId', productId)
  }

  async setVariantAttributes(variantId: Guid, values: VariantAttributeValue[]): Promise<VariantAttributeValue[]> {
    assertGuid(variantId, 'variantId')
    await this.variantRepository.require(variantId, 'Product variant')
    values.forEach((value) => this.validateVariantAttributeValue(value, variantId))
    const existing = await this.valueRepository.listBy('variantId', variantId)
    await Promise.all(existing.map((value) => this.valueRepository.delete(value.id)))
    await Promise.all(values.map((value) => this.valueRepository.create(value)))
    return values
  }

  async updateStock(id: Guid, stockQuantity: number): Promise<ProductVariant> {
    assertGuid(id)
    assertInteger(stockQuantity, 'stockQuantity')
    assertNonNegativeNumber(stockQuantity, 'stockQuantity')
    return this.variantRepository.update(id, { stockQuantity } as Partial<ProductVariant>)
  }

  async reserveStock(id: Guid, quantity: number): Promise<ProductVariant> {
    assertGuid(id)
    assertInteger(quantity, 'quantity')
    if (quantity <= 0) throw new ValidationError('quantity must be greater than 0')
    const variant = await this.variantRepository.require(id, 'Product variant')
    if (quantity > variant.stockQuantity) throw new ValidationError('Insufficient stock')
    return this.variantRepository.update(id, { stockQuantity: variant.stockQuantity - quantity } as Partial<ProductVariant>)
  }

  async deactivateVariant(id: Guid): Promise<ProductVariant> {
    assertGuid(id)
    return this.variantRepository.update(id, { isActive: false } as Partial<ProductVariant>)
  }

  private validateVariantAttributeValue(value: VariantAttributeValue, variantId: Guid): void {
    assertGuid(value.id)
    if (value.variantId !== variantId) throw new ValidationError('Variant attribute value does not belong to the variant')
    assertGuid(value.attributeId, 'attributeId')
    assertGuid(value.attributeOptionId, 'attributeOptionId')
  }

  private async assertUniqueSku(sku: string, exceptId?: Guid): Promise<void> {
    assertRequiredString(sku, 'sku', 100)
    const existing = await this.variantRepository.findBy('sku', sku)
    if (existing && existing.id !== exceptId) throw new ConflictError('Product variant sku already exists')
  }
}
