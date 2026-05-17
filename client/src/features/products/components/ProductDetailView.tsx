import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, badgeToVariant } from '../../../components/ui/Badge';
import { useCart } from '../../cart/hooks/useCart';
import { formatPrice, discountPercent, slugToLabel } from '../../../utils/formatters';
import { theme } from '../../../config/theme';
import type { Product } from '../../../types';

interface ProductDetailViewProps {
  product: Product;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize]   = useState<string>('');
  const [quantity, setQuantity]           = useState(1);
  const [sizeError, setSizeError]         = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const { add, open } = useCart();

  const selectedVariant = product.variants.find((v) => v.size === selectedSize);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    add({
      productId: product.id,
      name:      product.name,
      image:     product.images[0],
      price:     product.price,
      size:      selectedSize,
      quantity,
      maxStock:  selectedVariant?.stock ?? 1,
    });

    // Brief "Added!" feedback then open cart
    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
      open();
    }, 800);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSizeError(false);
    setQuantity(1); // reset qty on size change
  };

  const maxQty = selectedVariant?.stock ?? 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12">

      {/* ── Image gallery (left) ── */}
      <div className="space-y-4">
        {/* Main image */}
        <div className="aspect-[4/5] rounded-2xl bg-surface-raised overflow-hidden border border-stroke">
          <img
            src={product.images[selectedImage]}
            alt={`${product.name} — view ${selectedImage + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Thumbnail strip */}
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {product.images.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                aria-label={`View image ${i + 1}`}
                className={[
                  'shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all',
                  selectedImage === i
                    ? 'border-accent'
                    : 'border-transparent hover:border-stroke',
                ].join(' ')}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Product info (right) ── */}
      <div className="flex flex-col gap-5">

        {/* Sport / team / category breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted flex-wrap">
          <Link
            to={`/shop?sport=${product.sport}`}
            className="hover:text-accent transition-colors"
          >
            {slugToLabel(product.sport)}
          </Link>
          <span>&middot;</span>
          <Link
            to={`/shop?team=${product.team}`}
            className="hover:text-accent transition-colors"
          >
            {slugToLabel(product.team)}
          </Link>
          <span>&middot;</span>
          <Link
            to={`/shop?category=${product.category}`}
            className="hover:text-accent transition-colors"
          >
            {slugToLabel(product.category)}
          </Link>
        </div>

        {/* Name + badge */}
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="font-sport text-4xl md:text-5xl text-primary leading-tight">
            {product.name}
          </h1>
          {product.badge && (
            <Badge variant={badgeToVariant(product.badge)} className="mt-2">
              {product.badge}
            </Badge>
          )}
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-caution' : 'text-stroke'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-muted">
            {product.rating} ({product.reviewCount} reviews)
          </span>
        </div>

        {/* Price block */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-xl text-muted line-through">
                {formatPrice(product.originalPrice, product.currency)}
              </span>
              <span className="bg-ok text-background rounded-lg px-2 py-1 text-sm font-bold">
                {discountPercent(product.originalPrice, product.price)}
              </span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-secondary text-sm leading-relaxed">
          {product.description}
        </p>

        {/* Features list */}
        {product.features.length > 0 && (
          <ul className="space-y-1.5">
            {product.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-secondary">
                <svg
                  className="w-4 h-4 text-ok mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* Size selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${sizeError ? 'text-danger' : 'text-secondary'}`}>
              {sizeError ? 'Please select a size' : 'Select Size'}
            </span>
            <button
              type="button"
              className="text-xs text-accent hover:text-accent-light transition-colors"
            >
              Size guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isOutOfStock = variant.stock === 0;
              const isSelected   = selectedSize === variant.size;
              return (
                <button
                  key={variant.size}
                  disabled={isOutOfStock}
                  onClick={() => handleSizeSelect(variant.size)}
                  className={[
                    'px-4 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer',
                    isOutOfStock
                      ? 'border-stroke text-muted opacity-40 cursor-not-allowed line-through'
                      : isSelected
                      ? 'border-accent bg-accent text-white'
                      : 'border-stroke text-secondary hover:border-accent hover:text-accent',
                  ].join(' ')}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary shrink-0">Qty:</span>
          <div className="flex items-center border border-stroke rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="px-3 py-2.5 text-secondary hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="px-4 py-2.5 text-sm font-semibold text-primary min-w-[3rem] text-center border-x border-stroke">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              aria-label="Increase quantity"
              className="px-3 py-2.5 text-secondary hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add to Cart button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || addedFeedback}
          className={[
            'w-full',
            theme.btnPrimary,
          ].join(' ')}
        >
          {!product.inStock
            ? 'Out of Stock'
            : addedFeedback
            ? 'Added!'
            : '+ Add to Cart'}
        </button>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <svg className="w-3.5 h-3.5 text-ok shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secure Checkout
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <svg className="w-3.5 h-3.5 text-ok shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
            </svg>
            Free Returns
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <svg className="w-3.5 h-3.5 text-ok shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            100% Authentic
          </span>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-stroke">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-surface-raised border border-stroke text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
