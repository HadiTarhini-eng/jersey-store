import { Link } from 'react-router-dom';
import { Badge, badgeToVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useCart } from '../../cart/hooks/useCart';
import { formatPrice, discountPercent } from '../../../utils/formatters';
import { productPath } from '../../../config/routes';
import type { Product } from '../../../types';

interface ProductCardProps {
  product: Product;
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

  return (
    <Link
      to={productPath(product.slug)}
      className="group relative flex flex-col bg-surface rounded-2xl border border-stroke overflow-hidden hover:border-accent/30 hover:shadow-card-hover transition-all duration-300"
    >
      {/* Product image */}
      <div className="relative aspect-[4/5] bg-surface-raised overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            // Fallback gradient when image doesn't exist (during development)
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Gradient overlay for bottom text */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface to-transparent" />

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3">
            <Badge variant={badgeToVariant(product.badge)}>{product.badge}</Badge>
          </div>
        )}

        {/* Quick add — appears on hover */}
        {product.inStock && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleAddToCart}
            >
              Quick Add
            </Button>
          </div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-sm font-semibold text-muted bg-surface px-3 py-1.5 rounded-full border border-stroke">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-4 flex flex-col gap-1.5">
        <p className="text-xs text-muted uppercase tracking-widest">
          {product.sport} · {product.team.replace(/-/g, ' ')}
        </p>

        <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {product.name}
        </h3>

        {/* Star rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-accent' : 'text-stroke'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-muted">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-base font-bold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-muted line-through">
                {formatPrice(product.originalPrice, product.currency)}
              </span>
              <span className="text-xs font-semibold text-ok">
                {discountPercent(product.originalPrice, product.price)}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
