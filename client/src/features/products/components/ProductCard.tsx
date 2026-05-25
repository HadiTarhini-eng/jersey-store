import { Link } from 'react-router-dom';
import { formatPrice, discountPercent } from '../../../utils/formatters';
import { productPath } from '../../../config/routes';
import { theme } from '../../../config/theme';
import { ProductChip, pickProductChip } from './ProductChip';
import type { Product } from '../../../types';

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

/**
 * Product tile — pure navigation. Clicking opens the detail page where the
 * customer picks a size and adds to cart. No quick-add overlay.
 */
export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.[0];
  const rating       = product.rating ?? 0;
  const reviewCount  = product.reviewCount ?? 0;
  const chipKind     = pickProductChip(product);
  const onSale       = typeof product.originalPrice === 'number' && product.originalPrice > product.basePrice;

  return (
    <Link
      to={productPath(product.slug)}
      className={`group relative flex flex-col overflow-hidden ${theme.cardElevated}`}
    >
      <div className="relative aspect-[4/5] bg-surface-raised overflow-hidden">
        {primaryImage && (
          <img
            src={primaryImage}
            alt={product.title}
            className={[
              'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
              chipKind === 'sold-out' ? 'opacity-60 grayscale-[40%]' : '',
            ].join(' ')}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background/70 to-transparent pointer-events-none" />

        {/* Status chip — top right */}
        <div className="absolute top-3 right-3 z-10">
          <ProductChip product={product} />
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1">
        {product.brand && (
          <p className="text-[10px] text-muted uppercase tracking-widest">{product.brand}</p>
        )}

        <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-1 group-hover:text-accent transition-colors duration-200">
          {product.title}
        </h3>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-base font-bold ${onSale ? 'text-power' : 'text-primary'}`}>
              {formatPrice(product.basePrice)}
            </span>
            {onSale && (
              <>
                <span className="text-xs text-muted line-through tabular-nums">
                  {formatPrice(product.originalPrice!)}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-power/15 text-power border border-power/30">
                  {discountPercent(product.originalPrice!, product.basePrice)}
                </span>
              </>
            )}
          </div>
          {reviewCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted shrink-0">
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
