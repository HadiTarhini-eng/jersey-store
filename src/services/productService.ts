import api from './api';
import type { ApiResponse, PaginatedResponse, Product, ProductFilters, SortOption } from '../types';

// ── Local JSON fallback (used until a real backend is connected) ──────────────
import localProducts from '../data/products.json';

/**
 * Applies filters and sort to the local JSON dataset.
 * Remove this once the real API endpoints are available.
 */
function applyLocalFilters(
  products: Product[],
  filters: ProductFilters,
  sort: SortOption,
): Product[] {
  let result = [...products];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.team.includes(q) ||
        p.sport.includes(q),
    );
  }
  if (filters.sport)    result = result.filter((p) => p.sport    === filters.sport);
  if (filters.team)     result = result.filter((p) => p.team     === filters.team);
  if (filters.category) result = result.filter((p) => p.category === filters.category);
  if (filters.inStock)  result = result.filter((p) => p.inStock);
  if (filters.minPrice !== undefined) result = result.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) result = result.filter((p) => p.price <= filters.maxPrice!);
  if (filters.sizes?.length) {
    result = result.filter((p) =>
      filters.sizes!.some((s) => p.variants.some((v) => v.size === s && v.stock > 0)),
    );
  }

  switch (sort) {
    case 'price-asc':  result.sort((a, b) => a.price - b.price); break;
    case 'price-desc': result.sort((a, b) => b.price - a.price); break;
    case 'rating':     result.sort((a, b) => b.rating - a.rating); break;
    case 'popular':    result.sort((a, b) => b.reviewCount - a.reviewCount); break;
    case 'newest':
    default:           result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return result;
}

export const productService = {
  getProducts: async (
    filters: ProductFilters = {},
    sort: SortOption = 'newest',
    page = 1,
    limit = 12,
  ): Promise<PaginatedResponse<Product>> => {
    // Swap for: const { data } = await api.get('/products', { params: { ...filters, sort, page, limit } });
    const all    = applyLocalFilters(localProducts as Product[], filters, sort);
    const start  = (page - 1) * limit;
    const paged  = all.slice(start, start + limit);
    return { data: paged, total: all.length, page, limit, totalPages: Math.ceil(all.length / limit) };
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    // Swap for: const { data } = await api.get<ApiResponse<Product>>(`/products/${slug}`); return data.data;
    const product = (localProducts as Product[]).find((p) => p.slug === slug);
    if (!product) throw new Error(`Product not found: ${slug}`);
    return product;
  },

  getFeatured: async (filters: Partial<ProductFilters> = {}, limit = 4): Promise<Product[]> => {
    const all = applyLocalFilters(localProducts as Product[], filters, 'newest');
    return all.slice(0, limit);
  },

  /** POST /orders — called at checkout */
  submitOrder: async (payload: unknown): Promise<ApiResponse<{ orderId: string }>> => {
    const { data } = await api.post<ApiResponse<{ orderId: string }>>('/orders', payload);
    return data;
  },
};
