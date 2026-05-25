/**
 * Domain wrapper around productApi.
 *
 * Backend-only: lists/details come from `/products`. Errors propagate to
 * the caller — there is no JSON fallback. Client-side filtering still
 * applies for fields the backend search doesn't natively support
 * (sport, team — both stored as product tags).
 */
import { productApi, extractErrorMessage, extractErrorStatus } from './api';
import { decodeProductTags } from '../features/products/lib/productMeta';
import type { Product, ProductFilters, ProductSearchQuery, SortOption } from '../types';

/**
 * Projects tag-encoded meta (originalPrice, badge, …) onto the Product so
 * downstream components don't have to re-decode it. Critical for the SALE
 * chip + struck-through price — `Product.originalPrice` is absent on backend
 * payloads and lives in the tags as `originalPrice:N`.
 */
function decorateFromTags(p: Product): Product {
  const meta = decodeProductTags(p.tags ?? []);
  return {
    ...p,
    originalPrice: p.originalPrice ?? meta.originalPrice,
  };
}

/**
 * The `/products` search endpoint returns products without their gallery —
 * images live behind a separate `/products/:id/images` call. We hydrate
 * `images` here so every storefront consumer (cards, sliders, detail page)
 * gets a fresh `images: string[]` populated from the latest attachments,
 * preferring compressed URLs when available.
 */
async function hydrateImages(products: Product[]): Promise<Product[]> {
  return Promise.all(
    products.map(async (p) => {
      if (p.images && p.images.length > 0) return p;
      try {
        const attachments = await productApi.images.list(p.id);
        const urls = attachments
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((a) => a.compressedFileUrl ?? a.fileUrl);
        return urls.length > 0 ? { ...p, images: urls } : p;
      } catch {
        return p;
      }
    }),
  );
}

// ── Client-side filter/sort ──────────────────────────────────────────────────

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
  // Backend has no sport/team concept — both are matched against tags.
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
   * Throws on network/backend failure — callers should surface an error UI.
   */
  getProducts: async (
    filters: ProductFilters = {},
    sort:    SortOption     = 'newest',
    page                    = 1,
    limit                   = 12,
  ): Promise<PagedProducts> => {
    const items    = (await productApi.search(toSearchQuery(filters))).map(decorateFromTags);
    const filtered = applyClientFilters(items, filters, sort);
    const start    = (page - 1) * limit;
    const page0    = filtered.slice(start, start + limit);
    // Hydrate only the current page's products — keeps the cost bounded.
    const data     = await hydrateImages(page0);
    return {
      data,
      total:      filtered.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    };
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    try {
      return decorateFromTags(await productApi.bySlug(slug));
    } catch (err) {
      const wrapped = new Error(extractErrorMessage(err, `Product not found: ${slug}`)) as Error & { status?: number };
      wrapped.status = extractErrorStatus(err);
      throw wrapped;
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      return decorateFromTags(await productApi.byId(id));
    } catch (err) {
      throw new Error(extractErrorMessage(err, `Product not found: ${id}`));
    }
  },

  /**
   * "Featured" historically required `featured: true`, but most seed data
   * leaves that flag false. We ask for newest products matching the supplied
   * filters instead, which gives a sensible feed.
   */
  getFeatured: async (filters: Partial<ProductFilters> = {}, limit = 4): Promise<Product[]> => {
    const { data } = await productService.getProducts(filters, 'newest', 1, limit);
    return data;
  },

  /**
   * Fetches variants for a product and merges them onto the given Product.
   * Useful on the product-detail page.
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
