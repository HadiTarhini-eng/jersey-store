import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders its text content', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Submit</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} loading>Submit</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has the button role', () => {
    render(<Button>Action</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies w-full class when fullWidth prop is given', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('does not apply w-full class when fullWidth is not given', () => {
    render(<Button>Normal</Button>);
    expect(screen.getByRole('button').className).not.toContain('w-full');
  });

  it('renders without crash with primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders without crash with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders without crash with subtle variant', () => {
    render(<Button variant="subtle">Subtle</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders without crash with danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows a spinner when loading is true', () => {
    render(<Button loading>Save</Button>);
    // The spinner is an inline element with the animate-spin class
    const button = screen.getByRole('button');
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
