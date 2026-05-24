import { useEffect, useState } from 'react';
import { categoryApi } from '../../../services/api';
import type { Category } from '../../../types';

/**
 * Lightweight, UI-friendly category record used by the storefront's category
 * pickers (filter sidebar, home tiles). Backend `Category` is mapped into
 * this shape so we can fall back to the legacy JSON file without forking
 * every consumer.
 */
export interface StoreCategory {
  /** Backend category id — pass this to ProductSearchQuery.categoryId. */
  id:           string;
  /** URL-friendly slug. Useful for friendlier links if needed later. */
  slug:         string;
  name:         string;
  description?: string;
  image?:       string;
  /** Optional brand colors — populated for legacy/UI categories only. */
  color?:       string;
  colorDark?:   string;
}

function fromBackend(c: Category): StoreCategory {
  return {
    id:          c.id,
    slug:        c.slug,
    name:        c.name,
    description: c.description ?? undefined,
    image:       c.imageUrl    ?? undefined,
  };
}

/**
 * Fetches categories from the backend (`categoryApi.list()`). Surfaces
 * `error` on failure — callers can choose to render an empty state or
 * a retry prompt.
 */
export function useCategories() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await categoryApi.list({ isActive: true });
        if (!cancelled) setCategories(data.map(fromBackend));
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? 'Failed to load categories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { categories, loading, error };
}
