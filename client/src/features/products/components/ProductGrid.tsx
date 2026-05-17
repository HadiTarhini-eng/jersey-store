import { ProductCard } from './ProductCard';
import type { Product } from '../../../types';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col bg-surface rounded-2xl border border-stroke overflow-hidden">
      {/* Image area skeleton — matches aspect-[3/4] */}
      <div className="aspect-[3/4] shimmer" />

      {/* Info area skeleton */}
      <div className="p-4 flex flex-col gap-3">
        {/* Sport · Team line */}
        <div className="h-2.5 w-24 rounded shimmer" />
        {/* Product name — two lines */}
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-full rounded shimmer" />
          <div className="h-3.5 w-3/4 rounded shimmer" />
        </div>
        {/* Stars */}
        <div className="h-3 w-20 rounded shimmer" />
        {/* Price */}
        <div className="h-4 w-28 rounded shimmer" />
        {/* Size chips */}
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-8 rounded shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, error }: ProductGridProps) {
  if (loading) {
    return (
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-64">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <p className="text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-surface-raised border border-stroke flex items-center justify-center mx-auto">
            <svg
              className="w-7 h-7 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-primary font-semibold text-sm">No products found</h3>
            <p className="text-secondary text-xs mt-0.5">Try adjusting your filters or search term.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
