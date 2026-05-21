import { useCallback, useEffect, useState } from 'react';
import { uiContentApi } from '../services/api';
import { extractErrorMessage } from '../services/api/client';
import type { UiContentItem, UiContentSlot } from '../types';

type AnyPayload = Record<string, unknown>;

/**
 * Flatten a UiContentItem<T> into the legacy "flat" shape consumers expect
 * (e.g. Sport / Team / UiCategory / HeroSlide / OfferBanner) — id and sortOrder
 * live at the top level, `image` resolves to a URL string. We prefer the
 * inline `imageUrl` column (uploaded via setImage) and fall back to a
 * payload-embedded `image` URL (seed/static data).
 */
function flatten<T extends AnyPayload>(item: UiContentItem<T>): T & { id: string; sortOrder: number; isActive: boolean } {
  const payload = item.payload ?? ({} as T);
  const resolvedImage = item.imageUrl ?? (payload as AnyPayload).image;
  return {
    ...payload,
    id: item.id,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    ...(resolvedImage ? { image: resolvedImage } : {}),
  } as T & { id: string; sortOrder: number; isActive: boolean };
}

export interface UseUiContentSlotResult<T extends AnyPayload> {
  items: (T & { id: string; sortOrder: number; isActive: boolean })[];
  raw: UiContentItem<T>[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (payload: T, image?: File | Blob) => Promise<UiContentItem<T>>;
  update: (id: string, patch: Partial<T>) => Promise<UiContentItem<T>>;
  setImage: (id: string, file: File | Blob) => Promise<UiContentItem<T>>;
  removeImage: (id: string) => Promise<UiContentItem<T>>;
  reorder: (id: string, sortOrder: number) => Promise<UiContentItem<T>>;
  setActive: (id: string, isActive: boolean) => Promise<UiContentItem<T>>;
  remove: (id: string) => Promise<void>;
}

export function useUiContentSlot<T extends AnyPayload>(slot: UiContentSlot, options: { activeOnly?: boolean } = {}): UseUiContentSlotResult<T> {
  const { activeOnly = false } = options;
  const [raw, setRaw] = useState<UiContentItem<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await uiContentApi.listBySlot<T>(slot, activeOnly ? { isActive: true } : {});
      setRaw(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load content'));
    } finally {
      setLoading(false);
    }
  }, [slot, activeOnly]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (payload: T, image?: File | Blob) => {
    const created = await uiContentApi.create<T>({ slot, payload, sortOrder: raw.length }, image);
    setRaw((prev) => [...prev, created]);
    return created;
  }, [slot, raw.length]);

  const update = useCallback(async (id: string, patch: Partial<T>) => {
    const existing = raw.find((item) => item.id === id);
    const nextPayload = { ...(existing?.payload ?? {}), ...patch } as T;
    const updated = await uiContentApi.update<T>(id, { payload: nextPayload });
    setRaw((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [raw]);

  const setImage = useCallback(async (id: string, file: File | Blob) => {
    const updated = await uiContentApi.setImage<T>(id, file);
    setRaw((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const removeImage = useCallback(async (id: string) => {
    const updated = await uiContentApi.removeImage<T>(id);
    setRaw((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const reorder = useCallback(async (id: string, sortOrder: number) => {
    const updated = await uiContentApi.reorder<T>(id, sortOrder);
    setRaw((prev) =>
      prev.map((item) => (item.id === id ? updated : item)).sort((a, b) => a.sortOrder - b.sortOrder),
    );
    return updated;
  }, []);

  const setActive = useCallback(async (id: string, isActive: boolean) => {
    const updated = isActive
      ? await uiContentApi.activate<T>(id)
      : await uiContentApi.deactivate<T>(id);
    setRaw((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await uiContentApi.delete(id);
    setRaw((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    items: raw.map(flatten<T>),
    raw,
    loading,
    error,
    refresh,
    add,
    update,
    setImage,
    removeImage,
    reorder,
    setActive,
    remove,
  };
}
