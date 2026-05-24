// ─────────────────────────────────────────────────────────────────────────────
// Global TypeScript definitions — single source of truth for all domain shapes.
//
// Entities mirror the backend Drizzle/TypeBox schemas under
// api/src/core/entities and api/src/infrastructure/http/schemas.
// `*Payload` types describe request bodies; bare entity types describe
// response bodies. Some entities carry optional UI-enrichment fields
// (e.g. Product.images / .variants / .rating) that the API service layer
// populates by stitching multiple endpoints together — these are not
// part of the raw backend response.
// ─────────────────────────────────────────────────────────────────────────────

export type Guid = string;
export type ISODate = string; // backend returns Dates as ISO strings over JSON

// ── Common base ──────────────────────────────────────────────────────────────

export interface BusinessEntity {
  id:        Guid;
  isActive:  boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ── Users / Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'Admin' | 'User';

export interface User extends BusinessEntity {
  firstName:        string;
  lastName:         string;
  email:            string;
  phone?:           string | null;
  role:             UserRole;
  profileImageUrl?: string | null;
}

export interface CreateUserPayload {
  firstName:        string;
  lastName:         string;
  email:            string;
  password:         string;
  phone?:           string;
  role:             UserRole;
  profileImageUrl?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?:  string;
  email?:     string;
  phone?:     string;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

/** UI-only — confirmPassword is checked client-side and stripped before sending. */
export interface RegisterCredentials {
  firstName:       string;
  lastName:        string;
  email:           string;
  phone:           string;
  password:        string;
  confirmPassword: string;
}

/** What POST /users/login returns. */
export interface LoginResponse {
  token: string;
}

// ── Catalog ──────────────────────────────────────────────────────────────────

export interface CategoryType extends BusinessEntity {
  name:         string;
  slug:         string;
  description?: string | null;
}

export interface Category extends BusinessEntity {
  categoryTypeId: Guid;
  parentId?:      Guid | null;
  name:           string;
  slug:           string;
  description?:   string | null;
  imageUrl?:      string | null;
}

export interface CreateCategoryTypePayload {
  name: string; slug: string; description?: string;
}
export interface UpdateCategoryTypePayload {
  name?: string; slug?: string; description?: string;
}

export interface CreateCategoryPayload {
  categoryTypeId: Guid;
  parentId?:      Guid;
  name:           string;
  slug:           string;
  description?:   string;
}
export interface UpdateCategoryPayload {
  categoryTypeId?: Guid;
  parentId?:       Guid;
  name?:           string;
  slug?:           string;
  description?:    string;
}

export interface ListCategoriesQuery {
  categoryTypeId?: Guid;
  parentId?:       Guid;
  isActive?:       boolean;
}

// ── Products ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'draft' | 'active' | 'archived';
export type ProductAttributeType =
  | 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'date';

export interface Product extends BusinessEntity {
  categoryId:        Guid;
  title:             string;
  slug:              string;
  shortDescription?: string | null;
  fullDescription?:  string | null;
  tags:              string[];
  brand?:            string | null;
  basePrice:         number;
  status:            ProductStatus;
  featured:          boolean;
  searchVector?:     string | null;
  createdBy:         Guid;

  // ── Optional UI-only enrichments (populated by service layer or future endpoint) ──
  images?:        string[];
  variants?:      ProductVariant[];
  rating?:        number;
  reviewCount?:   number;
  inStock?:       boolean;
  /** Compare-at price for "SALE" chip + struck-through display when set. */
  originalPrice?: number;
}

export interface CreateProductPayload {
  categoryId:        Guid;
  title:             string;
  slug:              string;
  shortDescription?: string;
  fullDescription?:  string;
  tags?:             string[];
  brand?:            string;
  basePrice:         number;
  status:            ProductStatus;
  featured?:         boolean;
  createdBy:         Guid;
  searchVector?:     string;
}
export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface ProductSearchQuery {
  query?:      string;
  categoryId?: Guid;
  status?:     ProductStatus;
  featured?:   boolean;
  brand?:      string;
  minPrice?:   number;
  maxPrice?:   number;
}

export interface ProductAttribute extends BusinessEntity {
  name:           string;
  slug:           string;
  type:           ProductAttributeType;
  isVariantable:  boolean;
}

export interface ProductAssignedAttribute extends BusinessEntity {
  productId:    Guid;
  attributeId:  Guid;
  isRequired:   boolean;
  isFilterable: boolean;
  sortOrder:    number;
}

export interface AssignAttributePayload {
  attributeId:   Guid;
  isRequired?:   boolean;
  isFilterable?: boolean;
  sortOrder?:    number;
}

export interface ProductAttributeOption extends BusinessEntity {
  productAssignedAttributeId: Guid;
  value:        string;
  metaData?:    Record<string, unknown> | null;
  sortOrder:    number;
}

export interface CreateAttributeOptionPayload {
  value:     string;
  label?:    string;
  metaData?: Record<string, unknown>;
  sortOrder?: number;
}

export interface ProductSpecification extends BusinessEntity {
  productId:   Guid;
  attributeId: Guid;
  value:       string;
}

export interface CreateSpecificationPayload {
  attributeId: Guid;
  value:       string;
}

export interface ProductVariant extends BusinessEntity {
  productId:      Guid;
  sku:            string;
  priceOverride?: number | null;
  stockQuantity:  number;
  imageUrl?:      string | null;
}

export interface CreateVariantPayload {
  sku:             string;
  priceOverride?:  number | null;
  stockQuantity?:  number;
}

export interface VariantAttributeValue extends BusinessEntity {
  variantId:         Guid;
  attributeId:       Guid;
  attributeOptionId: Guid;
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export type CartStatus = 'active' | 'converted' | 'abandoned';

export interface Cart extends BusinessEntity {
  userId: Guid;
  status: CartStatus;
}

export interface CartItem extends BusinessEntity {
  cartId:           Guid;
  productVariantId: Guid;
  quantity:         number;
  priceAtTime:      number;

  // Optional UI enrichments populated by the service layer when listing items
  productTitle?: string;
  image?:        string;
  variantLabel?: string; // e.g. "Size: L" — derived from VariantAttributeValue
  maxStock?:     number;
}

export interface CreateCartPayload {
  userId: Guid;
  status?: CartStatus;
}

export interface AddCartItemPayload {
  productVariantId: Guid;
  quantity:         number;
  priceAtTime:      number;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentStatus =
  | 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

export interface AddressSnapshot {
  fullName:      string;
  phone:         string;
  addressLine1:  string;
  addressLine2?: string | null;
  city:          string;
  state?:        string | null;
  country:       string;
  postalCode?:   string | null;
}

export interface Order extends BusinessEntity {
  userId:          Guid;
  orderNumber:     string;
  status:          OrderStatus;
  paymentStatus:   PaymentStatus;
  subtotal:        number;
  discountAmount:  number;
  shippingAmount:  number;
  totalAmount:     number;
  shippingAddress: AddressSnapshot;
  billingAddress:  AddressSnapshot;
  placedAt?:       ISODate | null;
}

export interface OrderItem extends BusinessEntity {
  orderId:              Guid;
  productVariantId:     Guid;
  productTitleSnapshot: string;
  variantSnapshot:      Record<string, unknown>;
  quantity:             number;
  unitPrice:            number;
  totalPrice:           number;
}

export interface CreateOrderItemPayload {
  productVariantId:     Guid;
  productTitleSnapshot: string;
  variantSnapshot?:     Record<string, unknown>;
  quantity:             number;
  unitPrice:            number;
}

export interface CreateOrderBody {
  userId:          Guid;
  orderNumber:     string;
  subtotal:        number;
  discountAmount?: number;
  shippingAmount?: number;
  totalAmount?:    number;
  shippingAddress: AddressSnapshot;
  billingAddress:  AddressSnapshot;
}

/** Backend expects `{ order, items }`. */
export interface CreateOrderPayload {
  order: CreateOrderBody;
  items: CreateOrderItemPayload[];
}

export type CheckoutStep = 'shipping' | 'review' | 'confirmation';

// ── Reviews ──────────────────────────────────────────────────────────────────

export interface Review extends BusinessEntity {
  userId:             Guid;
  productId:          Guid;
  rating:             number;
  title?:             string | null;
  comment?:           string | null;
  isVerifiedPurchase: boolean;
}

export interface CreateReviewPayload {
  userId:     Guid;
  productId:  Guid;
  rating:     number;
  title?:     string;
  comment?:   string;
}

export interface UpdateReviewPayload {
  rating?:  number;
  title?:   string;
  comment?: string;
}

// ── Special Offers ───────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | 'fixed_amount';

export interface SpecialOffer extends BusinessEntity {
  title:         string;
  description?:  string | null;
  discountType:  DiscountType;
  discountValue: number;
  startDate:     ISODate;
  endDate:       ISODate;
  bannerUrl?:    string | null;
}

export interface CreateOfferPayload {
  title:         string;
  description?:  string;
  discountType:  DiscountType;
  discountValue: number;
  startDate:     ISODate;
  endDate:       ISODate;
}
export type UpdateOfferPayload = Partial<CreateOfferPayload>;

// ── Attachments (product gallery only) ───────────────────────────────────────

export interface Attachment extends BusinessEntity {
  productId:          Guid;
  fileName:           string;
  fileUrl:            string;
  compressedFileUrl?: string | null;
  mimeType:           string;
  fileSize:           number;
  sortOrder:          number;
}

// ── Sort options (UI-only, applied client-side after listing) ────────────────

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';

// ── Reference data (frontend-only — sourced from JSON, no backend equivalent) ──

export interface Sport {
  id:        string;
  name:      string;
  slug:      string;
  icon:      string;
  image?:    string;
  color?:    string;
  featured?: boolean;
}

export interface Team {
  id:              string;
  name:            string;
  slug:            string;
  sport:           string;
  logo:            string;
  country:         string;
  color?:          string;
  colorSecondary?: string;
  abbreviation?:   string;
}

/** UI-only category descriptor used by KitCategories section (JSON-backed). */
export interface UiCategory {
  id:         string;
  name:       string;
  slug:       string;
  description?: string;
  color?:     string;
  colorDark?: string;
  image?:     string;
}

// ── UI / Config ──────────────────────────────────────────────────────────────

export interface NavLink {
  label:    string;
  href:     string;
  children?: NavLink[];
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface HeroSlide {
  id:           string;
  headline:     string;
  subheadline:  string;
  ctaLabel:     string;
  ctaHref:      string;
  image:        string;
  badge?:       string;
  /** Hex color used for the badge background and small accent highlights. */
  accent?:      string;
  /** Horizontal alignment of the headline/content block. Defaults to "left". */
  align?:       'left' | 'center' | 'right';
  /** Where the dark gradient overlay anchors — controls which side is readable. */
  overlay?:     'left' | 'right' | 'center' | 'bottom';
}

export interface FeaturedSection {
  id:           string;
  title:        string;
  subtitle:     string;
  sportFilter?: string;
  teamFilter?:  string;
  limit:        number;
}

export interface OfferStripItem {
  id:   string;
  text: string;
}

export interface OfferBanner {
  id:           string;
  label:        string;
  headline:     string;
  subheadline:  string;
  ctaLabel:     string;
  ctaHref:      string;
  color:        string;
  image:        string;
}

/**
 * Site-wide config. When read from the backend (`siteConfigApi.get()`) the
 * BusinessEntity fields are populated; when read from the legacy
 * `site-config.json` fallback they are absent — both shapes are valid.
 */
export interface SortOptionConfig {
  value: string;
  label: string;
}

export interface SiteConfig extends Partial<BusinessEntity> {
  slug?:                   string;
  name:                    string;
  tagline?:                string | null;
  description?:            string | null;
  logoUrl?:                string | null;
  email?:                  string | null;
  phone?:                  string | null;
  currency:                string;
  freeShippingThreshold:   number;
  socialLinks:             Record<string, string>;
  heroDesignYourOwnLabel?: string | null;
  heroDesignYourOwnHref?:  string | null;
  filterMinPrice:          number;
  filterMaxPrice:          number;
  sortOptions:             SortOptionConfig[];
  cartEmptyMessage?:       string | null;
  cartEmptyCtaLabel?:      string | null;
  cartEmptyCtaHref?:       string | null;
}

export interface UpdateSiteConfigPayload {
  name?:                   string;
  tagline?:                string | null;
  description?:            string | null;
  email?:                  string | null;
  phone?:                  string | null;
  currency?:               string;
  freeShippingThreshold?:  number;
  socialLinks?:            Record<string, string>;
  heroDesignYourOwnLabel?: string | null;
  heroDesignYourOwnHref?:  string | null;
  filterMinPrice?:         number;
  filterMaxPrice?:         number;
  sortOptions?:            SortOptionConfig[];
  cartEmptyMessage?:       string | null;
  cartEmptyCtaLabel?:      string | null;
  cartEmptyCtaHref?:       string | null;
}

// ── Shipping ────────────────────────────────────────────────────────────────

export interface ShippingMethod extends BusinessEntity {
  name:                   string;
  description?:           string | null;
  baseRate:               number;
  freeShippingThreshold?: number | null;
  estimatedDaysMin?:      number | null;
  estimatedDaysMax?:      number | null;
  sortOrder:              number;
}

export interface CreateShippingMethodPayload {
  name:                   string;
  description?:           string | null;
  baseRate:               number;
  freeShippingThreshold?: number | null;
  estimatedDaysMin?:      number | null;
  estimatedDaysMax?:      number | null;
  sortOrder?:             number;
}
export type UpdateShippingMethodPayload = Partial<CreateShippingMethodPayload> & { isActive?: boolean };

// ── UI content (CMS) ────────────────────────────────────────────────────────

export type UiContentSlot =
  | 'hero-slide'
  | 'offer-banner'
  | 'offer-strip'
  | 'sport'
  | 'team'
  | 'kit-category'
  | 'nav-link'
  | 'footer-column'
  | 'featured-section';

export interface UiContentItem<TPayload extends Record<string, unknown> = Record<string, unknown>> extends BusinessEntity {
  slot:      UiContentSlot;
  payload:   TPayload;
  imageUrl?: string | null;
  sortOrder: number;
}

export interface CreateUiContentPayload {
  slot:       UiContentSlot;
  payload:    Record<string, unknown>;
  sortOrder?: number;
}

export interface UpdateUiContentPayload {
  payload?:   Record<string, unknown>;
  sortOrder?: number;
  isActive?:  boolean;
}

// ── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsKpi { value: number; deltaPct: number }
export interface AnalyticsOverview {
  revenue:   AnalyticsKpi;
  orders:    AnalyticsKpi;
  customers: AnalyticsKpi;
  units:     AnalyticsKpi;
}
export interface AnalyticsDayPoint   { day: string;   revenue: number; orders: number }
export interface AnalyticsMonthPoint { month: string; revenue: number }
export interface AnalyticsTopProduct  { productId:  string; name: string; units: number; revenue: number }
export interface AnalyticsTopCategory { categoryId: string; name: string; revenue: number }
export interface AnalyticsActivityItem { id: string; type: 'order' | 'customer'; message: string; at: ISODate }

export interface AnalyticsRangeQuery { from?: ISODate; to?: ISODate }

// ── Filters (frontend ProductFilters → backend ProductSearchQuery) ───────────

export interface ProductFilters {
  query?:      string;
  categoryId?: string;
  brand?:      string;
  minPrice?:   number;
  maxPrice?:   number;
  featured?:   boolean;
  inStock?:    boolean; // applied client-side
  status?:     ProductStatus; // applied client-side
  // UI-only legacy reference helpers — used to drive the sports/teams JSON UI.
  sport?:      string;
  team?:       string;
}

// ── Admin domain ─────────────────────────────────────────────────────────────

export interface AdminOrder {
  id:           string;
  orderNumber:  string;
  customer:     { id: string; name: string; email: string };
  items:        { productId: string; name: string; size: string; quantity: number; price: number }[];
  subtotal:     number;
  shipping:     number;
  total:        number;
  status:       'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus:'pending' | 'paid' | 'refunded' | 'failed';
  shippingAddress: {
    fullName:     string;
    phone:        string;
    addressLine1: string;
    addressLine2?: string;
    city:         string;
    state?:       string;
    country:      string;
    postalCode?:  string;
  };
  createdAt:    ISODate;
}

/** Flat product shape the admin UI works with — bridged to/from the backend's normalized model. */
export interface AdminProduct {
  id:             string;
  name:           string;
  slug:           string;
  sport:          string;
  team:           string;
  category:       string;
  price:          number;
  originalPrice?: number;
  currency:       string;
  images:         string[];
  description:    string;
  features:       string[];
  variants:       { size: string; stock: number }[];
  tags:           string[];
  badge?:         string;
  inStock:        boolean;
  rating:         number;
  reviewCount:    number;
  createdAt:      ISODate;
}

export interface AdminCustomer {
  id:           string;
  firstName:    string;
  lastName:     string;
  email:        string;
  phone?:       string;
  country?:     string;
  ordersCount:  number;
  totalSpent:   number;
  joinedAt:     ISODate;
  status:       'active' | 'inactive';
}

export interface DashboardKpi {
  value:     number;
  currency?: string;
  unit?:     string;
  deltaPct:  number;
}

export interface DashboardStats {
  kpis: {
    revenue:    DashboardKpi;
    orders:     DashboardKpi;
    customers:  DashboardKpi;
    conversion: DashboardKpi;
  };
  salesByDay:    { day: string;   revenue: number; orders: number }[];
  revenueByMonth:{ month: string; revenue: number }[];
  topCategories: { name: string;  value: number }[];
  topProducts:   { name: string;  units: number; revenue: number }[];
  trafficSources:{ source: string; value: number }[];
  recentActivity:{ id: string; type: 'order' | 'customer' | 'stock'; message: string; at: ISODate }[];
}

// ── Redux state shapes ───────────────────────────────────────────────────────

export interface AuthState {
  user:            User | null;
  token:           string | null;
  loading:         boolean;
  error:           string | null;
  isAuthenticated: boolean;
}

export interface ProductsState {
  items:           Product[];
  selectedProduct: Product | null;
  filters:         ProductFilters;
  sort:            SortOption;
  loading:         boolean;
  error:           string | null;
}

/**
 * Client cart is a local working copy synced from the server cart on login.
 * `cartId` is the server-side Cart.id (null while guest / not yet created).
 */
export interface CartState {
  cartId:  Guid | null;
  items:   CartItem[];
  isOpen:  boolean;
  loading: boolean;
  error:   string | null;
}

export interface CheckoutState {
  step:            CheckoutStep;
  shippingAddress: AddressSnapshot | null;
  loading:         boolean;
  error:           string | null;
  order:           Order | null;
}
