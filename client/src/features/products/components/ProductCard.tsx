import { Link } from 'react-router-dom';
import { useCart } from '../../cart/hooks/useCart';
import { formatPrice } from '../../../utils/formatters';
import { productPath } from '../../../config/routes';
import type { Product, ProductVariant } from '../../../types';

interface ProductCardProps {
  product: Product;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-3 h-3 ${filled ? 'text-caution' : 'text-stroke'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function variantPrice(v: ProductVariant, basePrice: number): number {
  return v.priceOverride ?? basePrice;
}

export function ProductCard({ product }: ProductCardProps) {
  const { add, open } = useCart();

  const variants     = product.variants ?? [];
  const inStock      = product.inStock ?? variants.some((v) => v.stockQuantity > 0);
  const primaryImage = product.images?.[0];
  const rating       = product.rating ?? 0;
  const reviewCount  = product.reviewCount ?? 0;

  const defaultVariant = variants.find((v) => v.stockQuantity > 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!defaultVariant) return;

    const now = new Date().toISOString();
    add({
      id:               `local-${defaultVariant.id}`,
      cartId:           'local',
      productVariantId: defaultVariant.id,
      quantity:         1,
      priceAtTime:      variantPrice(defaultVariant, product.basePrice),
      isActive:         true,
      createdAt:        now,
      updatedAt:        now,
      productTitle:     product.title,
      image:            primaryImage,
      variantLabel:     defaultVariant.sku,
      maxStock:         defaultVariant.stockQuantity,
    });
    open();
  };

  return (
    <Link
      to={productPath(product.slug)}
      className="group relative flex flex-col bg-surface rounded-2xl border border-stroke overflow-hidden hover:border-accent/20 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[4/5] bg-surface-raised overflow-hidden">
        {primaryImage && (
          <img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

        {product.featured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-accent/20 text-accent border border-accent/30">
              Featured
            </span>
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20">
            <span className="text-sm font-semibold text-muted bg-surface px-3 py-1.5 rounded-full border border-stroke">
              Out of Stock
            </span>
          </div>
        )}

        {inStock && defaultVariant && (
          <div className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full py-2 rounded-xl bg-accent text-white font-semibold text-sm tracking-wide hover:bg-accent-light active:scale-95 transition-all duration-200"
            >
              Add to Cart
            </button>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1">
        {product.brand && (
          <p className="text-[10px] text-muted uppercase tracking-widest">{product.brand}</p>
        )}

        <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-1 group-hover:text-accent transition-colors duration-200">
          {product.title}
        </h3>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-base font-bold text-primary">
            {formatPrice(product.basePrice)}
          </span>
          {reviewCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <StarIcon filled />
              {rating.toFixed(1)}
              <span className="text-muted/70">({reviewCount})</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
