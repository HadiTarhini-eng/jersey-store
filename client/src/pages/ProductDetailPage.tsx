import { useParams, Link, Navigate } from 'react-router-dom';
import { useProduct } from '../features/products/hooks/useProducts';
import { ProductDetailView } from '../features/products/components/ProductDetailView';
import { ReviewsSection } from '../features/reviews/ReviewsSection';
import { ROUTES } from '../config/routes';
import { theme } from '../config/theme';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading, error } = useProduct(slug ?? '');

  if (loading) {
    return (
      <div className={`${theme.pageContainer} py-8 lg:py-12`}>
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-3 w-10 rounded shimmer" />
          <div className="h-3 w-2 rounded shimmer" />
          <div className="h-3 w-12 rounded shimmer" />
          <div className="h-3 w-2 rounded shimmer" />
          <div className="h-3 w-32 rounded shimmer" />
        </div>

        {/* Product skeleton — 2 col layout mirrors ProductDetailView */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12">
          {/* Image skeleton */}
          <div className="space-y-4">
            <div className="aspect-[4/5] rounded-2xl shimmer" />
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-16 h-20 rounded-xl shimmer" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="flex flex-col gap-5 pt-2">
            <div className="h-3 w-40 rounded shimmer" />
            <div className="h-10 w-3/4 rounded shimmer" />
            <div className="h-4 w-28 rounded shimmer" />
            <div className="h-8 w-32 rounded shimmer" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded shimmer" />
              <div className="h-3 w-5/6 rounded shimmer" />
              <div className="h-3 w-4/6 rounded shimmer" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
                <div key={s} className="w-14 h-9 rounded-xl shimmer" />
              ))}
            </div>
            <div className="h-12 w-full rounded-xl shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return (
    <div className={`${theme.pageContainer} py-8 lg:py-12`}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-8" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <span>/</span>
        <span className="text-secondary truncate max-w-[200px]">{product.title}</span>
      </nav>

      <ProductDetailView product={product} />

      <ReviewsSection productId={product.id} />
    </div>
  );
}
