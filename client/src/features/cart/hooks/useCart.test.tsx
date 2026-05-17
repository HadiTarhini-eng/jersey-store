import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/test-utils';
import { useCart } from './useCart';

function CartConsumer() {
  const { items, isOpen, totalItems, subtotal } = useCart();
  return (
    <div>
      <span data-testid="item-count">{items.length}</span>
      <span data-testid="total-items">{totalItems}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <span data-testid="is-open">{String(isOpen)}</span>
    </div>
  );
}

describe('useCart', () => {
  it('does not throw when rendered inside a Redux provider', () => {
    expect(() => renderWithProviders(<CartConsumer />)).not.toThrow();
  });

  it('returns an empty items array on initial state', () => {
    renderWithProviders(<CartConsumer />);
    expect(screen.getByTestId('item-count').textContent).toBe('0');
  });

  it('returns totalItems as 0 on initial state', () => {
    renderWithProviders(<CartConsumer />);
    expect(screen.getByTestId('total-items').textContent).toBe('0');
  });

  it('returns subtotal as 0 on initial state', () => {
    renderWithProviders(<CartConsumer />);
    expect(screen.getByTestId('subtotal').textContent).toBe('0');
  });

  it('returns isOpen as false on initial state', () => {
    renderWithProviders(<CartConsumer />);
    expect(screen.getByTestId('is-open').textContent).toBe('false');
  });

  it('reflects preloaded cart items correctly', () => {
    const now = '2024-01-01T00:00:00Z';
    renderWithProviders(<CartConsumer />, {
      preloadedState: {
        cart: {
          cartId:  null,
          items: [
            {
              id:               'item-001',
              cartId:           'cart-001',
              productVariantId: 'variant-001',
              quantity:         2,
              priceAtTime:      50,
              isActive:         true,
              createdAt:        now,
              updatedAt:        now,
              productTitle:     'Test Jersey',
              image:            'https://example.com/img.jpg',
              variantLabel:     'M',
              maxStock:         10,
            },
          ],
          isOpen:  false,
          loading: false,
          error:   null,
        },
      },
    });

    expect(screen.getByTestId('item-count').textContent).toBe('1');
    expect(screen.getByTestId('total-items').textContent).toBe('2');
    expect(screen.getByTestId('subtotal').textContent).toBe('100');
  });
});
