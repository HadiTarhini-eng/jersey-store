import { Link } from 'react-router-dom';
import { discountPercent } from '../../../utils/formatters';
import { productPath } from '../../../config/routes';
import type { Product } from '../../../types';

// ── Badge colours ─────────────────────────────────────────────────────────────
const badgeStyleMap: Record<string, string> = {
  New:     'bg-accent text-white',
  Sale:    'bg-power text-white',
  Limited: 'bg-caution text-background',
};

function getBadgeStyle(badge: string): string {
  return badgeStyleMap[badge] ?? 'bg-surface-raised text-secondary';
}

interface ProductSliderCardProps {
  product: Product;
}

export function ProductSliderCard({ product }: ProductSliderCardProps) {
  const hasDiscount = !!product.originalPrice;
  const discountLabel = hasDiscount
    ? discountPercent(product.originalPrice!, product.price)
    : null;

  return (
    <Link
      to={productPath(product.slug)}
      className="group relative block rounded-2xl overflow-hidden aspect-[3/4] w-full bg-surface-raised"
    >
      {/* ── Image ──────────────────────────────────────────────────────────── */}
      <img
        src={product.images[0]}
        alt={product.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.opacity = '0';
        }}
      />

      {/* Bottom gradient so text is legible on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

      {/* ── Badge — top-left ─────────────────────────────────────────────── */}
      {product.badge && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={[
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide',
              getBadgeStyle(product.badge),
            ].join(' ')}
          >
            {product.badge}
          </span>
        </div>
      )}

      {/* ── Discount — top-right ─────────────────────────────────────────── */}
      {hasDiscount && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-ok text-background text-xs font-bold px-2.5 py-1 rounded-lg">
            {discountLabel}
          </span>
        </div>
      )}

      {/* ── Out-of-stock overlay ─────────────────────────────────────────── */}
      {!product.inStock && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20">
          <span className="text-xs font-semibold text-muted bg-surface-raised px-3 py-1.5 rounded-full border border-stroke">
            Out of Stock
          </span>
        </div>
      )}

      {/* ── Hover reveal: name + cta ─────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 p-4 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-sm font-semibold text-white leading-tight line-clamp-1 drop-shadow">
          {product.name}
        </p>
        <span className="text-xs text-accent mt-1 block font-medium">Quick view →</span>
      </div>
    </Link>
  );
}
