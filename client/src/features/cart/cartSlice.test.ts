import { describe, it, expect } from 'vitest';
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
  rehydrateCart,
} from './cartSlice';
import type { CartState, CartItem } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyState: CartState = {
  cartId:  null,
  items:   [],
  isOpen:  false,
  loading: false,
  error:   null,
};

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  const now = '2024-01-01T00:00:00Z';
  return {
    id:               'item-001',
    cartId:           'cart-001',
    productVariantId: 'variant-001',
    quantity:         1,
    priceAtTime:      129.99,
    isActive:         true,
    createdAt:        now,
    updatedAt:        now,
    productTitle:     'Real Madrid Jersey',
    image:            'https://example.com/img.jpg',
    variantLabel:     'M',
    maxStock:         10,
    ...overrides,
  };
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe('cartSlice initial state', () => {
  it('has an empty items array and isOpen false', () => {
    const state = cartReducer(undefined, { type: '@@INIT' });
    expect(state.isOpen).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

// ── addToCart ─────────────────────────────────────────────────────────────────

describe('addToCart', () => {
  it('adds a new item to an empty cart', () => {
    const item = makeItem();
    const state = cartReducer(emptyState, addToCart(item));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productVariantId).toBe('variant-001');
  });

  it('increments quantity when the same variant is added again', () => {
    const item = makeItem({ quantity: 1 });
    const afterFirst = cartReducer(emptyState, addToCart(item));
    const afterSecond = cartReducer(afterFirst, addToCart(item));
    expect(afterSecond.items).toHaveLength(1);
    expect(afterSecond.items[0].quantity).toBe(2);
  });

  it('adds a second distinct item when productVariantId differs', () => {
    const a = makeItem({ productVariantId: 'variant-M' });
    const b = makeItem({ productVariantId: 'variant-L' });
    const afterFirst = cartReducer(emptyState, addToCart(a));
    const afterSecond = cartReducer(afterFirst, addToCart(b));
    expect(afterSecond.items).toHaveLength(2);
  });

  it('does not exceed maxStock when adding beyond the limit', () => {
    const item = makeItem({ quantity: 9, maxStock: 10 });
    const afterFirst = cartReducer(emptyState, addToCart(item));
    const afterSecond = cartReducer(afterFirst, addToCart(makeItem({ quantity: 5, maxStock: 10 })));
    expect(afterSecond.items[0].quantity).toBe(10);
  });
});

// ── removeFromCart ─────────────────────────────────────────────────────────────

describe('removeFromCart', () => {
  it('removes an existing item by productVariantId', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem()] };
    const state = cartReducer(withItem, removeFromCart({ productVariantId: 'variant-001' }));
    expect(state.items).toHaveLength(0);
  });

  it('is a no-op when the item does not exist', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem()] };
    const state = cartReducer(withItem, removeFromCart({ productVariantId: 'variant-999' }));
    expect(state.items).toHaveLength(1);
  });
});

// ── updateQuantity ─────────────────────────────────────────────────────────────

describe('updateQuantity', () => {
  it('sets an exact quantity for an existing item', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem({ quantity: 1 })] };
    const state = cartReducer(withItem, updateQuantity({ productVariantId: 'variant-001', quantity: 4 }));
    expect(state.items[0].quantity).toBe(4);
  });

  it('clamps quantity to at least 1 when set to 0', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem({ quantity: 3 })] };
    const state = cartReducer(withItem, updateQuantity({ productVariantId: 'variant-001', quantity: 0 }));
    expect(state.items[0].quantity).toBe(1);
  });

  it('clamps quantity to maxStock when set above it', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem({ quantity: 1, maxStock: 5 })] };
    const state = cartReducer(withItem, updateQuantity({ productVariantId: 'variant-001', quantity: 99 }));
    expect(state.items[0].quantity).toBe(5);
  });
});

// ── clearCart / open / close / toggle / rehydrate ─────────────────────────────

describe('clearCart', () => {
  it('removes all items', () => {
    const withItems: CartState = { ...emptyState, items: [makeItem(), makeItem({ productVariantId: 'v2' })] };
    const state = cartReducer(withItems, clearCart());
    expect(state.items).toHaveLength(0);
  });
});

describe('openCart / closeCart / toggleCart', () => {
  it('opens the cart', () => {
    expect(cartReducer(emptyState, openCart()).isOpen).toBe(true);
  });
  it('closes the cart', () => {
    expect(cartReducer({ ...emptyState, isOpen: true }, closeCart()).isOpen).toBe(false);
  });
  it('toggles the cart', () => {
    expect(cartReducer(emptyState, toggleCart()).isOpen).toBe(true);
    expect(cartReducer({ ...emptyState, isOpen: true }, toggleCart()).isOpen).toBe(false);
  });
});

describe('rehydrateCart', () => {
  it('replaces items with the provided array', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem()] };
    const next = [makeItem({ productVariantId: 'variant-002', quantity: 3 })];
    const state = cartReducer(withItem, rehydrateCart(next));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productVariantId).toBe('variant-002');
  });
});
