/** localStorage helpers — all JSON serialization lives here. */

import type { CartItem } from '../types';

const KEYS = {
  TOKEN: 'js_token',
  CART:  'js_cart_', // suffixed with userId or "guest"
} as const;

// ── Auth token (single JWT — backend has no refresh-token flow) ──────────────

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(KEYS.TOKEN);
  } catch {
    return null;
  }
}

export function storeAccessToken(token: string): void {
  localStorage.setItem(KEYS.TOKEN, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(KEYS.TOKEN);
}

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
