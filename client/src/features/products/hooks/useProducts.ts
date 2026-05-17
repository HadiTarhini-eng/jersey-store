import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProducts, fetchProductBySlug } from '../productsSlice';
import type { ProductFilters, SortOption } from '../../../types';

/** Fetches product list whenever filters or sort change. */
export function useProducts(
  filters: ProductFilters = {},
  sort: SortOption = 'newest',
  page = 1,
  limit = 12,
) {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchProducts({ filters, sort, page, limit }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), sort, page, limit]);

  return { products: items, loading, error };
}

/** Fetches a single product by slug. */
export function useProduct(slug: string) {
  const dispatch = useAppDispatch();
  const { selectedProduct, loading, error } = useAppSelector((s) => s.products);

  useEffect(() => {
    if (slug) dispatch(fetchProductBySlug(slug));
  }, [slug, dispatch]);

  return { product: selectedProduct, loading, error };
}
