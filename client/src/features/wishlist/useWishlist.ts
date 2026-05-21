import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'jersey-store.wishlist';

function readStore(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeStore(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage may be unavailable (private mode); silently no-op.
  }
}

/**
 * Local-only wishlist toggle for the storefront. Persists product IDs in
 * localStorage; no backend round-trip. Multiple instances stay in sync via
 * a custom `wishlist-change` event on `window`.
 */
export function useWishlist(productId?: string) {
  const [ids, setIds] = useState<string[]>(() => readStore());

  useEffect(() => {
    const handler = () => setIds(readStore());
    window.addEventListener('wishlist-change', handler);
    return () => window.removeEventListener('wishlist-change', handler);
  }, []);

  const toggle = useCallback(() => {
    if (!productId) return;
    const next = ids.includes(productId)
      ? ids.filter((id) => id !== productId)
      : [...ids, productId];
    setIds(next);
    writeStore(next);
    window.dispatchEvent(new CustomEvent('wishlist-change'));
  }, [ids, productId]);

  const isWishlisted = productId ? ids.includes(productId) : false;

  return { ids, isWishlisted, toggle };
}
