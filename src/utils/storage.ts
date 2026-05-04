/** localStorage helpers — all JSON serialization lives here. */

import type { AuthTokens, CartItem } from '../types';

const KEYS = {
  TOKENS: 'js_tokens',
  CART:   'js_cart_',   // suffixed with userId or "guest"
} as const;

// ── Auth tokens ──────────────────────────────────────────────────────────────

export function getStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(KEYS.TOKENS);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(KEYS.TOKENS, JSON.stringify(tokens));
}

export function clearStoredTokens(): void {
  localStorage.removeItem(KEYS.TOKENS);
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
