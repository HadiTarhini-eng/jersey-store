/** localStorage helpers — all JSON serialization lives here. */

import type { CartItem } from '../types';

const KEYS = {
  CART: 'js_cart_', // suffixed with userId or "guest"
} as const;

// Auth tokens are not stored here — the Supabase client owns session
// persistence (see services/supabase.ts).

// ── Cart (per-user) ──────────────────────────────────────────────────────────

function cartKey(userId: string | null) {
  return KEYS.CART + (userId ?? 'guest');
}

export function getStoredCart(userId: string | null): CartItem[] {
  try {
    const raw = localStorage.getItem(cartKey(userId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function storeCart(userId: string | null, items: CartItem[]): void {
  localStorage.setItem(cartKey(userId), JSON.stringify(items));
}

export function clearStoredCart(userId: string | null): void {
  localStorage.removeItem(cartKey(userId));
}

export function moveStoredCart(fromUserId: string | null, toUserId: string | null): void {
  const items = getStoredCart(fromUserId);
  if (items.length > 0) storeCart(toUserId, items);
  clearStoredCart(fromUserId);
}
