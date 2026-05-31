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

/** "New arrival" window — kept in sync with <ProductChip>'s 14-day rule. */
const NEW_ARRIVAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Projects compare-at price + tag-encoded meta onto the Product so downstream
 * components don't have to re-decode it. `compareAtPrice` is the canonical
 * column; we mirror it onto the legacy `originalPrice` enrichment for the
 * many components that already read that field. Falls back to the legacy
 * tag-encoded `originalPrice:` for rows that pre-date the column.
 */
function decorateFromTags(p: Product): Product {
  const meta = decodeProductTags(p.tags ?? []);
  const compareAt = p.compareAtPrice ?? meta.originalPrice;
  return {
    ...p,
    originalPrice: p.originalPrice ?? (compareAt ?? undefined),
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
  // Backend has no sport/team concept — both are encoded as `sport:<slug>` /
  // `team:<slug>` tags. Filter values are the sport/team *slug*, so decode the
  // tag meta and compare against the decoded slug rather than doing a raw
  // array-includes (which never matched the bare slug).
  // Sport/team are stored as `sport:<slug>` / `team:<slug>` meta tags on
  // admin-created products. Older/seeded rows instead carry the slug as a
  // plain tag (e.g. `football`, `real-madrid`), so accept either form.
  if (filters.sport) {
    result = result.filter((p) => {
      const meta = decodeProductTags(p.tags);
      return meta.sport === filters.sport || p.tags.includes(filters.sport!);
    });
  }
  if (filters.team) {
    result = result.filter((p) => {
      const meta = decodeProductTags(p.tags);
      return meta.team === filters.team || p.tags.includes(filters.team!);
    });
  }

  // Badge filter — drives the New Arrivals / Sale nav links. `new` and `sale`
  // mirror the exact definitions used by the storefront's <ProductChip> pills
  // (see pickProductChip) so the filter and the visible badge always agree:
  //   • new  → created within the last 14 days
  //   • sale → on sale by price (compareAt > basePrice) or a `sale` tag
  // Any other value falls back to matching the product's `badge:` meta tag.
  if (filters.badge) {
    const wanted = filters.badge.toLowerCase();
    if (wanted === 'new') {
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        const age = Date.now() - new Date(p.createdAt).getTime();
        return Number.isFinite(age) && age >= 0 && age < NEW_ARRIVAL_WINDOW_MS;
      });
    } else if (wanted === 'sale') {
      result = result.filter((p) => {
        const compareAt = p.compareAtPrice ?? decodeProductTags(p.tags).originalPrice;
        const hasDiscount = compareAt != null && compareAt > p.basePrice;
        const hasSaleTag  = p.tags?.some((t) => t.toLowerCase() === 'sale');
        return hasDiscount || hasSaleTag;
      });
    } else {
      result = result.filter((p) => decodeProductTags(p.tags).badge?.toLowerCase() === wanted);
    }
  }

  // `basePrice` arrives from the numeric backend column as a string on some
  // payloads — coerce with Number() so price sorts compare numerically rather
  // than lexicographically.
  const price = (p: Product) => Number(p.basePrice) || 0;
  switch (sort) {
    case 'price-asc':  result.sort((a, b) => price(a) - price(b)); break;
    case 'price-desc': result.sort((a, b) => price(b) - price(a)); break;
    case 'rating':     result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    case 'popular':
      // Rank by real units sold (all-time, non-cancelled orders). When two
      // products have equal sales — including a fresh store where every count
      // is 0 — fall back to newest so the order is still sensible.
      result.sort((a, b) => {
        const sold = (b.salesCount ?? 0) - (a.salesCount ?? 0);
        if (sold !== 0) return sold;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      break;
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
