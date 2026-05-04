import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductFilters, SortOption } from '../../../types';

/**
 * Syncs product filters with the URL search params.
 * This makes filters shareable and browser-history friendly.
 */
export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ProductFilters = {
    sport:    searchParams.get('sport')    ?? undefined,
    team:     searchParams.get('team')     ?? undefined,
    category: searchParams.get('category') ?? undefined,
    query:    searchParams.get('q')        ?? undefined,
    inStock:  searchParams.get('inStock')  === 'true' ? true : undefined,
    minPrice: searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sizes:    searchParams.getAll('size').length ? searchParams.getAll('size') : undefined,
  };

  const sort = (searchParams.get('sort') ?? 'newest') as SortOption;

  const setFilter = useCallback(
    (key: string, value: string | string[] | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
          next.delete(key);
        } else if (Array.isArray(value)) {
          next.delete(key);
          value.forEach((v) => next.append(key, v));
        } else {
          next.set(key, value);
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const setSort = useCallback(
    (value: SortOption) => setFilter('sort', value),
    [setFilter],
  );

  const setQuery = useCallback(
    (value: string) => setFilter('q', value || undefined),
    [setFilter],
  );

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length),
  ).length;

  return { filters, sort, setFilter, clearFilters, setSort, setQuery, activeFilterCount };
}
