/**
 * Domain wrapper around productApi.
 *
 * Backend-first: lists/details come from /products. When that fails (offline
 * or backend not running), the service falls back to the legacy JSON dataset
 * in src/data/products.json so the UI keeps rendering during dev.
 *
 * The JSON dataset still uses the old front-end shape (name/price/variants[size,stock]/…),
 * so it's adapted into the new backend-shaped `Product` via `adaptLegacyProduct`.
 */
import { productApi, extractErrorMessage } from './api';
import localProducts from '../data/products.json';
import type { Product, ProductFilters, ProductSearchQuery, SortOption } from '../types';

// ── Legacy JSON adapter ──────────────────────────────────────────────────────

interface LegacyProduct {
  id: string;
  name: string;
  slug: string;
  sport: string;
  team: string;
  category: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  description: string;
  features: string[];
  variants: { size: string; stock: number }[];
  tags: string[];
  badge?: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

/** Project a legacy JSON record into the new backend-shaped Product. */
function adaptLegacyProduct(p: LegacyProduct): Product {
  return {
    id:               p.id,
    categoryId:       p.category,           // JSON `category` is reused as categoryId
    title:            p.name,
    slug:             p.slug,
    shortDescription: p.description,
    fullDescription:  p.description,
    tags:             [...p.tags, p.sport, p.team].filter(Boolean),
    brand:            null,
    basePrice:        p.price,
    status:           'active',
    featured:         false,
    createdBy:        'seed',
    isActive:         true,
    createdAt:        p.createdAt,
    updatedAt:        p.createdAt,
    // ── UI enrichments ──
    images:           p.images,
    rating:           p.rating,
    reviewCount:      p.reviewCount,
    inStock:          p.inStock,
    variants:         p.variants.map((v, i) => ({
      id:            `${p.id}-v${i}`,
      productId:     p.id,
      sku:           `${p.slug}-${v.size}`,
      priceOverride: null,
      stockQuantity: v.stock,
      imageId:       null,
      isActive:      v.stock > 0,
      createdAt:     p.createdAt,
      updatedAt:     p.createdAt,
    })),
  };
}

const legacyDataset: Product[] = (localProducts as LegacyProduct[]).map(adaptLegacyProduct);

// ── Client-side filter/sort (used for legacy fallback & post-filtering) ──────

function applyClientFilters(items: Product[], filters: ProductFilters, sort: SortOption): Product[] {
  let result = [...items];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (filters.categoryId) result = result.filter((p) => p.categoryId === filters.categoryId);
  if (filters.brand)      result = result.filter((p) => p.brand === filters.brand);
  if (filters.featured !== undefined) result = result.filter((p) => p.featured === filters.featured);
  if (filters.inStock)    result = result.filter((p) => p.inStock !== false);
  if (filters.minPrice !== undefined) result = result.filter((p) => p.basePrice >= filters.minPrice!);
  if (filters.maxPrice !== undefined) result = result.filter((p) => p.basePrice <= filters.maxPrice!);
  // Legacy JSON-only filters — work against tags, since backend has no sport/team concept.
  if (filters.sport) result = result.filter((p) => p.tags.includes(filters.sport!));
  if (filters.team)  result = result.filter((p) => p.tags.includes(filters.team!));

  switch (sort) {
    case 'price-asc':  result.sort((a, b) => a.basePrice - b.basePrice); break;
    case 'price-desc': result.sort((a, b) => b.basePrice - a.basePrice); break;
    case 'rating':     result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    case 'popular':    result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)); break;
    case 'newest':
    default:           result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return result;
}

function toSearchQuery(filters: ProductFilters): ProductSearchQuery {
  return {
    query:      filters.query,
    categoryId: filters.categoryId,
    brand:      filters.brand,
    featured:   filters.featured,
    minPrice:   filters.minPrice,
    maxPrice:   filters.maxPrice,
    status:     'active',
  };
}

// ── Public service ───────────────────────────────────────────────────────────

export interface PagedProducts {
  data:       Product[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export const productService = {
  /**
   * Lists products from the backend; client-side paginates and applies sort.
   * Falls back to the local JSON dataset if the backend call fails.
   */
  getProducts: async (
    filters: ProductFilters = {},
    sort:    SortOption     = 'newest',
    page                    = 1,
    limit                   = 12,
  ): Promise<PagedProducts> => {
    let items: Product[];
    try {
      items = await productApi.search(toSearchQuery(filters));
    } catch {
      items = legacyDataset;
    }
    const filtered = applyClientFilters(items, filters, sort);
    const start    = (page - 1) * limit;
    return {
      data:       filtered.slice(start, start + limit),
      total:      filtered.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    };
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    try {
      return await productApi.bySlug(slug);
    } catch (err) {
      const match = legacyDataset.find((p) => p.slug === slug);
      if (match) return match;
      throw new Error(extractErrorMessage(err, `Product not found: ${slug}`));
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      return await productApi.byId(id);
    } catch (err) {
      const match = legacyDataset.find((p) => p.id === id);
      if (match) return match;
      throw new Error(extractErrorMessage(err, `Product not found: ${id}`));
    }
  },

  getFeatured: async (filters: Partial<ProductFilters> = {}, limit = 4): Promise<Product[]> => {
    const { data } = await productService.getProducts({ ...filters, featured: true }, 'newest', 1, limit);
    return data;
  },

  /**
   * Fetches variants for a product (real backend) and merges them onto the
   * given Product. Useful on the product-detail page.
   */
  withVariants: async (product: Product): Promise<Product> => {
    if (product.variants && product.variants.length > 0) return product;
    try {
      const variants = await productApi.variants.list(product.id);
      return { ...product, variants, inStock: variants.some((v) => v.stockQuantity > 0) };
    } catch {
      return product;
    }
  },
};
