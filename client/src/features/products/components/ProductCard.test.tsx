import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/test-utils';
import { ProductCard } from './ProductCard';
import type { Product } from '../../../types';

// ── Mock product data ─────────────────────────────────────────────────────────

const mockProduct: Product = {
  id: 'prod-001',
  name: 'Real Madrid Jersey',
  slug: 'real-madrid-home',
  sport: 'football',
  team: 'real-madrid',
  category: 'jerseys',
  price: 129.99,
  originalPrice: 149.99,
  currency: 'USD',
  images: ['https://picsum.photos/seed/test/600/750'],
  description: 'Test jersey',
  features: ['Feature 1'],
  variants: [
    { size: 'M', stock: 10 },
    { size: 'L', stock: 5 },
  ],
  tags: ['football'],
  badge: 'Sale',
  inStock: true,
  rating: 4.5,
  reviewCount: 100,
  createdAt: '2024-01-01T00:00:00Z',
};

const outOfStockProduct: Product = {
  ...mockProduct,
  id: 'prod-002',
  slug: 'real-madrid-away',
  inStock: false,
  variants: [{ size: 'M', stock: 0 }],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProductCard', () => {
  it('renders the product name', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Real Madrid Jersey')).toBeInTheDocument();
  });

  it('renders the sale price', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('$129.99')).toBeInTheDocument();
  });

  it('renders the original (struck-through) price when originalPrice is provided', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('renders a discount label when originalPrice exists', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    // discountPercent(149.99, 129.99) = "-13%"
    const discountElements = screen.getAllByText('-13%');
    expect(discountElements.length).toBeGreaterThan(0);
  });

  it('renders the product badge', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  it('renders size chips for available variants', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    // Sizes appear in the info section (always visible) and in the hover overlay
    const mChips = screen.getAllByText('M');
    expect(mChips.length).toBeGreaterThan(0);
    const lChips = screen.getAllByText('L');
    expect(lChips.length).toBeGreaterThan(0);
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

  it('renders the sport and team line', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/football/i)).toBeInTheDocument();
  });
});
