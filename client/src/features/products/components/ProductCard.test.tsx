import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/test-utils';
import { ProductCard } from './ProductCard';
import type { Product } from '../../../types';

const now = '2024-01-01T00:00:00Z';

const mockProduct: Product = {
  id:               'prod-001',
  categoryId:       'cat-jerseys',
  title:            'Real Madrid Jersey',
  slug:             'real-madrid-home',
  shortDescription: 'Test jersey',
  fullDescription:  'Test jersey',
  tags:             ['football'],
  brand:            'Adidas',
  basePrice:        129.99,
  status:           'active',
  featured:         true,
  createdBy:        'seed',
  isActive:         true,
  createdAt:        now,
  updatedAt:        now,
  images:           ['https://picsum.photos/seed/test/600/750'],
  rating:           4.5,
  reviewCount:      100,
  inStock:          true,
  variants: [
    {
      id: 'v-m', productId: 'prod-001', sku: 'jersey-M',
      priceOverride: null, stockQuantity: 10, imageUrl: null,
      isVisible: true, isActive: true, createdAt: now, updatedAt: now,
    },
    {
      id: 'v-l', productId: 'prod-001', sku: 'jersey-L',
      priceOverride: null, stockQuantity: 5, imageUrl: null,
      isVisible: true, isActive: true, createdAt: now, updatedAt: now,
    },
  ],
};

const outOfStockProduct: Product = {
  ...mockProduct,
  id:       'prod-002',
  slug:     'real-madrid-away',
  inStock:  false,
  variants: [{
    id: 'v-m2', productId: 'prod-002', sku: 'jersey-M',
    priceOverride: null, stockQuantity: 0, imageUrl: null,
    isVisible: true, isActive: false, createdAt: now, updatedAt: now,
  }],
};

describe('ProductCard', () => {
  it('renders the product title', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Real Madrid Jersey')).toBeInTheDocument();
  });

  it('renders the base price', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('$129.99')).toBeInTheDocument();
  });

  it('renders a Featured badge when product.featured is true', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('renders the brand when available', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Adidas')).toBeInTheDocument();
  });

  it('renders the Add to Cart button for an in-stock product', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
  });

  it('shows the Out of Stock indicator when inStock is false', () => {
    renderWithProviders(<ProductCard product={outOfStockProduct} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('does not render the Add to Cart button when out of stock', () => {
    renderWithProviders(<ProductCard product={outOfStockProduct} />);
    expect(screen.queryByRole('button', { name: 'Add to Cart' })).not.toBeInTheDocument();
  });

  it('renders the star rating review count', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });
});
