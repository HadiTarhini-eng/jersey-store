import { useState } from 'react';
import { Badge, badgeToVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useCart } from '../../cart/hooks/useCart';
import { formatPrice, discountPercent } from '../../../utils/formatters';
import type { Product } from '../../../types';

interface ProductDetailViewProps {
  product: Product;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize]   = useState<string>('');
  const [quantity, setQuantity]           = useState(1);
  const [sizeError, setSizeError]         = useState(false);

  const { add, open } = useCart();

  const selectedVariant = product.variants.find((v) => v.size === selectedSize);

  const handleAddToCart = () => {
    if (!selectedSize) { setSizeError(true); return; }

    add({
      productId: product.id,
      name:      product.name,
      image:     product.images[0],
      price:     product.price,
      size:      selectedSize,
      quantity,
      maxStock:  selectedVariant?.stock ?? 1,
    });
    open();
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSizeError(false);
    setQuantity(1); // reset qty on size change
  };

  const maxQty = selectedVariant?.stock ?? 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
      {/* ── Image gallery ── */}
      <div className="space-y-3">
        <div className="aspect-square rounded-2xl bg-surface-raised overflow-hidden border border-stroke">
          <img
            src={product.images[selectedImage]}
            alt={`${product.name} — view ${selectedImage + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {product.images.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={[
                  'shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors',
                  selectedImage === i ? 'border-accent' : 'border-stroke hover:border-accent/50',
                ].join(' ')}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Product info ── */}
      <div className="flex flex-col gap-5">
        {/* Sport / team breadcrumb */}
        <p className="text-xs uppercase tracking-widest text-muted">
          {product.sport} · {product.team.replace(/-/g, ' ')} · {product.category}
        </p>

        {/* Name + badge */}
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-primary leading-tight">
            {product.name}
          </h1>
          {product.badge && (
            <Badge variant={badgeToVariant(product.badge)} className="mt-1">
              {product.badge}
            </Badge>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-accent' : 'text-stroke'}`}
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-muted">{product.rating} ({product.reviewCount} reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-xl text-muted line-through">
                {formatPrice(product.originalPrice, product.currency)}
              </span>
              <Badge variant="sale">
                {discountPercent(product.originalPrice, product.price)}
              </Badge>
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-secondary text-sm leading-relaxed">{product.description}</p>

        {/* Size selector */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className={`text-sm font-medium ${sizeError ? 'text-danger' : 'text-secondary'}`}>
              {sizeError ? 'Please select a size' : 'Select Size'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.size}
                disabled={variant.stock === 0}
                onClick={() => handleSizeSelect(variant.size)}
                className={[
                  'min-w-[3rem] px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                  variant.stock === 0
                    ? 'border-stroke text-muted cursor-not-allowed opacity-40 line-through'
                    : selectedSize === variant.size
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-stroke text-secondary hover:border-accent/50 hover:text-primary',
                ].join(' ')}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity + Add to cart */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-stroke rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-3 py-3 text-secondary hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="px-4 py-3 text-sm font-semibold text-primary min-w-[3rem] text-center border-x border-stroke">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="px-3 py-3 text-secondary hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!product.inStock}
            onClick={handleAddToCart}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>

        {/* Features */}
        {product.features.length > 0 && (
          <div className="border-t border-stroke pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Features</h3>
            <ul className="space-y-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-secondary">
                  <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
