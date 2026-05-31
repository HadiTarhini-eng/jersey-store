import { useParams, Link, Navigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { useProduct } from '../features/products/hooks/useProducts';
import { useProductEnrichment } from '../features/products/hooks/useProductEnrichment';
import { fetchProductBySlug } from '../features/products/productsSlice';
import { ProductDetailView } from '../features/products/components/ProductDetailView';
// Reviews are disabled for now — the section + hook stay in the repo so we
// can re-enable later, but neither runs on this page. See FEATURE_FLAGS.
// import { ReviewsSection } from '../features/reviews/ReviewsSection';
// import { useProductReviews } from '../features/reviews/useProductReviews';
import { useProductSeo } from '../features/products/hooks/useProductSeo';
import { decodeProductTags } from '../features/products/lib/productMeta';
import { ProductSlider } from '../features/products/components/ProductSlider';
import { ROUTES } from '../config/routes';
import { theme } from '../config/theme';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { product, loading, error, notFound } = useProduct(slug ?? '');
  const enrichment = useProductEnrichment(product?.id, product?.categoryId, product?.tags);

  const primaryImage =
    enrichment.attachments[0]?.compressedFileUrl
    ?? enrichment.attachments[0]?.fileUrl
    ?? product?.images?.[0];
  useProductSeo(product ? {
    product,
    primaryImage,
    price:       product.basePrice,
    currency:    decodeProductTags(product.tags).currency || 'USD',
    inStock:     product.inStock ?? false,
    // Reviews are disabled; SEO rating/reviewCount intentionally omitted.
  } : null);

  if (loading) {
    return (
      <main className={`${theme.pageContainer} py-8 lg:py-12`} aria-busy="true" aria-live="polite">
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
      </main>
    );
  }

  if (notFound) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  if (error || !product) {
    return (
      <main className={`${theme.pageContainer} py-16 text-center`} role="alert">
        <h1 className="font-sport text-3xl text-primary mb-3">Could not load this product</h1>
        <p className="text-muted text-sm mb-6">{error ?? 'Something went wrong.'}</p>
        <button
          type="button"
          onClick={() => slug && dispatch(fetchProductBySlug(slug))}
          className="px-5 py-3 rounded-xl bg-black text-white text-sm font-bold uppercase tracking-wider border-2 border-white hover:bg-white hover:text-black transition-colors"
        >
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className={`${theme.pageContainer} py-8 lg:py-12`}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-8" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        {enrichment.category && (
          <>
            <span>/</span>
            <Link
              to={`/shop?category=${encodeURIComponent(enrichment.category.slug)}`}
              className="hover:text-primary transition-colors"
            >
              {enrichment.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-secondary truncate max-w-[200px]" aria-current="page">{product.title}</span>
      </nav>

      <ProductDetailView
        product={product}
        specs={enrichment.specs}
        offers={enrichment.offers}
        attachments={enrichment.attachments}
      />

      {/* Reviews are disabled — see commented imports at the top of the file. */}

      {enrichment.related.length > 0 && (
        <section className="mt-16 pt-10 border-t border-stroke" aria-label="Similar items">
          <h2 className={`${theme.sectionTitle} mb-1`}>Similar items</h2>
          <p className={`${theme.sectionSubtitle} mb-6`}>
            Other pieces that share tags with this one — built from the same teams, sports, or styles.
          </p>
          <ProductSlider products={enrichment.related} />
        </section>
      )}
    </main>
  );
}
