import { type Guid } from '../entities/base.js'
import {
  type Product,
  type ProductAssignedAttribute,
  type ProductAttribute,
  type ProductAttributeOption,
  type ProductSpecification,
  type ProductStatus,
  type ProductVariant,
  type VariantAttributeValue,
} from '../entities/product.js'

export interface ProductSearchFilters {
  categoryId?: Guid
  status?: ProductStatus
  featured?: boolean
  brand?: string
  attributeOptionIds?: Guid[]
  minPrice?: number
  maxPrice?: number
  query?: string
}

export interface IProductService {
  createProduct: (product: Product) => Promise<Product>
  updateProduct: (id: Guid, data: Partial<Product>) => Promise<Product>
  getProductById: (id: Guid) => Promise<Product | null>
  getProductBySlug: (slug: string) => Promise<Product | null>
  searchProducts: (filters?: ProductSearchFilters) => Promise<Product[]>
  publishProduct: (id: Guid) => Promise<Product>
  archiveProduct: (id: Guid) => Promise<Product>
  setFeatured: (id: Guid, featured: boolean) => Promise<Product>
  updateBasePrice: (id: Guid, basePrice: number) => Promise<Product>
  deleteProduct: (id: Guid) => Promise<void>
}

export interface IProductAttributeService {
  createAttribute: (attribute: ProductAttribute) => Promise<ProductAttribute>
  updateAttribute: (id: Guid, data: Partial<ProductAttribute>) => Promise<ProductAttribute>
  listAttributes: () => Promise<ProductAttribute[]>
  assignAttributeToProduct: (assignedAttribute: ProductAssignedAttribute) => Promise<ProductAssignedAttribute>
  updateAssignedAttribute: (id: Guid, data: Partial<ProductAssignedAttribute>) => Promise<ProductAssignedAttribute>
  removeAssignedAttribute: (id: Guid) => Promise<void>
  createAttributeOption: (option: ProductAttributeOption) => Promise<ProductAttributeOption>
  listAttributeOptions: (productAssignedAttributeId: Guid) => Promise<ProductAttributeOption[]>
  saveProductSpecification: (specification: ProductSpecification) => Promise<ProductSpecification>
  listProductSpecifications: (productId: Guid) => Promise<ProductSpecification[]>
}

export interface IProductVariantService {
  createVariant: (variant: ProductVariant) => Promise<ProductVariant>
  updateVariant: (id: Guid, data: Partial<ProductVariant>) => Promise<ProductVariant>
  getVariantById: (id: Guid) => Promise<ProductVariant | null>
  getVariantBySku: (sku: string) => Promise<ProductVariant | null>
  listProductVariants: (productId: Guid) => Promise<ProductVariant[]>
  setVariantAttributes: (variantId: Guid, values: VariantAttributeValue[]) => Promise<VariantAttributeValue[]>
  updateStock: (id: Guid, stockQuantity: number) => Promise<ProductVariant>
  reserveStock: (id: Guid, quantity: number) => Promise<ProductVariant>
  deactivateVariant: (id: Guid) => Promise<ProductVariant>
}
