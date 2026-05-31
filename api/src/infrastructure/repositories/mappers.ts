import { AnalyticsDaily } from '../../core/entities/analytics.js'
import { Attachment } from '../../core/entities/attachment.js'
import { Category, CategoryType } from '../../core/entities/catalog.js'
import { Cart, CartItem, Order, OrderItem, Review } from '../../core/entities/commerce.js'
import { ShippingMethod, SiteConfig } from '../../core/entities/config.js'
import { SpecialOffer } from '../../core/entities/offer.js'
import {
  Product,
  ProductAssignedAttribute,
  ProductAttribute,
  ProductAttributeOption,
  ProductSpecification,
  ProductVariant,
  VariantAttributeValue,
} from '../../core/entities/product.js'
import { UiContent } from '../../core/entities/ui-content.js'
import { User } from '../../core/entities/user.js'

const numberOrNull = (value: unknown): number | null => value === null || value === undefined ? null : Number(value)
const numberOrZero = (value: unknown): number => value === null || value === undefined ? 0 : Number(value)

export const row = <T extends object>(entity: Partial<T>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(entity as Record<string, unknown>).filter(([, value]) => value !== undefined && typeof value !== 'function'))

export const mappers = {
  user: {
    toDomain: (data: any): User => new User(data),
    toRow: row<User>,
  },
  attachment: {
    toDomain: (data: any): Attachment => new Attachment(data),
    toRow: row<Attachment>,
  },
  categoryType: {
    toDomain: (data: any): CategoryType => new CategoryType(data),
    toRow: row<CategoryType>,
  },
  category: {
    toDomain: (data: any): Category => new Category(data),
    toRow: row<Category>,
  },
  product: {
    toDomain: (data: any): Product => new Product({
      ...data,
      basePrice: Number(data.basePrice),
      compareAtPrice: numberOrNull(data.compareAtPrice),
      tags: data.tagsJson ?? data.tags ?? [],
    }),
    toRow: (entity: Partial<Product>) => {
      const output = row<Product>(entity)
      if (entity.tags !== undefined) {
        output.tagsJson = entity.tags
        delete output.tags
      }
      return output
    },
  },
  productAttribute: {
    toDomain: (data: any): ProductAttribute => new ProductAttribute(data),
    toRow: row<ProductAttribute>,
  },
  productAssignedAttribute: {
    toDomain: (data: any): ProductAssignedAttribute => new ProductAssignedAttribute(data),
    toRow: row<ProductAssignedAttribute>,
  },
  productAttributeOption: {
    toDomain: (data: any): ProductAttributeOption => new ProductAttributeOption(data),
    toRow: row<ProductAttributeOption>,
  },
  productSpecification: {
    toDomain: (data: any): ProductSpecification => new ProductSpecification(data),
    toRow: row<ProductSpecification>,
  },
  productVariant: {
    toDomain: (data: any): ProductVariant => new ProductVariant({ ...data, priceOverride: numberOrNull(data.priceOverride) }),
    toRow: row<ProductVariant>,
  },
  variantAttributeValue: {
    toDomain: (data: any): VariantAttributeValue => new VariantAttributeValue(data),
    toRow: row<VariantAttributeValue>,
  },
  cart: {
    toDomain: (data: any): Cart => new Cart(data),
    toRow: row<Cart>,
  },
  cartItem: {
    toDomain: (data: any): CartItem => new CartItem({ ...data, priceAtTime: Number(data.priceAtTime) }),
    toRow: row<CartItem>,
  },
  order: {
    toDomain: (data: any): Order => new Order({
      ...data,
      subtotal: numberOrZero(data.subtotal),
      discountAmount: numberOrZero(data.discountAmount),
      shippingAmount: numberOrZero(data.shippingAmount),
      totalAmount: numberOrZero(data.totalAmount),
    }),
    toRow: row<Order>,
  },
  orderItem: {
    toDomain: (data: any): OrderItem => new OrderItem({
      ...data,
      variantSnapshot: data.variantSnapshotJson ?? data.variantSnapshot,
      unitPrice: Number(data.unitPrice),
      totalPrice: Number(data.totalPrice),
    }),
    toRow: (entity: Partial<OrderItem>) => {
      const output = row<OrderItem>(entity)
      if (entity.variantSnapshot !== undefined) {
        output.variantSnapshotJson = entity.variantSnapshot
        delete output.variantSnapshot
      }
      return output
    },
  },
  review: {
    toDomain: (data: any): Review => new Review(data),
    toRow: row<Review>,
  },
  specialOffer: {
    toDomain: (data: any): SpecialOffer => new SpecialOffer({ ...data, discountValue: Number(data.discountValue) }),
    toRow: row<SpecialOffer>,
  },
  siteConfig: {
    toDomain: (data: any): SiteConfig => new SiteConfig({
      ...data,
      freeShippingThreshold: numberOrZero(data.freeShippingThreshold),
      socialLinks: data.socialLinks ?? {},
      socialLinksVisible: data.socialLinksVisible ?? {},
      filterMinPrice: numberOrZero(data.filterMinPrice),
      filterMaxPrice: numberOrZero(data.filterMaxPrice),
      sortOptions: Array.isArray(data.sortOptions) ? data.sortOptions : [],
    }),
    toRow: row<SiteConfig>,
  },
  shippingMethod: {
    toDomain: (data: any): ShippingMethod => new ShippingMethod({
      ...data,
      baseRate: numberOrZero(data.baseRate),
      freeShippingThreshold: numberOrNull(data.freeShippingThreshold),
    }),
    toRow: row<ShippingMethod>,
  },
  uiContent: {
    toDomain: (data: any): UiContent => new UiContent({ ...data, payload: data.payload ?? {} }),
    toRow: row<UiContent>,
  },
  analyticsDaily: {
    toDomain: (data: any): AnalyticsDaily => new AnalyticsDaily({
      ...data,
      revenue: numberOrZero(data.revenue),
      orderCount: Number(data.orderCount ?? 0),
      unitCount: Number(data.unitCount ?? 0),
      newCustomers: Number(data.newCustomers ?? 0),
    }),
    toRow: row<AnalyticsDaily>,
  },
}
