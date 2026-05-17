import {
  boolean,
  numeric,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

const id = () => uuid('id').defaultRandom().primaryKey()
const ref = (name: string) => uuid(name)
const active = () => boolean('is_active').notNull().default(true)
const createdAt = () => timestamp('created_at').notNull().defaultNow()
const updatedAt = () => timestamp('updated_at').notNull().defaultNow()

export const users = pgTable('users', {
  id: id(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 40 }),
  role: varchar('role', { length: 50 }).notNull().default('User'),
  profileImageId: ref('profile_image_id'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const attachments = pgTable('attachments', {
  id: id(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 2048 }).notNull(),
  compressedFileUrl: varchar('compressed_file_url', { length: 2048 }),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  uploadedBy: ref('uploaded_by').notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const categoryTypes = pgTable('category_types', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  description: text('description'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const categories = pgTable('categories', {
  id: id(),
  categoryTypeId: ref('category_type_id').notNull(),
  parentId: ref('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  description: text('description'),
  imageId: ref('image_id'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const products = pgTable('products', {
  id: id(),
  categoryId: ref('category_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull().unique(),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  tagsJson: jsonb('tags_json').$type<string[]>(),
  brand: varchar('brand', { length: 120 }),
  basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  featured: boolean('featured').notNull().default(false),
  searchVector: text('search_vector'),
  imageId: ref('image_id'),
  createdBy: ref('created_by').notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productImages = pgTable('product_images', {
  id: id(),
  productId: ref('product_id').notNull(),
  attachmentId: ref('attachment_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productAttributes = pgTable('product_attributes', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(),
  isVariantable: boolean('is_variantable').notNull().default(false),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productAssignedAttributes = pgTable('product_assigned_attributes', {
  id: id(),
  productId: ref('product_id').notNull(),
  attributeId: ref('attribute_id').notNull(),
  isRequired: boolean('is_required').notNull().default(false),
  isFilterable: boolean('is_filterable').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productAttributeOptions = pgTable('product_attribute_options', {
  id: id(),
  productAssignedAttributeId: ref('product_assigned_attribute_id').notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  metaData: jsonb('meta_data').$type<Record<string, unknown>>(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productSpecifications = pgTable('product_specifications', {
  id: id(),
  productId: ref('product_id').notNull(),
  attributeId: ref('attribute_id').notNull(),
  value: text('value').notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productVariants = pgTable('product_variants', {
  id: id(),
  productId: ref('product_id').notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  priceOverride: numeric('price_override', { precision: 12, scale: 2 }),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  imageId: ref('image_id'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const variantAttributeValues = pgTable('variant_attribute_values', {
  id: id(),
  variantId: ref('variant_id').notNull(),
  attributeId: ref('attribute_id').notNull(),
  attributeOptionId: ref('attribute_option_id').notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const carts = pgTable('carts', {
  id: id(),
  userId: ref('user_id').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const cartItems = pgTable('cart_items', {
  id: id(),
  cartId: ref('cart_id').notNull(),
  productVariantId: ref('product_variant_id').notNull(),
  quantity: integer('quantity').notNull(),
  priceAtTime: numeric('price_at_time', { precision: 12, scale: 2 }).notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const orders = pgTable('orders', {
  id: id(),
  userId: ref('user_id').notNull(),
  orderNumber: varchar('order_number', { length: 80 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('pending'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  shippingAmount: numeric('shipping_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  shippingAddress: jsonb('shipping_address').$type<Record<string, unknown>>().notNull(),
  billingAddress: jsonb('billing_address').$type<Record<string, unknown>>().notNull(),
  placedAt: timestamp('placed_at'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const orderItems = pgTable('order_items', {
  id: id(),
  orderId: ref('order_id').notNull(),
  productVariantId: ref('product_variant_id').notNull(),
  productTitleSnapshot: varchar('product_title_snapshot', { length: 255 }).notNull(),
  variantSnapshotJson: jsonb('variant_snapshot_json').$type<Record<string, unknown>>().notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const reviews = pgTable('reviews', {
  id: id(),
  userId: ref('user_id').notNull(),
  productId: ref('product_id').notNull(),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const specialOffers = pgTable('special_offers', {
  id: id(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 50 }).notNull(),
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  bannerAttachmentId: ref('banner_attachment_id'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const offerProducts = pgTable(
  'offer_products',
  {
    offerId: ref('offer_id').notNull(),
    productId: ref('product_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.offerId, table.productId] }),
  ],
)

export default users
