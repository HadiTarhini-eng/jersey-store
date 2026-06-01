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
const imageUrl = (col = 'image_url') => varchar(col, { length: 2048 })

export const users = pgTable('users', {
  id: id(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 40 }),
  role: varchar('role', { length: 50 }).notNull().default('User'),
  profileImageUrl: imageUrl('profile_image_url'),
  // Saved default shipping address (AddressSnapshot shape). Optional — set by
  // the customer at checkout ("save my info") or from their profile.
  shippingAddress: jsonb('shipping_address').$type<Record<string, unknown>>(),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// Product gallery — many attachments belong to one product, ordered by sortOrder.
// The first row (lowest sortOrder) is the primary/cover image.
export const attachments = pgTable('attachments', {
  id: id(),
  productId: ref('product_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 2048 }).notNull(),
  compressedFileUrl: varchar('compressed_file_url', { length: 2048 }),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
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
  imageUrl: imageUrl('image_url'),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// Primary image is the lowest-sortOrder attachment (no FK column needed).
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
  // Compare-at price (MSRP). When set and > basePrice, the product is on sale and
  // the storefront renders this value struck-through next to basePrice.
  compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
  // Gates the custom name/number print inputs on the product detail page.
  printable: boolean('printable').notNull().default(false),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  featured: boolean('featured').notNull().default(false),
  searchVector: text('search_vector'),
  createdBy: ref('created_by').notNull(),
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
  imageUrl: imageUrl('image_url'),
  // Admin-controlled storefront visibility. Independent of `isActive`
  // (soft-delete). Hidden sizes don't render in the variant picker.
  isVisible: boolean('is_visible').notNull().default(true),
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
  // Optional printing fields — only populated when the parent product has
  // `printable=true`. Service-side validation rejects them otherwise.
  customName: varchar('custom_name', { length: 40 }),
  customNumber: varchar('custom_number', { length: 8 }),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const orders = pgTable('orders', {
  id: id(),
  // Nullable to support guest checkout — when null, the buyer is identified by
  // `guestEmail` + the shipping address contact fields.
  userId: ref('user_id'),
  guestEmail: varchar('guest_email', { length: 320 }),
  orderNumber: varchar('order_number', { length: 80 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('pending'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  // Code of the coupon applied to this order (denormalized from the ui_content
  // coupon slot at submit time). Optional. Stored alongside discountAmount so
  // fulfillment / receipts have the redemption history without joins.
  couponCode: varchar('coupon_code', { length: 80 }),
  // Number of items the coupon was applied to on this order. Used by the
  // coupon service to enforce the per-user item cap across multiple orders
  // (`itemsAllowedPerUser` on the coupon payload). 0 when no coupon was used.
  couponItemsApplied: integer('coupon_items_applied').notNull().default(0),
  shippingAmount: numeric('shipping_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  shippingAddress: jsonb('shipping_address').$type<Record<string, unknown>>().notNull(),
  billingAddress: jsonb('billing_address').$type<Record<string, unknown>>().notNull(),
  placedAt: timestamp('placed_at'),
  // When the admin moves the order to `cancelled`, they must supply a reason.
  // Stored here so the customer's order detail page can render the explanation
  // (and any suggestions) as a message from the shop.
  rejectionReason: varchar('rejection_reason', { length: 1000 }),
  // Timestamp the customer last read the admin's rejection message. NULL
  // means there's an unread message — drives the envelope-with-dot indicator
  // on the customer's orders page.
  adminMessageReadAt: timestamp('admin_message_read_at'),
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
  // Snapshotted printing fields — copied from the cart item at order time.
  customName: varchar('custom_name', { length: 40 }),
  customNumber: varchar('custom_number', { length: 8 }),
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
  bannerUrl: imageUrl('banner_url'),
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

// Single-row table keyed by `slug` (e.g. 'default'). Site-wide UI/storefront config.
export const siteConfig = pgTable('site_config', {
  id: id(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  tagline: varchar('tagline', { length: 255 }),
  description: text('description'),
  logoUrl: imageUrl('logo_url'),
  email: varchar('email', { length: 320 }),
  phone: varchar('phone', { length: 40 }),
  currency: varchar('currency', { length: 8 }).notNull().default('USD'),
  freeShippingThreshold: numeric('free_shipping_threshold', { precision: 12, scale: 2 }).notNull().default('0'),
  // Flat delivery fee charged at checkout when the order is below the free
  // shipping threshold. Admin-configurable; waived by a free-delivery coupon.
  shippingFee: numeric('shipping_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  socialLinks: jsonb('social_links').$type<Record<string, string>>().notNull().default({}),
  // Per-social visibility toggles, keyed by platform (instagram, whatsapp, …).
  // Missing keys default to "visible" on the client, so admins only flip a
  // toggle when they want a social hidden everywhere it renders.
  socialLinksVisible: jsonb('social_links_visible').$type<Record<string, boolean>>().notNull().default({}),
  // Hero CTA ("Design Your Own") — single CTA shown on every hero slide.
  heroDesignYourOwnLabel: varchar('hero_design_your_own_label', { length: 80 }),
  heroDesignYourOwnHref: varchar('hero_design_your_own_href', { length: 255 }),
  // Storefront filter envelope: client uses these to bound the price slider
  // and render the sort dropdown. Both renderable without an extra round-trip.
  filterMinPrice: numeric('filter_min_price', { precision: 12, scale: 2 }).notNull().default('0'),
  filterMaxPrice: numeric('filter_max_price', { precision: 12, scale: 2 }).notNull().default('1000'),
  sortOptions: jsonb('sort_options').$type<{ value: string; label: string }[]>().notNull().default([]),
  // Empty-cart copy: drives both the drawer and the full-page cart on mobile.
  cartEmptyMessage: varchar('cart_empty_message', { length: 255 }),
  cartEmptyCtaLabel: varchar('cart_empty_cta_label', { length: 80 }),
  cartEmptyCtaHref: varchar('cart_empty_cta_href', { length: 255 }),
  // Per-section visibility for the storefront homepage. Keyed map (e.g.
  // `{ "shop-by-sport": false }`) so future toggles can be added without a
  // schema change. Missing keys default to "visible" on the client.
  homepageSectionsVisible: jsonb('homepage_sections_visible').$type<Record<string, boolean>>().notNull().default({}),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const shippingMethods = pgTable('shipping_methods', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  baseRate: numeric('base_rate', { precision: 12, scale: 2 }).notNull().default('0'),
  freeShippingThreshold: numeric('free_shipping_threshold', { precision: 12, scale: 2 }),
  estimatedDaysMin: integer('estimated_days_min'),
  estimatedDaysMax: integer('estimated_days_max'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// Generic CMS-like UI content store. `slot` partitions content kinds
// (hero-slide, offer-banner, sport, team, kit-category, ...). `payload`
// is the slot-specific shape — typed only on the client side.
export const uiContent = pgTable('ui_content', {
  id: id(),
  slot: varchar('slot', { length: 60 }).notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  imageUrl: imageUrl('image_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// Pre-computed per-day analytics snapshot. Recomputed when orders change.
export const analyticsDaily = pgTable('analytics_daily', {
  id: id(),
  day: varchar('day', { length: 10 }).notNull().unique(), // ISO YYYY-MM-DD
  revenue: numeric('revenue', { precision: 14, scale: 2 }).notNull().default('0'),
  orderCount: integer('order_count').notNull().default(0),
  unitCount: integer('unit_count').notNull().default(0),
  newCustomers: integer('new_customers').notNull().default(0),
  isActive: active(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export default users
