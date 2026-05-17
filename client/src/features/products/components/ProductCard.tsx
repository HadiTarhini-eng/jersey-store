import { Link } from 'react-router-dom';
import { useCart } from '../../cart/hooks/useCart';
import { formatPrice, discountPercent } from '../../../utils/formatters';
import { productPath } from '../../../config/routes';
import type { Product } from '../../../types';

interface ProductCardProps {
  product: Product;
}

// ── Badge style map ───────────────────────────────────────────────────────────
const badgeStyleMap: Record<string, string> = {
  New:     'bg-accent/20 text-accent border border-accent/30',
  Sale:    'bg-power/20 text-power border border-power/30',
  Limited: 'bg-caution/20 text-caution border border-caution/30',
};

function getBadgeStyle(badge: string): string {
  return badgeStyleMap[badge] ?? 'bg-surface-raised text-secondary border border-stroke';
}

// ── Star SVG ──────────────────────────────────────────────────────────────────
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

export function ProductCard({ product }: ProductCardProps) {
  const { add, open } = useCart();

  const defaultSize = product.variants.find((v) => v.stock > 0)?.size ?? '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate to detail page
    if (!defaultSize) return;

    add({
      productId: product.id,
      name:      product.name,
      image:     product.images[0],
      price:     product.price,
      size:      defaultSize,
      quantity:  1,
      maxStock:  product.variants.find((v) => v.size === defaultSize)?.stock ?? 1,
    });
    open();
  };

  // Available sizes for visual chips (stock > 0)
  const availableSizes = product.variants.filter((v) => v.stock > 0).map((v) => v.size);
  const visibleSizes   = availableSizes.slice(0, 4);
  const extraCount     = availableSizes.length - visibleSizes.length;

  // Discount badge
  const hasDiscount = !!product.originalPrice;
  const discountLabel = hasDiscount
    ? discountPercent(product.originalPrice!, product.price)
    : null;

  return (
    <Link
      to={productPath(product.slug)}
      className="group relative flex flex-col bg-surface rounded-2xl border border-stroke overflow-hidden hover:border-accent/20 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
    >
      {/* ── IMAGE AREA ─────────────────────────────────────────────────────── */}
      <div className="relative aspect-[3/4] bg-surface-raised overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Gradient overlay for bottom overlay elements */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

        {/* Badge — top-left */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={[
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide',
                getBadgeStyle(product.badge),
              ].join(' ')}
            >
              {product.badge}
            </span>
          </div>
        )}

        {/* Discount badge — top-right */}
        {hasDiscount && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-ok text-background text-xs font-bold px-2 py-0.5 rounded-lg">
              {discountLabel}
            </span>
          </div>
        )}

        {/* Out-of-stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20">
            <span className="text-sm font-semibold text-muted bg-surface px-3 py-1.5 rounded-full border border-stroke">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover overlay — sizes row + Add to Cart button, slide up together */}
        {product.inStock && (
          <div className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              className="w-full py-2 rounded-xl bg-accent text-white font-semibold text-sm tracking-wide hover:bg-accent-light active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!defaultSize}
            >
              Add to Cart
            </button>

            {/* Size chips — visual only in hover overlay */}
            {visibleSizes.length > 0 && (
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {visibleSizes.map((size) => (
                  <span
                    key={size}
                    className="px-2 py-0.5 rounded bg-background/70 text-xs text-primary border border-stroke/60 backdrop-blur-sm"
                  >
                    {size}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-background/70 text-xs text-muted border border-stroke/60 backdrop-blur-sm">
                    +{extraCount}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CARD INFO ──────────────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-2">
        {/* Sport · Team */}
        <p className="text-xs text-muted uppercase tracking-widest">
          {product.sport} · {product.team.replace(/-/g, ' ')}
        </p>

        {/* Product name */}
        <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-200">
          {product.name}
        </h3>

        {/* Star rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon key={i} filled={i < Math.floor(product.rating)} />
            ))}
          </div>
          <span className="text-xs text-muted">({product.reviewCount})</span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-auto pt-0.5">
          <span className="text-base font-bold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-muted line-through">
                {formatPrice(product.originalPrice, product.currency)}
              </span>
              <span className="bg-ok text-background text-xs font-bold px-1.5 py-0.5 rounded-md">
                {discountLabel}
              </span>
            </>
          )}
        </div>

        {/* Visual size chips — informational only */}
        {visibleSizes.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {visibleSizes.map((size) => (
              <span
                key={size}
                className="px-2 py-0.5 rounded text-xs text-muted border border-stroke"
              >
                {size}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="px-2 py-0.5 rounded text-xs text-muted border border-stroke">
                +{extraCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
