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
  items: [],
  isOpen: false,
  loading: false,
  error: null,
};

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'prod-001',
    name: 'Real Madrid Jersey',
    image: 'https://example.com/img.jpg',
    price: 129.99,
    size: 'M',
    quantity: 1,
    maxStock: 10,
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
    expect(state.items[0].productId).toBe('prod-001');
  });

  it('increments quantity when the same productId + size is added again', () => {
    const item = makeItem({ quantity: 1 });
    const afterFirst = cartReducer(emptyState, addToCart(item));
    const afterSecond = cartReducer(afterFirst, addToCart(item));
    expect(afterSecond.items).toHaveLength(1);
    expect(afterSecond.items[0].quantity).toBe(2);
  });

  it('adds a second distinct item when size differs', () => {
    const itemM = makeItem({ size: 'M' });
    const itemL = makeItem({ size: 'L' });
    const afterFirst = cartReducer(emptyState, addToCart(itemM));
    const afterSecond = cartReducer(afterFirst, addToCart(itemL));
    expect(afterSecond.items).toHaveLength(2);
  });

  it('does not exceed maxStock when adding beyond the limit', () => {
    const item = makeItem({ quantity: 9, maxStock: 10 });
    const afterFirst = cartReducer(emptyState, addToCart(item));
    // Adding 5 more should clamp to maxStock (10)
    const afterSecond = cartReducer(afterFirst, addToCart(makeItem({ quantity: 5, maxStock: 10 })));
    expect(afterSecond.items[0].quantity).toBe(10);
  });
});

// ── removeFromCart ─────────────────────────────────────────────────────────────

describe('removeFromCart', () => {
  it('removes an existing item by productId and size', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem()] };
    const state = cartReducer(withItem, removeFromCart({ productId: 'prod-001', size: 'M' }));
    expect(state.items).toHaveLength(0);
  });

  it('is a no-op when the item does not exist', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem()] };
    const state = cartReducer(withItem, removeFromCart({ productId: 'prod-999', size: 'M' }));
    expect(state.items).toHaveLength(1);
  });

  it('only removes the matching size, leaving other sizes intact', () => {
    const items = [makeItem({ size: 'M' }), makeItem({ size: 'L' })];
    const withItems: CartState = { ...emptyState, items };
    const state = cartReducer(withItems, removeFromCart({ productId: 'prod-001', size: 'M' }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].size).toBe('L');
  });
});

// ── updateQuantity ─────────────────────────────────────────────────────────────

describe('updateQuantity', () => {
  it('sets an exact quantity for an existing item', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem({ quantity: 1 })] };
    const state = cartReducer(
      withItem,
      updateQuantity({ productId: 'prod-001', size: 'M', quantity: 4 }),
    );
    expect(state.items[0].quantity).toBe(4);
  });

  it('clamps quantity to at least 1 when set to 0', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem({ quantity: 3 })] };
    const state = cartReducer(
      withItem,
      updateQuantity({ productId: 'prod-001', size: 'M', quantity: 0 }),
    );
    expect(state.items[0].quantity).toBe(1);
  });

  it('clamps quantity to maxStock when set above it', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem({ quantity: 1, maxStock: 5 })] };
    const state = cartReducer(
      withItem,
      updateQuantity({ productId: 'prod-001', size: 'M', quantity: 99 }),
    );
    expect(state.items[0].quantity).toBe(5);
  });

  it('is a no-op when the item does not exist', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem({ quantity: 2 })] };
    const state = cartReducer(
      withItem,
      updateQuantity({ productId: 'prod-999', size: 'M', quantity: 5 }),
    );
    expect(state.items[0].quantity).toBe(2);
  });
});

// ── clearCart ─────────────────────────────────────────────────────────────────

describe('clearCart', () => {
  it('removes all items from the cart', () => {
    const withItems: CartState = {
      ...emptyState,
      items: [makeItem({ size: 'M' }), makeItem({ size: 'L' })],
    };
    const state = cartReducer(withItems, clearCart());
    expect(state.items).toHaveLength(0);
  });
});

// ── openCart / closeCart / toggleCart ─────────────────────────────────────────

describe('openCart', () => {
  it('sets isOpen to true', () => {
    const state = cartReducer(emptyState, openCart());
    expect(state.isOpen).toBe(true);
  });
});

describe('closeCart', () => {
  it('sets isOpen to false', () => {
    const openState: CartState = { ...emptyState, isOpen: true };
    const state = cartReducer(openState, closeCart());
    expect(state.isOpen).toBe(false);
  });
});

describe('toggleCart', () => {
  it('toggles isOpen from false to true', () => {
    const state = cartReducer(emptyState, toggleCart());
    expect(state.isOpen).toBe(true);
  });

  it('toggles isOpen from true to false', () => {
    const openState: CartState = { ...emptyState, isOpen: true };
    const state = cartReducer(openState, toggleCart());
    expect(state.isOpen).toBe(false);
  });
});

// ── rehydrateCart ─────────────────────────────────────────────────────────────

describe('rehydrateCart', () => {
  it('replaces items with the provided array', () => {
    const withItem: CartState = { ...emptyState, items: [makeItem()] };
    const newItems = [makeItem({ productId: 'prod-002', size: 'XL', quantity: 3 })];
    const state = cartReducer(withItem, rehydrateCart(newItems));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe('prod-002');
  });
});
