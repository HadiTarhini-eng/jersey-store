import { useState } from 'react';
import { useCart } from '../../cart/hooks/useCart';
import { formatPrice } from '../../../utils/formatters';
import type { Product, ProductVariant } from '../../../types';

interface ProductDetailViewProps {
  product: Product;
}

function variantPrice(v: ProductVariant, basePrice: number): number {
  return v.priceOverride ?? basePrice;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity]           = useState(1);
  const [variantError, setVariantError]   = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const { add, open } = useCart();

  const variants    = product.variants ?? [];
  const images      = product.images ?? [];
  const rating      = product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const inStock     = product.inStock ?? variants.some((v) => v.stockQuantity > 0);
  const description = product.fullDescription ?? product.shortDescription ?? '';

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const maxQty          = selectedVariant?.stockQuantity ?? 10;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setVariantError(true);
      return;
    }
    const now = new Date().toISOString();
    add({
      id:               `local-${selectedVariant.id}`,
      cartId:           'local',
      productVariantId: selectedVariant.id,
      quantity,
      priceAtTime:      variantPrice(selectedVariant, product.basePrice),
      isActive:         true,
      createdAt:        now,
      updatedAt:        now,
      productTitle:     product.title,
      image:            images[0],
      variantLabel:     selectedVariant.sku,
      maxStock:         selectedVariant.stockQuantity,
    });

    setAddedFeedback(true);
    setTimeout(() => { setAddedFeedback(false); open(); }, 800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12">

      {/* ── Image gallery ── */}
      <div className="space-y-4">
        <div className="aspect-[4/5] rounded-2xl bg-surface-raised overflow-hidden border border-stroke">
          {images[selectedImage] && (
            <img
              src={images[selectedImage]}
              alt={`${product.title} — view ${selectedImage + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                aria-label={`View image ${i + 1}`}
                className={[
                  'shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all',
                  selectedImage === i ? 'border-accent' : 'border-transparent hover:border-stroke',
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
        {product.brand && (
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
            {product.brand}
          </div>
        )}

        <h1 className="font-sport text-4xl md:text-5xl text-primary leading-tight">
          {product.title}
        </h1>

        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-caution' : 'text-stroke'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-muted">
              {rating.toFixed(1)} ({reviewCount} reviews)
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(product.basePrice)}
          </span>
        </div>

        {description && (
          <p className="text-secondary text-sm leading-relaxed">{description}</p>
        )}

        {variants.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${variantError ? 'text-danger' : 'text-secondary'}`}>
                {variantError ? 'Please select a size' : 'Select Size'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const out      = v.stockQuantity === 0;
                const selected = selectedVariantId === v.id;
                // Extract the size from the SKU pattern `${slug}-${size}`; fall back to full SKU.
                const label    = (v.sku.split('-').pop() ?? v.sku).toUpperCase();
                return (
                  <button
                    key={v.id}
                    disabled={out}
                    onClick={() => { setSelectedVariantId(v.id); setVariantError(false); setQuantity(1); }}
                    className={[
                      'min-w-[3rem] px-3 py-2 rounded-lg border-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer',
                      out
                        ? 'border-stroke text-muted opacity-40 cursor-not-allowed line-through'
                        : selected
                        ? 'border-white bg-black text-white'
                        : 'border-stroke text-secondary hover:border-white hover:text-white',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary shrink-0">Qty:</span>
          <div className="flex items-center border border-stroke rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="px-3 py-2.5 text-secondary hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-40"
            >−</button>
            <span className="px-4 py-2.5 text-sm font-semibold text-primary min-w-[3rem] text-center border-x border-stroke">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              aria-label="Increase quantity"
              className="px-3 py-2.5 text-secondary hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-40"
            >+</button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!inStock || addedFeedback}
          className={[
            'w-full mt-2 flex items-center justify-center gap-2',
            'px-5 py-3 rounded-xl',
            'bg-black text-white font-bold text-sm tracking-wider uppercase',
            'border-2 border-white',
            'hover:bg-white hover:text-black',
            'active:scale-[0.98] transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white',
            'focus-accent',
          ].join(' ')}
        >
          {!inStock ? 'Out of Stock' : addedFeedback ? '✓ Added' : 'Add to Cart'}
        </button>

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
