import { ProductCard } from './ProductCard';
import { Spinner } from '../../../components/ui/Spinner';
import type { Product } from '../../../types';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export function ProductGrid({ products, loading, error }: ProductGridProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-primary font-semibold mb-1">No products found</h3>
          <p className="text-secondary text-sm">Try adjusting your filters or search term.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
