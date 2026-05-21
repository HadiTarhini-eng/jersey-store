import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../cart/hooks/useCart';
import { useToast } from '../../../components/ui/Toast';
import { StarRating } from '../../../components/ui/StarRating';
import { ImageLightbox } from '../../../components/ui/ImageLightbox';
import { useWishlist } from '../../wishlist/useWishlist';
import { decodeProductTags } from '../lib/productMeta';
import { formatPrice, discountPercent } from '../../../utils/formatters';
import type { Attachment, Product, ProductVariant, SpecialOffer } from '../../../types';

export interface ProductSpec { id: string; label: string; value: string; }

interface GalleryImage {
  src:     string;
  srcSet?: string;
  alt?:    string;
}

interface ProductDetailViewProps {
  product:     Product;
  specs?:      ProductSpec[];
  offers?:     SpecialOffer[];
  attachments?: Attachment[];
}

function variantPrice(v: ProductVariant | undefined, basePrice: number): number {
  return v?.priceOverride ?? basePrice;
}

function variantSize(v: ProductVariant, slug: string): string {
  const prefix = `${slug}-`;
  return v.sku.startsWith(prefix) ? v.sku.slice(prefix.length).toUpperCase() : v.sku.toUpperCase();
}

const LOW_STOCK_THRESHOLD = 5;

export function ProductDetailView({ product, specs = [], offers = [], attachments = [] }: ProductDetailViewProps) {
  const variants  = product.variants ?? [];
  const fallbackImages = product.images ?? [];
  // Prefer attachments (carry both fileUrl and compressedFileUrl for srcSet); fall back to flat URLs.
  const images: GalleryImage[] = attachments.length > 0
    ? attachments.map((a) => ({
        src:    a.compressedFileUrl ?? a.fileUrl,
        srcSet: a.compressedFileUrl
                  ? `${a.compressedFileUrl} 600w, ${a.fileUrl} 1200w`
                  : undefined,
        alt:    a.fileName,
      }))
    : fallbackImages.map((src) => ({ src }));
  const meta      = useMemo(() => decodeProductTags(product.tags ?? []), [product.tags]);
  const rating    = product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const inStock   = product.inStock ?? variants.some((v) => v.stockQuantity > 0);
  const description = product.fullDescription ?? product.shortDescription ?? '';
  const currency  = meta.currency || 'USD';
  const totalStock = variants.reduce((sum, v) => sum + Math.max(0, v.stockQuantity), 0);

  // ─── Auto-select sole variant ──────────────────────────────────────────────
  const soleVariantId = variants.length === 1 && variants[0].stockQuantity > 0 ? variants[0].id : '';
  const [selectedVariantId, setSelectedVariantId] = useState<string>(soleVariantId);
  useEffect(() => { setSelectedVariantId(soleVariantId); }, [soleVariantId, product.id]);

  const [quantity, setQuantity]         = useState(1);
  const [variantError, setVariantError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const { isWishlisted, toggle: toggleWishlist } = useWishlist(product.id);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const price           = variantPrice(selectedVariant, product.basePrice);
  const onSale          = meta.originalPrice !== undefined && meta.originalPrice > price;
  const maxQty          = selectedVariant?.stockQuantity ?? Math.min(10, totalStock || 10);

  // ─── Gallery prepends variant.imageUrl when one is set on the active variant ──
  const galleryImages = useMemo<GalleryImage[]>(() => {
    if (selectedVariant?.imageUrl) {
      const variantImg: GalleryImage = { src: selectedVariant.imageUrl };
      return [variantImg, ...images.filter((img) => img.src !== selectedVariant.imageUrl)];
    }
    return images;
  }, [selectedVariant?.imageUrl, images]);

  useEffect(() => { setSelectedImage(0); }, [selectedVariant?.imageUrl, product.id]);

  // ─── Add-to-cart with toast feedback (no auto-open, no setTimeout) ─────────
  const { add } = useCart();
  const toast   = useToast();

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
      priceAtTime:      price,
      isActive:         true,
      createdAt:        now,
      updatedAt:        now,
      productTitle:     product.title,
      image:            galleryImages[0]?.src,
      variantLabel:     variantSize(selectedVariant, product.slug),
      maxStock:         selectedVariant.stockQuantity,
    });
    toast.push({
      variant: 'success',
      title:   'Added to cart',
      message: `${product.title} (${variantSize(selectedVariant, product.slug)}) × ${quantity}`,
    });
  };

  const stockLine =
    !inStock                          ? { tone: 'danger',   text: 'Out of stock' }
    : selectedVariant && selectedVariant.stockQuantity === 0
                                      ? { tone: 'danger',   text: 'This size is sold out' }
    : selectedVariant && selectedVariant.stockQuantity <= LOW_STOCK_THRESHOLD
                                      ? { tone: 'caution',  text: `Only ${selectedVariant.stockQuantity} left in this size` }
    : totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD
                                      ? { tone: 'caution',  text: `Only ${totalStock} left in stock` }
                                      : { tone: 'success',  text: 'In stock' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12">
      <ProductGallery
        images={galleryImages}
        title={product.title}
        selectedIndex={selectedImage}
        onSelect={setSelectedImage}
        onZoom={() => setLightboxOpen(true)}
        badge={meta.badge}
      />

      <div className="flex flex-col gap-5">
        <BrandKicker brand={product.brand ?? undefined} team={meta.team} sport={meta.sport} />

        <h1 className="font-sport text-4xl md:text-5xl text-primary leading-tight">
          {product.title}
        </h1>

        {/* Rating row — always reserved so layout doesn't shift when reviews load */}
        <div className="min-h-[20px]">
          {reviewCount > 0
            ? <StarRating value={rating} count={reviewCount} />
            : <span className="text-xs text-muted">No reviews yet</span>}
        </div>

        <PriceBlock
          price={price}
          originalPrice={onSale ? meta.originalPrice : undefined}
          currency={currency}
        />

        {offers.length > 0 && <OfferPills offers={offers} />}

        <StockLine tone={stockLine.tone} text={stockLine.text} />

        {description && (
          <p className="text-secondary text-sm leading-relaxed">{description}</p>
        )}

        {variants.length > 0 && (
          <VariantSelector
            variants={variants}
            slug={product.slug}
            selectedId={selectedVariantId}
            error={variantError}
            onSelect={(id) => {
              setSelectedVariantId(id);
              setVariantError(false);
              setQuantity(1);
            }}
            onOpenSizeGuide={() => setSizeGuideOpen(true)}
          />
        )}

        <BuyPanel
          quantity={quantity}
          maxQty={maxQty}
          inStock={inStock}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          isWishlisted={isWishlisted}
          onToggleWishlist={toggleWishlist}
        />

        <ShippingPreview />

        {meta.features.length > 0 && (
          <DetailAccordion title="Features" defaultOpen>
            <ul className="list-disc list-inside text-sm text-secondary space-y-1">
              {meta.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </DetailAccordion>
        )}

        {specs.length > 0 && (
          <DetailAccordion title="Specifications">
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              {specs.map((s) => (
                <div key={s.id} className="contents">
                  <dt className="text-muted uppercase tracking-widest text-[11px] self-center">{s.label}</dt>
                  <dd className="text-secondary">{s.value}</dd>
                </div>
              ))}
            </dl>
          </DetailAccordion>
        )}

        {meta.tags.length > 0 && <TagChips tags={meta.tags} />}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={galleryImages}
          index={selectedImage}
          onClose={() => setLightboxOpen(false)}
          onChange={setSelectedImage}
        />
      )}

      {sizeGuideOpen && <SizeGuideModal onClose={() => setSizeGuideOpen(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function ProductGallery({
  images, title, selectedIndex, onSelect, onZoom, badge,
}: {
  images: GalleryImage[]; title: string; selectedIndex: number;
  onSelect: (i: number) => void; onZoom: () => void; badge?: string;
}) {
  const active = images[selectedIndex];
  const Thumbnails = (
    <div
      className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 lg:flex-col lg:overflow-y-auto lg:pb-0 lg:pr-1 lg:max-h-[560px]"
      role="tablist"
      aria-label="Product images"
    >
      {images.map((img, i) => (
        <button
          key={`${img.src}-${i}`}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`View image ${i + 1}`}
          aria-pressed={selectedIndex === i}
          role="tab"
          className={[
            'shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all focus-accent',
            selectedIndex === i ? 'border-accent' : 'border-transparent hover:border-stroke',
          ].join(' ')}
        >
          <img src={img.src} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[5rem_1fr] lg:gap-4">
      {/* Vertical thumb strip on the left at lg+; horizontal strip below at smaller sizes. */}
      {images.length > 1 && <div className="hidden lg:block">{Thumbnails}</div>}

      <div>
        <button
          type="button"
          onClick={onZoom}
          aria-label={`Open ${title} image in viewer`}
          className="relative aspect-[4/5] w-full rounded-2xl bg-surface-raised overflow-hidden border border-stroke focus-accent group"
        >
          {active && (
            <img
              src={active.src}
              srcSet={active.srcSet}
              sizes="(min-width: 1024px) 55vw, 100vw"
              alt={active.alt ?? `${title} — view ${selectedIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          {badge && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
              {badge}
            </span>
          )}
          <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-surface/80 backdrop-blur text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14zM8 11h6M11 8v6" />
            </svg>
          </span>
        </button>

        {/* Horizontal strip at < lg */}
        {images.length > 1 && <div className="lg:hidden mt-4">{Thumbnails}</div>}
      </div>
    </div>
  );
}

function BrandKicker({ brand, team, sport }: { brand?: string; team?: string; sport?: string }) {
  const parts: { label: string; to?: string }[] = [];
  if (brand) parts.push({ label: brand, to: `/shop?brand=${encodeURIComponent(brand)}` });
  if (team)  parts.push({ label: team,  to: `/shop?team=${encodeURIComponent(team)}` });
  if (!brand && !team && sport) parts.push({ label: sport, to: `/shop?sport=${encodeURIComponent(sport)}` });
  if (parts.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
      {parts.map((p, i) => (
        <span key={p.label} className="contents">
          {i > 0 && <span className="text-stroke">·</span>}
          {p.to
            ? <Link to={p.to} className="hover:text-primary transition-colors">{p.label}</Link>
            : <span>{p.label}</span>}
        </span>
      ))}
    </div>
  );
}

function PriceBlock({
  price, originalPrice, currency,
}: { price: number; originalPrice?: number; currency: string }) {
  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <span className="text-3xl font-bold text-primary">{formatPrice(price, currency)}</span>
      {originalPrice !== undefined && (
        <>
          <span className="text-lg text-muted line-through">{formatPrice(originalPrice, currency)}</span>
          <span className="text-sm font-bold text-accent">{discountPercent(originalPrice, price)}</span>
        </>
      )}
    </div>
  );
}

function StockLine({ tone, text }: { tone: string; text: string }) {
  const color =
    tone === 'danger'  ? 'text-danger'
    : tone === 'caution' ? 'text-caution'
    : 'text-delivered';
  return (
    <p className={`text-xs font-semibold uppercase tracking-widest ${color}`} aria-live="polite">
      {text}
    </p>
  );
}

function VariantSelector({
  variants, slug, selectedId, error, onSelect, onOpenSizeGuide,
}: {
  variants: ProductVariant[]; slug: string;
  selectedId: string; error: boolean;
  onSelect: (id: string) => void;
  onOpenSizeGuide: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium ${error ? 'text-danger' : 'text-secondary'}`}>
          {error ? 'Please select a size' : 'Select Size'}
        </span>
        <button
          type="button"
          onClick={onOpenSizeGuide}
          className="text-xs uppercase tracking-widest text-muted hover:text-primary underline-offset-4 hover:underline focus-accent"
        >
          Size guide
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
        {variants.map((v) => {
          const out      = v.stockQuantity === 0;
          const selected = selectedId === v.id;
          const label    = variantSize(v, slug);
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-pressed={selected}
              disabled={out}
              onClick={() => onSelect(v.id)}
              className={[
                'min-w-[3rem] px-3 py-2 rounded-lg border-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer',
                'focus-accent',
                out
                  ? 'border-stroke text-muted opacity-40 cursor-not-allowed line-through'
                  : selected
                  ? 'border-accent bg-accent/10 text-primary ring-2 ring-accent/40'
                  : 'border-stroke text-secondary hover:border-white hover:text-white',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BuyPanel({
  quantity, maxQty, inStock, onQuantityChange, onAddToCart,
  isWishlisted, onToggleWishlist,
}: {
  quantity: number; maxQty: number; inStock: boolean;
  onQuantityChange: (n: number) => void;
  onAddToCart: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="flex items-center border border-stroke rounded-xl overflow-hidden self-start sm:self-stretch">
        <button
          type="button"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
          className="px-3 text-secondary hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-40 h-full focus-accent"
        >−</button>
        <span className="px-4 py-2.5 text-sm font-semibold text-primary min-w-[3rem] text-center border-x border-stroke">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
          disabled={quantity >= maxQty}
          aria-label="Increase quantity"
          className="px-3 text-secondary hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-40 h-full focus-accent"
        >+</button>
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        disabled={!inStock}
        className={[
          'flex-1 flex items-center justify-center gap-2',
          'px-5 py-3 rounded-xl',
          'bg-black text-white font-bold text-sm tracking-wider uppercase',
          'border-2 border-white',
          'hover:bg-accent hover:border-accent',
          'active:scale-[0.98] transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:border-white',
          'focus-accent',
        ].join(' ')}
      >
        {inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>

      <button
        type="button"
        onClick={onToggleWishlist}
        aria-pressed={isWishlisted}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={[
          'shrink-0 sm:w-12 sm:h-auto h-12 flex items-center justify-center rounded-xl border-2 transition-colors focus-accent',
          isWishlisted
            ? 'bg-accent/10 border-accent text-accent'
            : 'border-stroke text-secondary hover:border-accent hover:text-accent',
        ].join(' ')}
      >
        <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
        </svg>
      </button>
    </div>
  );
}

function ShippingPreview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
      {[
        { icon: '🚚', label: 'Free shipping', detail: 'On orders over $75' },
        { icon: '↩️', label: '30-day returns', detail: 'Unworn & in original packaging' },
        { icon: '🔒', label: 'Secure checkout', detail: 'TLS-encrypted payments' },
      ].map((row) => (
        <div key={row.label} className="flex items-start gap-2 p-3 rounded-xl bg-surface-raised border border-stroke">
          <span className="text-base leading-none" aria-hidden="true">{row.icon}</span>
          <div className="min-w-0">
            <p className="font-semibold text-primary leading-tight">{row.label}</p>
            <p className="text-muted leading-tight">{row.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const rows = [
    { size: 'XS', chest: '32–34', length: '26' },
    { size: 'S',  chest: '34–36', length: '27' },
    { size: 'M',  chest: '38–40', length: '28' },
    { size: 'L',  chest: '42–44', length: '29' },
    { size: 'XL', chest: '46–48', length: '30' },
    { size: 'XXL', chest: '50–52', length: '31' },
  ];

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-surface border border-stroke rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 id="size-guide-title" className="font-sport text-2xl text-primary">Size Guide</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="w-9 h-9 rounded-full text-muted hover:text-primary hover:bg-surface-raised transition-colors focus-accent"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-muted mb-4">All measurements in inches. Choose the next size up if you're between sizes.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-[11px] uppercase tracking-widest">
              <th className="text-left py-2 font-semibold">Size</th>
              <th className="text-left py-2 font-semibold">Chest</th>
              <th className="text-left py-2 font-semibold">Length</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-t border-stroke">
                <td className="py-2 font-bold text-primary">{r.size}</td>
                <td className="py-2 text-secondary">{r.chest}"</td>
                <td className="py-2 text-secondary">{r.length}"</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailAccordion({
  title, defaultOpen = false, children,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-stroke pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-primary uppercase tracking-widest"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pt-2 pb-3">{children}</div>}
    </div>
  );
}

function OfferPills({ offers }: { offers: SpecialOffer[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {offers.map((o) => {
        const valueLabel = o.discountType === 'percentage'
          ? `−${o.discountValue}%`
          : `−${formatPrice(o.discountValue)}`;
        return (
          <span
            key={o.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/40 text-xs"
            title={o.description ?? ''}
          >
            <span className="font-bold text-accent">{valueLabel}</span>
            <span className="text-secondary">{o.title}</span>
          </span>
        );
      })}
    </div>
  );
}

function TagChips({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-stroke">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-2.5 py-1 rounded-lg bg-surface-raised border border-stroke text-xs text-muted"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
