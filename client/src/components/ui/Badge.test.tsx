import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, badgeToVariant } from './Badge';

describe('Badge', () => {
  it('renders its children text', () => {
    render(<Badge>Sale</Badge>);
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  it('renders without crash with accent variant', () => {
    render(<Badge variant="accent">Accent</Badge>);
    expect(screen.getByText('Accent')).toBeInTheDocument();
  });

  it('renders without crash with new variant', () => {
    render(<Badge variant="new">New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders without crash with sale variant', () => {
    render(<Badge variant="sale">Sale</Badge>);
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  it('renders without crash with limited variant', () => {
    render(<Badge variant="limited">Limited</Badge>);
    expect(screen.getByText('Limited')).toBeInTheDocument();
  });

  it('renders without crash with ok variant', () => {
    render(<Badge variant="ok">In Stock</Badge>);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('renders without crash with caution variant', () => {
    render(<Badge variant="caution">Caution</Badge>);
    expect(screen.getByText('Caution')).toBeInTheDocument();
  });

  it('renders without crash with danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toBeInTheDocument();
  });

  it('renders without crash with neutral variant (default)', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });
});

describe('badgeToVariant', () => {
  it('maps "New" to the "new" variant', () => {
    expect(badgeToVariant('New')).toBe('new');
  });

  it('maps "Sale" to the "sale" variant', () => {
    expect(badgeToVariant('Sale')).toBe('sale');
  });

  it('maps "Limited" to the "limited" variant', () => {
    expect(badgeToVariant('Limited')).toBe('limited');
  });

  it('returns "neutral" for an unknown badge string', () => {
    expect(badgeToVariant('Unknown')).toBe('neutral');
  });

  it('returns "neutral" when badge is undefined', () => {
    expect(badgeToVariant(undefined)).toBe('neutral');
  });

  it('returns "neutral" for an empty string', () => {
    expect(badgeToVariant('')).toBe('neutral');
  });
});
