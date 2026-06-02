import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProducts, fetchProductBySlug, clearSelectedProduct } from '../productsSlice';
import type { ProductFilters, SortOption } from '../../../types';

/** Fetches product list whenever filters or sort change. */
export function useProducts(
  filters: ProductFilters = {},
  sort: SortOption = 'newest',
  page = 1,
  limit = 12,
) {
  const dispatch = useAppDispatch();
  const { items, total, loading, error } = useAppSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchProducts({ filters, sort, page, limit }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), sort, page, limit]);

  return { products: items, total, loading, error };
}

/** Fetches a single product by slug. */
export function useProduct(slug: string) {
  const dispatch = useAppDispatch();
  const { selectedProduct, loading, error, notFoundSlug } = useAppSelector((s) => s.products);

  useEffect(() => {
    if (!slug) return;
    // Clear immediately so the stale product never renders against the new slug.
    dispatch(clearSelectedProduct());
    dispatch(fetchProductBySlug(slug));
  }, [slug, dispatch]);

  // Gate on slug match — even after fetch resolves, only return the product
  // once it corresponds to the URL we're currently rendering.
  const matches  = !!selectedProduct && selectedProduct.slug === slug;
  const notFound = notFoundSlug === slug;
  return {
    product:  matches ? selectedProduct : null,
    loading:  loading || (!!slug && !matches && !error && !notFound),
    error,
    notFound,
  };
}
