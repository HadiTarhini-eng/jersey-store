import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  discountPercent,
  truncate,
  formatRating,
  capitalize,
  slugToLabel,
} from './formatters';

describe('formatPrice', () => {
  it('formats a positive USD price with dollar sign', () => {
    const result = formatPrice(129.99, 'USD');
    expect(result).toContain('129.99');
    expect(result).toContain('$');
  });

  it('formats zero as $0.00', () => {
    const result = formatPrice(0, 'USD');
    expect(result).toContain('0');
    expect(result).toContain('$');
  });

  it('uses USD as default currency', () => {
    const result = formatPrice(50);
    expect(result).toContain('$');
  });

  it('formats prices with cents correctly', () => {
    const result = formatPrice(9.99, 'USD');
    expect(result).toContain('9.99');
  });
});

describe('discountPercent', () => {
  it('returns the correct discount percentage string', () => {
    // (149.99 - 129.99) / 149.99 ≈ 13%
    const result = discountPercent(149.99, 129.99);
    expect(result).toBe('-13%');
  });

  it('returns -0% when original and sale prices are the same', () => {
    const result = discountPercent(100, 100);
    expect(result).toBe('-0%');
  });

  it('returns -50% for half price', () => {
    const result = discountPercent(200, 100);
    expect(result).toBe('-50%');
  });

  it('rounds to the nearest whole percent', () => {
    // (30 - 20) / 30 = 33.33% → rounds to 33%
    const result = discountPercent(30, 20);
    expect(result).toBe('-33%');
  });
});

describe('truncate', () => {
  it('returns the string unchanged when it is within maxLength', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and appends ellipsis when text exceeds maxLength', () => {
    const result = truncate('Hello World', 8);
    expect(result).toHaveLength(8);
    expect(result.endsWith('…')).toBe(true);
  });

  it('returns the string unchanged when it is exactly maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('formatRating', () => {
  it('formats a rating as "X.X / 5"', () => {
    expect(formatRating(4.8)).toBe('4.8 / 5');
  });

  it('always shows one decimal place', () => {
    expect(formatRating(5)).toBe('5.0 / 5');
  });
});

describe('capitalize', () => {
  it('uppercases the first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('leaves an already-capitalized string unchanged', () => {
    expect(capitalize('World')).toBe('World');
  });

  it('handles a single character', () => {
    expect(capitalize('a')).toBe('A');
  });
});

describe('slugToLabel', () => {
  it('converts a slug to a display label', () => {
    expect(slugToLabel('real-madrid')).toBe('Real Madrid');
  });

  it('handles a single-word slug', () => {
    expect(slugToLabel('football')).toBe('Football');
  });

  it('handles a multi-word slug', () => {
    expect(slugToLabel('new-york-city')).toBe('New York City');
  });
});
