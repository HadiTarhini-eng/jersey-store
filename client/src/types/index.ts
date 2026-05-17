// ─────────────────────────────────────────────────────────────────────────────
// Global TypeScript definitions — single source of truth for all domain shapes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Product ──────────────────────────────────────────────────────────────────

export interface ProductVariant {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sport: string;       // references Sport.id
  team: string;        // references Team.id
  category: string;    // references Category.id
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];    // first image is the primary display image
  description: string;
  features: string[];
  variants: ProductVariant[];
  tags: string[];      // search keywords
  badge?: string;      // "New" | "Sale" | "Limited" | etc.
  inStock: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProductFilters {
  sport?: string;
  team?: string;
  category?: string;
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  query?: string;
}

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
  maxStock: number;
}

// ── Order / Checkout ──────────────────────────────────────────────────────────

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export type CheckoutStep = 'shipping' | 'review' | 'confirmation';

// ── Reference Data ────────────────────────────────────────────────────────────

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  color?: string;
  featured?: boolean;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  sport: string;
  logo: string;
  country: string;
  color?: string;
  colorSecondary?: string;
  abbreviation?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  colorDark?: string;
  image?: string;
}

// ── UI / Config ───────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface HeroSlide {
  id: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  badge?: string;
}

export interface FeaturedSection {
  id: string;
  title: string;
  subtitle: string;
  sportFilter?: string;
  teamFilter?: string;
  limit: number;
}

export interface OfferStripItem {
  id: string;
  text: string;
}

export interface OfferBanner {
  id: string;
  label: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  color: string;
  image: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  logo: string;
  email: string;
  phone: string;
  currency: string;
  freeShippingThreshold: number;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
}

// ── API Contracts ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Redux Slice State Shapes ───────────────────────────────────────────────────

export interface ProductsState {
  items: Product[];
  selectedProduct: Product | null;
  filters: ProductFilters;
  sort: SortOption;
  loading: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  loading: boolean;
  error: string | null;
}

export interface CheckoutState {
  step: CheckoutStep;
  shippingAddress: ShippingAddress | null;
  loading: boolean;
  error: string | null;
  order: Order | null;
}
