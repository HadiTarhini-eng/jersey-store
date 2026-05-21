import { useCallback, useEffect, useState } from 'react';
import { categoryApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import { adminProductsApi, type AdminProductRow, type UpsertProductInput } from '../services/adminProductsApi';
import type { AdminProduct, Category } from '../../types';

export interface UseAdminProductsResult {
  items:       AdminProductRow[];
  categories:  Category[];
  loading:     boolean;
  error:       string | null;
  refresh:     () => Promise<void>;
  create:      (input: UpsertProductInput, createdBy: string) => Promise<void>;
  update:      (id: string, input: UpsertProductInput) => Promise<void>;
  remove:      (id: string) => Promise<void>;
  setStock:    (productId: string, variants: AdminProduct['variants']) => Promise<void>;
}

/**
 * Backend-backed source of truth for the admin products page. Replaces the
 * old `useAdminCollection('products', seed)` localStorage hook. Also exposes
 * the list of real categories so the form's `category` dropdown can reflect
 * the backend instead of hardcoded options.
 */
export function useAdminProducts(): UseAdminProductsResult {
  const [items,      setItems]      = useState<AdminProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, cats] = await Promise.all([
        adminProductsApi.list(),
        categoryApi.list().catch(() => [] as Category[]),
      ]);
      setItems(rows);
      setCategories(cats);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (input: UpsertProductInput, createdBy: string) => {
    await adminProductsApi.create(input, createdBy);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, input: UpsertProductInput) => {
    const existing = items.find((row) => row.id === id);
    if (!existing) throw new Error('Product not found');
    await adminProductsApi.update(id, input, existing);
    await refresh();
  }, [items, refresh]);

  const remove = useCallback(async (id: string) => {
    await adminProductsApi.remove(id);
    setItems((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const setStock = useCallback(async (productId: string, variants: AdminProduct['variants']) => {
    const existing = items.find((row) => row.id === productId);
    if (!existing) throw new Error('Product not found');
    await adminProductsApi.setStock(productId, variants, existing);
    await refresh();
  }, [items, refresh]);

  return { items, categories, loading, error, refresh, create, update, remove, setStock };
}
