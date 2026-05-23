import React from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../../../types';

interface ProductSliderProps {
  products: Product[];
}

export function ProductSlider({ products }: ProductSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft]       = React.useState(false);
  const [canRight, setCanRight]     = React.useState(false);
  const [progress, setProgress]     = React.useState(0);

  const sync = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync, products.length]);

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -(el.clientWidth * 0.8) : el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="shrink-0 snap-start w-[calc(50%_-_8px)] md:w-[calc(33.33%_-_11px)] lg:w-[calc(25%_-_12px)]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Arrow — left */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className={[
          'hidden md:flex absolute left-0 top-[45%] -translate-y-1/2 -translate-x-5 z-10',
          'w-11 h-11 rounded-full bg-surface-raised border border-stroke',
          'text-primary hover:border-accent hover:text-accent hover:scale-110',
          'items-center justify-center shadow-card-hover',
          'transition-all duration-200',
          canLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Arrow — right */}
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className={[
          'hidden md:flex absolute right-0 top-[45%] -translate-y-1/2 translate-x-5 z-10',
          'w-11 h-11 rounded-full bg-surface-raised border border-stroke',
          'text-primary hover:border-accent hover:text-accent hover:scale-110',
          'items-center justify-center shadow-card-hover',
          'transition-all duration-200',
          canRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Scroll progress bar */}
      <div className="mt-5 h-0.5 w-full bg-stroke rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-200"
          style={{ width: `${Math.max(8, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
