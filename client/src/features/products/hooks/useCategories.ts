import { useEffect, useState } from 'react';
import { categoryApi } from '../../../services/api';
import categoriesFallback from '../../../data/categories.json';
import type { Category, UiCategory } from '../../../types';

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

function fromLegacy(c: UiCategory): StoreCategory {
  return {
    id:          c.id,
    slug:        c.slug,
    name:        c.name,
    description: c.description,
    image:       c.image,
    color:       c.color,
    colorDark:   c.colorDark,
  };
}

/**
 * Fetches categories from the backend (`categoryApi.list()`); falls back to
 * the bundled `categories.json` if the backend is unavailable so the UI
 * never goes blank during dev.
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
        setCategories((categoriesFallback as UiCategory[]).map(fromLegacy));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { categories, loading, error };
}
