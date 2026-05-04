import { useParams, Link, Navigate } from 'react-router-dom';
import { useProduct } from '../features/products/hooks/useProducts';
import { ProductDetailView } from '../features/products/components/ProductDetailView';
import { Spinner } from '../components/ui/Spinner';
import { ROUTES } from '../config/routes';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading, error } = useProduct(slug ?? '');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-8" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <span>/</span>
        <span className="text-secondary truncate max-w-[200px]">{product.name}</span>
      </nav>

      <ProductDetailView product={product} />
    </div>
  );
}
