import {
  boolean,
  decimal,
  int,
  json,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'
import crypto from 'crypto'

const guid = (name: string) => varchar(name, { length: 36 })
const id = () => guid('id').$defaultFn(() => crypto.randomUUID()).primaryKey()
const active = () => boolean('is_active').notNull().default(true)
const createdAt = () => timestamp('created_at').notNull().defaultNow()
const updatedAt = () => timestamp('updated_at').notNull().defaultNow().onUpdateNow()

export const users = mysqlTable('users', {
  id: id(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 40 }),
  role: varchar('role', { length: 50 }).notNull().default('User'),
  profileImageId: guid('profile_image_id'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const attachments = mysqlTable('attachments', {
  id: id(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 2048 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: int('file_size').notNull(),
  uploadedBy: guid('uploaded_by').notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const categoryTypes = mysqlTable('category_types', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  description: text('description'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const categories = mysqlTable('categories', {
  id: id(),
  categoryTypeId: guid('category_type_id').notNull(),
  parentId: guid('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  description: text('description'),
  imageId: guid('image_id'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const products = mysqlTable('products', {
  id: id(),
  categoryId: guid('category_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull().unique(),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  tagsJson: json('tags_json').$type<string[]>(),
  brand: varchar('brand', { length: 120 }),
  basePrice: decimal('base_price', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  featured: boolean('featured').notNull().default(false),
  searchVector: text('search_vector'),
  createdBy: guid('created_by').notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productAttributes = mysqlTable('product_attributes', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(),
  isVariantable: boolean('is_variantable').notNull().default(false),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productAssignedAttributes = mysqlTable('product_assigned_attributes', {
  id: id(),
  productId: guid('product_id').notNull(),
  attributeId: guid('attribute_id').notNull(),
  isRequired: boolean('is_required').notNull().default(false),
  isFilterable: boolean('is_filterable').notNull().default(false),
  sortOrder: int('sort_order').notNull().default(0),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productAttributeOptions = mysqlTable('product_attribute_options', {
  id: id(),
  productAssignedAttributeId: guid('product_assigned_attribute_id').notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  metaData: json('meta_data').$type<Record<string, unknown>>(),
  sortOrder: int('sort_order').notNull().default(0),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productSpecifications = mysqlTable('product_specifications', {
  id: id(),
  productId: guid('product_id').notNull(),
  attributeId: guid('attribute_id').notNull(),
  value: text('value').notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productVariants = mysqlTable('product_variants', {
  id: id(),
  productId: guid('product_id').notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  priceOverride: decimal('price_override', { precision: 12, scale: 2 }),
  stockQuantity: int('stock_quantity').notNull().default(0),
  imageId: guid('image_id'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const variantAttributeValues = mysqlTable('variant_attribute_values', {
  id: id(),
  variantId: guid('variant_id').notNull(),
  attributeId: guid('attribute_id').notNull(),
  attributeOptionId: guid('attribute_option_id').notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const carts = mysqlTable('carts', {
  id: id(),
  userId: guid('user_id').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const cartItems = mysqlTable('cart_items', {
  id: id(),
  cartId: guid('cart_id').notNull(),
  productVariantId: guid('product_variant_id').notNull(),
  quantity: int('quantity').notNull(),
  priceAtTime: decimal('price_at_time', { precision: 12, scale: 2 }).notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const orders = mysqlTable('orders', {
  id: id(),
  userId: guid('user_id').notNull(),
  orderNumber: varchar('order_number', { length: 80 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('pending'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  shippingAddress: json('shipping_address').$type<Record<string, unknown>>().notNull(),
  billingAddress: json('billing_address').$type<Record<string, unknown>>().notNull(),
  placedAt: timestamp('placed_at'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const orderItems = mysqlTable('order_items', {
  id: id(),
  orderId: guid('order_id').notNull(),
  productVariantId: guid('product_variant_id').notNull(),
  productTitleSnapshot: varchar('product_title_snapshot', { length: 255 }).notNull(),
  variantSnapshotJson: json('variant_snapshot_json').$type<Record<string, unknown>>().notNull(),
  quantity: int('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const reviews = mysqlTable('reviews', {
  id: id(),
  userId: guid('user_id').notNull(),
  productId: guid('product_id').notNull(),
  rating: int('rating').notNull(),
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const specialOffers = mysqlTable('special_offers', {
  id: id(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 50 }).notNull(),
  discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  bannerAttachmentId: guid('banner_attachment_id'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const offerProducts = mysqlTable(
  'offer_products',
  {
    offerId: guid('offer_id').notNull(),
    productId: guid('product_id').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.offerId, table.productId] }),
  }),
)

export default users
