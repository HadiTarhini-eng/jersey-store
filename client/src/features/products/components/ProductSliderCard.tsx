import { Link } from 'react-router-dom';
import { productPath } from '../../../config/routes';
import type { Product } from '../../../types';

interface ProductSliderCardProps {
  product: Product;
}

export function ProductSliderCard({ product }: ProductSliderCardProps) {
  const image   = product.images?.[0];
  const inStock = product.inStock ?? (product.variants?.some((v) => v.stockQuantity > 0) ?? true);

  return (
    <Link
      to={productPath(product.slug)}
      className="group relative block rounded-2xl overflow-hidden aspect-[3/4] w-full bg-surface-raised"
    >
      {image && (
        <img
          src={image}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

      {product.featured && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide bg-accent text-white">
            Featured
          </span>
        </div>
      )}

      {!inStock && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20">
          <span className="text-xs font-semibold text-muted bg-surface-raised px-3 py-1.5 rounded-full border border-stroke">
            Out of Stock
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-sm font-semibold text-white leading-tight line-clamp-1 drop-shadow">
          {product.title}
        </p>
        <span className="text-xs text-accent mt-1 block font-medium">Quick view →</span>
      </div>
    </Link>
  );
}
